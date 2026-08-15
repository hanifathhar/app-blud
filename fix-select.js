const fs = require('fs');

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all `<Select` with `<Select menuPosition="fixed"` if not already present
    content = content.replace(/<Select\s+(?!.*menuPosition="fixed")/g, '<Select menuPosition="fixed" ');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
}

processFile('app/dashboard/perencanaan/puk/create/page.tsx');
processFile('app/dashboard/perencanaan/puk/page.tsx');
// Use explicit path for rincian
const rincianPath = fs.readdirSync('app/dashboard/perencanaan/puk').find(d => d.startsWith('[id]'));
if (rincianPath) {
    processFile(`app/dashboard/perencanaan/puk/${rincianPath}/rincian/page.tsx`);
}
