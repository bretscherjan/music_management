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

        const classReplacements = [
            // Dark Green
            ['-[#405116]', '-green-800'],
            // Light Green
            ['-[#BDD18C]', '-green-300'],
            // Specific overrides in UI
            ['text-yellow-600', 'text-amber-600'], // More modern tailwind
            ['bg-red-500', 'bg-destructive'],
            ['text-red-500', 'text-destructive'],
            ['bg-red-600', 'bg-destructive/90']
        ];

        // Replace Tailwind Arbitrary Value Classes (bg-[#405116] -> bg-green-800)
        for (const [oldClass, newClass] of classReplacements) {
            content = content.split('bg' + oldClass).join('bg' + newClass);
            content = content.split('text' + oldClass).join('text' + newClass);
            content = content.split('border' + oldClass).join('border' + newClass);
            content = content.split('ring' + oldClass).join('ring' + newClass);
            content = content.split('fill' + oldClass).join('fill' + newClass);
            content = content.split('stroke' + oldClass).join('stroke' + newClass);
            content = content.split('accent' + oldClass).join('accent' + newClass);

            // Handle opacities like bg-[#405116]/20
            for (let i = 1; i <= 9; i++) {
                content = content.split('bg' + oldClass + '/' + (i*10)).join('bg' + newClass + '/' + (i*10));
                content = content.split('border' + oldClass + '/' + (i*10)).join('border' + newClass + '/' + (i*10));
                content = content.split('text' + oldClass + '/' + (i*10)).join('text' + newClass + '/' + (i*10));
                content = content.split('bg' + oldClass + '/0' + (i*10)).join('bg' + newClass + '/' + (i*10));
            }
        }

        // Replace direct string literals used in stroke/fill attributes or inline styles
        const stringReplacements = [
            ['#405116', 'var(--color-green-800)'],
            ['#BDD18C', 'var(--color-green-300)'],
            ['#ef4444', 'var(--color-red-500)'],
            ['#e5e7eb', 'var(--color-gray-200)'],
            ['#9ca3af', 'var(--color-gray-400)'],
            ['#1e3a5f', 'var(--color-blue-900)'],
            ['#7a3f1e', 'var(--color-orange-800)'],
            ['#4a2f6a', 'var(--color-purple-900)']
        ];

        for (const [hex, variable] of stringReplacements) {
            // Only replace if they are in single or double quotes, because they are inside SVG props or JS logic
            content = content.split("'" + hex + "'").join("'" + variable + "'");
            content = content.split('"' + hex + '"').join('"' + variable + '"');
            content = content.split('`' + hex + '`').join('`' + variable + '`');
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed hex in ' + filePath);
        }
    }
});
