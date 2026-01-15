const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const API_URL = 'http://localhost:3004/api';
const UPLOAD_DIR = path.join(__dirname, 'uploads');

async function main() {
    let token;

    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@musig-elgg.ch',
            password: 'Admin1234!'
        });
        token = loginRes.data.token;
        console.log('   Logged in.');

        const headers = { Authorization: `Bearer ${token}` };

        // Test 1: Single File Deletion
        console.log('\n2. Test: Single File Deletion');
        fs.writeFileSync('test_del.txt', 'Delete me');
        const form1 = new FormData();
        form1.append('file', fs.createReadStream('test_del.txt'));
        form1.append('visibility', 'all');
        form1.append('folder', '/TempTest');

        const upload1 = await axios.post(`${API_URL}/files/upload`, form1, { headers: { ...headers, ...form1.getHeaders() } });
        const file1Id = upload1.data.file.id;
        const file1Path = path.join(UPLOAD_DIR, upload1.data.file.filename);

        console.log(`   Uploaded file ID ${file1Id} at ${file1Path}`);

        // Check FS existence
        if (!fs.existsSync(file1Path)) throw new Error('File verified not on disk after upload!');
        console.log('   FS Check: OK');

        // Delete
        await axios.delete(`${API_URL}/files/${file1Id}`, { headers });
        console.log('   Deleted file via API.');

        // Check FS absence
        if (fs.existsSync(file1Path)) throw new Error('File still on disk after deletion!');
        console.log('   FS Absence Check: OK (File gone)');

        // Verify DB absence (optional, API verification implies it)

        // Test 2: Folder Deletion
        console.log('\n3. Test: Folder Deletion');
        fs.writeFileSync('test_folder_del.txt', 'Delete folder');
        const form2 = new FormData();
        form2.append('file', fs.createReadStream('test_folder_del.txt'));
        form2.append('folder', '/DeleteMe/SubFolder');

        const upload2 = await axios.post(`${API_URL}/files/upload`, form2, { headers: { ...headers, ...form2.getHeaders() } });
        const file2Path = path.join(UPLOAD_DIR, upload2.data.file.filename);

        console.log(`   Uploaded file to /DeleteMe/SubFolder. Path: ${file2Path}`);
        if (!fs.existsSync(file2Path)) throw new Error('File 2 verified not on disk!');

        // Delete Folder /DeleteMe
        console.log('   Deleting folder /DeleteMe ...');
        await axios.delete(`${API_URL}/files/folders?folder=/DeleteMe`, { headers });

        // Check FS absence
        if (fs.existsSync(file2Path)) throw new Error('File in deleted folder still on disk!');
        console.log('   FS Absence Check: OK (Folder content gone)');

        console.log('\nSUCCESS: All deletion tests passed.');

        // Cleanup
        if (fs.existsSync('test_del.txt')) fs.unlinkSync('test_del.txt');
        if (fs.existsSync('test_folder_del.txt')) fs.unlinkSync('test_folder_del.txt');

    } catch (error) {
        console.error('TEST FAILED:', error.response?.data || error.message);
        process.exit(1);
    }
}

main();
