const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../010_backend');
const destDir = path.resolve(__dirname);

const routes = [
    'auth.routes.js', 'admin.routes.js', 'user.routes.js', 
    'register.routes.js', 'settings.routes.js', 'contact.routes.js', 'public.routes.js'
];

const controllers = [
    'auth.controller.js', 'admin.controller.js', 'user.controller.js', 
    'register.controller.js', 'settings.controller.js', 'contact.controller.js'
];

function copyAndTransform(type, file, replacements) {
    const srcPath = path.join(srcDir, 'src', type, file);
    const destPath = path.join(destDir, 'src', type, file);
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    if (!fs.existsSync(srcPath)) {
        console.error(`Missing: ${srcPath}`);
        return;
    }

    let content = fs.readFileSync(srcPath, 'utf8');
    
    for (const [search, replace] of Object.entries(replacements)) {
        content = content.replace(new RegExp(search, 'g'), replace);
    }
    
    fs.writeFileSync(destPath, content);
    console.log(`Copied & transformed ${type}/${file}`);
}

const routeReplacements = {
    "'\\.\\./middlewares/": "'../../../../packages/shared/src/middlewares/",
    "'\\.\\./validations/": "'../../../../packages/shared/src/validations/"
};

const controllerReplacements = {
    "'\\.\\./middlewares/": "'../../../../packages/shared/src/middlewares/",
    "'\\.\\./utils/": "'../../../../packages/shared/src/utils/"
};

routes.forEach(r => copyAndTransform('routes', r, routeReplacements));
controllers.forEach(c => copyAndTransform('controllers', c, controllerReplacements));

