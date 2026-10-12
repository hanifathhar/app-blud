const fs = require('fs');
const filePath = 'app/dashboard/verifikasi/sp3b/cetak/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the escaped backtick problem in the style dangerouslySetInnerHTML
// The script wrote \` and \${...} instead of ` and ${...}
const oldStyleTag = "dangerouslySetInnerHTML={{ __html: \\`\n          @media print {\n            body { background-color: transparent !important; margin: 0 !important; padding: 0 !important; }\n            .no-print { display: none !important; }\n            .print-sheet { width: 100% !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }\n            @page { size: \\${pageSizeStyle}; margin: 13mm 13mm 13mm 13mm; }\n          }\n        \\` }}";

const newStyleTag = "dangerouslySetInnerHTML={{ __html: `\n          @media print {\n            body { background-color: transparent !important; margin: 0 !important; padding: 0 !important; }\n            .no-print { display: none !important; }\n            .print-sheet { width: 100% !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }\n            @page { size: ${pageSizeStyle}; margin: 13mm 13mm 13mm 13mm; }\n          }\n        ` }}";

const fixed = content.replace(oldStyleTag, newStyleTag);

if (fixed === content) {
  console.log('No replacement made - trying hex approach...');
  // Find lines 137-144 by index and replace them
  const lines = content.split('\n');
  console.log('Line 137 raw hex:', Buffer.from(lines[136]).toString('hex').substring(0, 80));
  console.log('Line 137 text:', lines[136]);
} else {
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log('Fixed successfully!');
}
