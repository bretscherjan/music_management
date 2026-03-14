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

        const replacements = [
            ['bg-[hsl(var(--musig-primary))]', 'bg-brand-primary'],
            ['text-[hsl(var(--musig-primary))]', 'text-brand-primary'],
            ['border-[hsl(var(--musig-primary))]', 'border-brand-primary'],
            ['from-[hsl(var(--musig-primary))]', 'from-brand-primary'],
            ['to-[hsl(var(--musig-primary))]', 'to-brand-primary'],
            ['ring-[hsl(var(--musig-primary))]', 'ring-brand-primary'],
            ['fill-[hsl(var(--musig-primary))]', 'fill-brand-primary'],

            ['bg-[hsl(var(--musig-contrast))]', 'bg-brand-secondary'],
            ['text-[hsl(var(--musig-contrast))]', 'text-brand-secondary'],
            ['border-[hsl(var(--musig-contrast))]', 'border-brand-secondary'],
            ['from-[hsl(var(--musig-contrast))]', 'from-brand-secondary'],
            ['to-[hsl(var(--musig-contrast))]', 'to-brand-secondary'],
            ['ring-[hsl(var(--musig-contrast))]', 'ring-brand-secondary'],
            ['fill-[hsl(var(--musig-contrast))]', 'fill-brand-secondary'],

            ['bg-[hsl(var(--background))]', 'bg-background'],
            ['text-[hsl(var(--background))]', 'text-background'],
            ['border-[hsl(var(--background))]', 'border-background'],

            ['bg-[hsl(var(--foreground))]', 'bg-foreground'],
            ['text-[hsl(var(--foreground))]', 'text-foreground'],
            ['border-[hsl(var(--foreground))]', 'border-foreground'],

            ['bg-[hsl(var(--muted-foreground))]', 'bg-muted-foreground'],
            ['text-[hsl(var(--muted-foreground))]', 'text-muted-foreground'],
            ['border-[hsl(var(--muted-foreground))]', 'border-muted-foreground'],
            
            ['[var(--member-primary)]', 'brand-primary'],
            ['[var(--member-primary-muted)]', 'brand-primary/10'],
            ['text-[hsl(var(--musig-light))]', 'text-white']
        ];

        for (const [oldClass, newClass] of replacements) {
            content = content.split(oldClass).join(newClass);
            // Handle opacities
            for (let i = 1; i <= 9; i++) {
                content = content.split(oldClass + '/' + (i*10)).join(newClass + '/' + (i*10));
                content = content.split(oldClass + '/0' + (i*10)).join(newClass + '/' + (i*10));
            }
            content = content.split(oldClass + '/5').join(newClass + '/5');
            content = content.split(oldClass + '/9').join(newClass + '/9');
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated ' + filePath);
        }
    }
});
