const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");
const forge = require("node-forge");

async function getCertificateAndPrivateKeyFromKeyVault() {
  try {
  
    const keyVaultUrl = "https://fab-project-secrets.vault.azure.net/"; 
    const secretName = "test"; 
    const pfxPassword = "FabBank@2024"; 

    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(keyVaultUrl, credential);

    console.log("Retrieving the PFX file from Azure Key Vault...");
    const secret = await secretClient.getSecret(secretName);
    console.log("secret==>>",secret)
    const pfxBase64 = secret.value;

    if (!pfxBase64) {
      throw new Error("The secret does not contain PFX data.");
    }

    const pfxBuffer = Buffer.from(pfxBase64, "base64");
    console.log("PFX file retrieved and decoded.");

    console.log("Parsing the PFX file...");
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, pfxPassword);

    let privateKey = null;
    let certificate = null;

    for (const safeContents of p12.safeContents) {
      for (const safeBag of safeContents.safeBags) {

        if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
          privateKey = forge.pki.privateKeyToPem(safeBag.key);
        }

        if (safeBag.type === forge.pki.oids.certBag) {
          certificate = forge.pki.certificateToPem(safeBag.cert);
        }
      }
    }

    if (privateKey) {
      console.log("Private Key:\n", privateKey);
    } else {
      console.log("No private key found in the PFX file.");
    }

    if (certificate) {
      console.log("Certificate:\n", certificate);
    } else {
      console.log("No certificate found in the PFX file.");
    }

    return { privateKey, certificate };
  } catch (error) {
    console.error("Error extracting certificate and private key:", error.message);
  }
}

getCertificateAndPrivateKeyFromKeyVault();
