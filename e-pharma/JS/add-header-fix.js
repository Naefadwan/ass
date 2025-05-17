// Script to add header-fix.js to all HTML files
const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, '..', 'html');
const headerFixScript = '<script src="../JS/header-fix.js"></script>';

// Get all HTML files in the directory
const files = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));

console.log(`Found ${files.length} HTML files in ${htmlDir}`);

let updatedCount = 0;

// Process each HTML file
files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if header-fix.js already exists in the file
  if (content.includes(headerFixScript)) {
    console.log(`✓ ${file} already has header-fix.js`);
    return;
  }
  
  // Find </head> tag to insert the script before it
  let headIndex = content.indexOf('</head>');
  
  if (headIndex !== -1) {
    // Insert header-fix.js script before </head>
    const newContent = content.slice(0, headIndex) + 
                        `\n    ${headerFixScript}\n` + 
                        content.slice(headIndex);
    
    // Write back to file
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Added header-fix.js to ${file}`);
    updatedCount++;
  } else {
    console.log(`❌ Couldn't find </head> tag in ${file}`);
  }
});

console.log(`\nSummary: Added header-fix.js to ${updatedCount} files.`);
console.log('Login state persistence should now work across all pages.');
