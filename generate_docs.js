const fs = require('fs');
const path = require('path');

const servicesPath = path.join('c:', 'data', '030_BBW', '050_Module_Semester4', '020_Modul347', 'music_management', 'services');

function parseRoutes(filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const routes = [];
    
    let currentRoute = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Match @route
        const routeMatch = line.match(/@route\s+(GET|POST|PUT|DELETE|PATCH)\s+([^\s\r]+)/i);
        if (routeMatch) {
            currentRoute = {
                method: routeMatch[1].toUpperCase(),
                path: routeMatch[2].trim(),
                desc: 'Keine Beschreibung',
                access: 'Public'
            };
        }
        
        // Match @desc
        if (currentRoute) {
            const descMatch = line.match(/@desc\s+(.*)/i);
            if (descMatch) {
                currentRoute.desc = descMatch[1].trim().replace(/\r/g, '');
            }
            
            // Match @access
            const accessMatch = line.match(/@access\s+(.*)/i);
            if (accessMatch) {
                currentRoute.access = accessMatch[1].trim().replace(/\r/g, '');
            }
        }
        
        // Match end of JSDoc or the router function definition
        if (line.includes('router.') || line.includes('*/')) {
            if (currentRoute) {
                routes.push(currentRoute);
                currentRoute = null;
            }
        }
    }
    return routes;
}

const services = ['auth-service', 'event-service', 'file-service', 'chat-service'];
let md = '# API Dokumentation\n\nDiese Dokumentation enthält alle API-Endpunkte der Microservices.\n\n';

services.forEach(service => {
    md += `## 📦 ${service.toUpperCase()}\n\n`;
    md += `| Methode | Endpunkt | Beschreibung | Zugriff |\n`;
    md += `|---------|----------|--------------|---------|\n`;
    
    const routesDir = path.join(servicesPath, service, 'src', 'routes');
    if (fs.existsSync(routesDir)) {
        const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
        files.forEach(file => {
            const filePath = path.join(routesDir, file);
            const routes = parseRoutes(filePath);
            
            // Remove duplicates (sometimes JSDoc and router line are close)
            const uniqueRoutes = Array.from(new Set(routes.map(r => JSON.stringify(r)))).map(s => JSON.parse(s));
            
            uniqueRoutes.forEach(r => {
                md += `| **${r.method}** | \`${r.path}\` | ${r.desc} | *${r.access}* |\n`;
            });
        });
    }
    md += '\n';
});

fs.writeFileSync(path.join('C:', 'Users', 'jb', '.gemini', 'antigravity', 'brain', '10d57f91-3ccd-4b1d-9ac4-a02ae4401267', 'api_documentation.md'), md);
console.log('Dokumentation generiert.');
