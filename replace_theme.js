const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { search: /#D70F64/gi, replace: '#39772A' },
  { search: /#C20D5A/gi, replace: '#2E5F22' },
  { search: /#fce7f3/gi, replace: '#D8E9D6' },
  { search: /215,\s*15,\s*100/g, replace: '57, 119, 42' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.css') || fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          // Re-instantiate RegExp for global replace if needed, but since it has 'g' flag, string.replace works on all instances.
          // Reset lastIndex just in case
          search.lastIndex = 0;
          content = content.replace(search, replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated colors in: ${fullPath}`);
      }
    }
  }
}

console.log('Starting global theme color replacement...');
processDirectory(srcDir);
console.log('Finished replacing colors.');
