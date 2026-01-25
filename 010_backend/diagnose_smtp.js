require('dotenv').config();
const nodemailer = require('nodemailer');

const configs = [
    {
        name: 'Port 465 (Secure) - Default',
        port: 465,
        secure: true,
        tls: { rejectUnauthorized: false }
    },
    {
        name: 'Port 465 (Secure) - SSLv3 Cipher',
        port: 465,
        secure: true,
        tls: { rejectUnauthorized: false, ciphers: 'SSLv3' }
    },
    {
        name: 'Port 465 (Secure) - SECLEVEL=0',
        port: 465,
        secure: true,
        tls: { rejectUnauthorized: false, ciphers: 'DEFAULT@SECLEVEL=0' }
    },
    {
        name: 'Port 465 (Secure) - TLSv1.2 Min',
        port: 465,
        secure: true,
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    },
    {
        name: 'Port 465 (Secure) - TLSv1 Min + SECLEVEL=0',
        port: 465,
        secure: true,
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1', ciphers: 'DEFAULT@SECLEVEL=0' }
    },
    {
        name: 'Port 587 (STARTTLS) - Default',
        port: 587,
        secure: false,
        tls: { rejectUnauthorized: false }
    },
    {
        name: 'Port 587 (STARTTLS) - SECLEVEL=0',
        port: 587,
        secure: false,
        tls: { rejectUnauthorized: false, ciphers: 'DEFAULT@SECLEVEL=0' }
    },
    {
        name: 'Port 465 (Secure) - Ciphers: ALL',
        port: 465,
        secure: true,
        tls: { rejectUnauthorized: false, ciphers: 'ALL' }
    },
    {
        name: 'Port 25 (Unencrypted/STARTTLS) - No Secure',
        port: 25,
        secure: false,
        tls: { rejectUnauthorized: false },
        ignoreTLS: true // Try to force no TLS if possible, or just standard connection
    }
];

async function testConfig(config) {
    console.log(`\nTesting: ${config.name}...`);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'mail.musig-elgg.ch',
        port: config.port,
        secure: config.secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: config.tls,
        ignoreTLS: config.ignoreTLS, // Pass this!
        // Debug options
        logger: false,
        debug: false
    });

    try {
        await transporter.verify();
        console.log(`✅ SUCCESS: ${config.name} connected successfully!`);
        return true;
    } catch (err) {
        console.log(`❌ FAILED: ${config.name}`);
        console.log(`   Error: ${err.message}`);
        return false;
    }
}

async function run() {
    console.log('--- SMTP DIAGNOSTIC TOOL ---');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    let success = false;
    for (const config of configs) {
        if (await testConfig(config)) {
            success = true;
            console.log('\n!!! FOUND WORKING CONFIGURATION !!!');
            console.log(JSON.stringify(config.tls, null, 2));
            break;
        }
    }

    if (!success) {
        console.log('\n❌ ALL CONFIGURATIONS FAILED.');
        console.log('Please check server firewall or credentials.');
    }
}

run();
