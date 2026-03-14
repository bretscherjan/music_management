const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Map tailwind green to semantic success variables
        const replacements = [
            // Backgrounds
            ['bg-green-50', 'bg-success/5'],
            ['bg-green-100', 'bg-success/10'],
            ['bg-green-200', 'bg-success/20'],
            ['bg-green-300', 'bg-success/30'],
            ['bg-green-400', 'bg-success/40'],
            ['bg-green-500', 'bg-success'],
            ['bg-green-600', 'bg-success'],
            ['bg-green-700', 'bg-success'],
            ['bg-green-800', 'bg-success'],
            ['bg-green-900', 'bg-success'],
            ['bg-green-950', 'bg-success'],

            // Text
            ['text-green-50', 'text-success'],
            ['text-green-100', 'text-success'],
            ['text-green-200', 'text-success'],
            ['text-green-300', 'text-success'],
            ['text-green-400', 'text-success'],
            ['text-green-500', 'text-success'],
            ['text-green-600', 'text-success'],
            ['text-green-700', 'text-success'],
            ['text-green-800', 'text-success'],
            ['text-green-900', 'text-success'],
            ['text-green-950', 'text-success'],
            
            // Borders
            ['border-green-50', 'border-success/5'],
            ['border-green-100', 'border-success/10'],
            ['border-green-200', 'border-success/20'],
            ['border-green-300', 'border-success/30'],
            ['border-green-400', 'border-success/40'],
            ['border-green-500', 'border-success'],
            ['border-green-600', 'border-success'],
            ['border-green-700', 'border-success'],
            ['border-green-800', 'border-success'],
            ['border-green-900', 'border-success'],

            // Rings and others
            ['ring-green-100', 'ring-success/10'],
            ['ring-green-200', 'ring-success/20'],
            ['ring-green-500', 'ring-success/50'],
            
            ['fill-green-500', 'fill-success'],
            ['stroke-green-500', 'stroke-success'],
            ['accent-green-500', 'accent-success']
        ];

        for (const [oldVal, newVal] of replacements) {
            content = content.split(oldVal).join(newVal);
        }

        // Clean up weird double opacities from string replacements like bg-success/10/20
        content = content.replace(/bg-success\/(\d+)\/(\d+)/g, 'bg-success/$2');
        content = content.replace(/bg-success\/(\d+)\/0(\d+)/g, 'bg-success/$2');
        content = content.replace(/border-success\/(\d+)\/(\d+)/g, 'border-success/$2');

        // Dark mode variables like dark:bg-green-900 -> dark:bg-success/20
        // (Handled automatically since replacing "bg-green-900" inside "dark:bg-green-900" yields "dark:bg-success")

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Replaced semantic green in ' + filePath);
        }
    }
});
