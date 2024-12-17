const { DefaultAzureCredential } = require('@azure/identity');
const { CertificateClient } = require('@azure/keyvault-certificates');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Azure Key Vault details
const keyVaultName = 'FAB-Project-Secrets';
const certificateName = 'test';
const credential = new DefaultAzureCredential();
const vaultUrl = `https://fab-project-secrets.vault.azure.net`;

// Create a CertificateClient
const client = new CertificateClient(vaultUrl, credential);

async function extractCertificateAndKey() {
    try {
        // Retrieve the certificate (PFX)
        const certificate = await client.getCertificate(certificateName);
        const pfxBase64 = certificate.cer.toString('base64');
        const pfxBuffer = Buffer.from(pfxBase64, 'base64');
        console.log("pfxBuffer",pfxBuffer)
        // Save the PFX to a temporary file
        const pfxFilePath = path.join(__dirname, 'temp.pfx');
        fs.writeFileSync(pfxFilePath, pfxBuffer);

        // Extract the certificate and private key using OpenSSL
        const certFilePath = path.join(__dirname, 'certificate.crt');
        const keyFilePath = path.join(__dirname, 'private.key');

        exec(`openssl pkcs12 -in ${pfxFilePath} -clcerts -nokeys -out ${certFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error extracting certificate: ${stderr}`);
                return;
            }
            console.log(`Certificate extracted to ${certFilePath}`,stdout);

            exec(`openssl pkcs12 -in ${pfxFilePath} -nocerts -out ${keyFilePath} -nodes`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error extracting private key: ${stderr}`);
                    return;
                }
                console.log(`Private key extracted to ${keyFilePath}`);

                // Clean up temporary PFX file
                fs.unlinkSync(pfxFilePath);
            });
        });
    } catch (error) {
        console.error('Error retrieving certificate from Key Vault:', error);
    }
}

extractCertificateAndKey();