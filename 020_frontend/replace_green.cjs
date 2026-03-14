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

        // Semantic Brand replacements (blue tones)
        const replacements = [
            // Classes
            ['green-800', 'brand-primary'],
            ['green-300', 'brand-primary/50'],
            
            // Raw CSS variables
            ['var(--color-green-800)', 'hsl(var(--brand-primary))'],
            ['var(--color-green-300)', 'hsl(var(--brand-primary) / 0.5)'],
            
            // Raw Hex that might still be left
            ['#405116', 'hsl(var(--brand-primary))'],
            ['#BDD18C', 'hsl(var(--brand-primary) / 0.5)']
        ];

        for (const [oldVal, newVal] of replacements) {
            content = content.split(oldVal).join(newVal);
        }

        // Fix double opacities like bg-brand-primary/50/20 which might happen if old class was green-300/20
        // e.g. bg-brand-primary/50/20 -> bg-brand-primary/20
        for (let i = 1; i <= 9; i++) {
            content = content.split('brand-primary/50/' + (i*10)).join('brand-primary/' + (i*10));
            content = content.split('brand-primary/50/0' + (i*10)).join('brand-primary/' + (i*10));
        }
        
        // Also fix raw hsl(var(--brand-primary) / 0.5) if it's placed in a tailwind class incorrectly
        // wait, we replaced 'green-800' with 'brand-primary', so 'bg-green-800' becomes 'bg-brand-primary'. Correct.
        // And 'var(--color-green-800)' becomes 'hsl(var(--brand-primary))'. Correct.

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Replaced green in ' + filePath);
        }
    }
});
