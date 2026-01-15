const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000/api';

async function main() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@musig-elgg.ch',
            password: 'Admin1234!'
        });
        const token = loginRes.data.token;
        console.log('Logged in.');

        // 2. Create dummy file
        fs.writeFileSync('testupload.txt', 'This is a test upload content.');

        // 3. Upload file to /Deep/Nested/Folder
        console.log('Uploading file...');
        const form = new FormData();
        form.append('file', fs.createReadStream('testupload.txt'));
        form.append('folder', '/Deep/Nested/Folder');
        form.append('visibility', 'all');

        await axios.post(`${API_URL}/files/upload`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        console.log('File uploaded to /Deep/Nested/Folder');

        // Cleanup
        fs.unlinkSync('testupload.txt');

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

main();
