const { exec } = require('child_process');
const fs = require('fs');
const { DefaultAzureCredential } = require('@azure/identity');
const { CertificateClient } = require('@azure/keyvault-certificates');

// Azure Key Vault client setup
const vaultUrl = 'https://fab-project-secrets.vault.azure.net';
const certificateName = 'test'; 
const certificateVersion = '7915f812a0de466295047d2f5460d690'; // Optional: Certificate Version

// Set up the Azure Key Vault certificate client
const credential = new DefaultAzureCredential();
const certificateClient = new CertificateClient(vaultUrl, credential);

async function fetchPfxAndExtract() {
    try {
        // Fetch certificate from Azure Key Vault
        const certificate = await certificateClient.getCertificate(certificateName, certificateVersion);

        // Convert certificate to .pfx format (if in base64)
        const pfxData = certificate.cer;

        // Write the .pfx data to a temporary file
        const pfxPath = './certificate.pfx';
        fs.writeFileSync(pfxPath, pfxData);

        // Extract the private key and certificate using OpenSSL
        const extractPrivateKeyCommand = `openssl pkcs12 -in ${pfxPath} -out private.key -nocerts -nodes -password pass:FabBank@2024`;
        const extractCertificateCommand = `openssl pkcs12 -in ${pfxPath} -out certificate.crt -clcerts -nokeys -password pass:FabBank@2024`;

        // Extract the private key
        exec(extractPrivateKeyCommand, (error, stdout, stderr) => {
            console.log("stdout",stderr)
            if (error) {
                console.error(`Error extracting private key: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log('Private key extracted successfully!');
            fs.writeFileSync('./private_key.key', stdout);  // Save private key as .key
        });

        // Extract the certificate
        exec(extractCertificateCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error extracting certificate: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log('Certificate extracted successfully!');
            fs.writeFileSync('./certificate.crt', stdout);  // Save certificate as .crt
        });

    } catch (error) {
        console.error(`Error fetching certificate from Key Vault: ${error}`);
    }
}

fetchPfxAndExtract();
