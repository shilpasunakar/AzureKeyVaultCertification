const { SecretClient } = require("@azure/keyvault-secrets");
const { DefaultAzureCredential } = require("@azure/identity");
const forge = require("node-forge");
const fs = require("fs");

async function getCertificateAndPrivateKeyFromKeyVault() {
  try {
    const keyVaultUrl = "https://fab-project-secrets.vault.azure.net"; // Replace
    const secretName = "test"; // Replace
    const pfxPassword = "FabBank@2024"; // Replace

    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(keyVaultUrl, credential);

    console.log("Retrieving the PFX file...");
    const secret = await secretClient.getSecret(secretName);
    const pfxBase64 = secret.value;

    if (!pfxBase64) throw new Error("The secret does not contain PFX data.");

    const pfxBuffer = Buffer.from(pfxBase64, "base64");
    fs.writeFileSync("retrieved.pfx", pfxBuffer); // Save to verify manually

    console.log("Testing PFX file format...");
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));

    console.log("Parsing the PFX file...");
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

    console.log("Private Key:\n", privateKey || "No private key found.");
    console.log("Certificate:\n", certificate || "No certificate found.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

getCertificateAndPrivateKeyFromKeyVault();
