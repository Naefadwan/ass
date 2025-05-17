// Script to add header-fix.js and authentication to all pages
// Run this script once to update all HTML files

// Files to be added to all pages
const scriptsToAdd = [
  '<script src="../JS/header-fix.js"></script>',
  '<script src="../JS/user-auth-final.js"></script>'
];

// Function to find all HTML files
async function findAllHtmlFiles() {
  const htmlFiles = [];
  
  // Get all HTML files in the html directory
  const files = await fetch('../html/').then(response => response.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(files, 'text/html');
  
  // Extract file links
  const links = doc.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.endsWith('.html')) {
      htmlFiles.push(href);
    }
  });
  
  return htmlFiles;
}

// Function to add scripts to an HTML file
async function addScriptsToFile(filename) {
  try {
    // Fetch the file content
    const response = await fetch(`../html/${filename}`);
    if (!response.ok) {
      console.error(`Failed to fetch ${filename}: ${response.statusText}`);
      return false;
    }
    
    let html = await response.text();
    
    // Check if scripts are already present
    let modified = false;
    for (const script of scriptsToAdd) {
      if (!html.includes(script)) {
        // Add before </head>
        html = html.replace('</head>', `  ${script}\n</head>`);
        modified = true;
      }
    }
    
    if (modified) {
      // Create a download link to save the updated file
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.textContent = `Download updated ${filename}`;
      link.style.display = 'block';
      link.style.margin = '10px 0';
      
      document.getElementById('results').appendChild(link);
      
      return true;
    } else {
      console.log(`${filename} already has the required scripts.`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
    return false;
  }
}

// Main function
async function addHeaderToAllPages() {
  try {
    // Create a UI for the results
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    container.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    container.style.zIndex = '10000';
    container.style.maxHeight = '80vh';
    container.style.overflow = 'auto';
    container.style.borderRadius = '5px';
    container.style.width = '600px';
    
    const title = document.createElement('h2');
    title.textContent = 'Add Header to All Pages';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.textContent = 'This tool will update all HTML files to include the header-fix.js and authentication scripts.';
    container.appendChild(description);
    
    const results = document.createElement('div');
    results.id = 'results';
    container.appendChild(results);
    
    // Add manual form for updating specific files
    const manualForm = document.createElement('div');
    manualForm.style.marginTop = '20px';
    manualForm.style.padding = '10px';
    manualForm.style.backgroundColor = '#f5f5f5';
    manualForm.style.borderRadius = '5px';
    
    const manualTitle = document.createElement('h3');
    manualTitle.textContent = 'Update Specific HTML Files';
    manualForm.appendChild(manualTitle);
    
    const fileList = document.createElement('div');
    fileList.id = 'file-list';
    manualForm.appendChild(fileList);
    
    container.appendChild(manualForm);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '20px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#dc3545';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(container);
    container.appendChild(closeButton);
    
    document.body.appendChild(container);
    
    // Create a list of all HTML files with buttons to update them
    const htmlFiles = [
      'home2.html',
      'login.html',
      'register.html',
      'about.html',
      'contact.html',
      'cart.html',
      'dashboard.html',
      'admin.html',
      'ask ai.html',
      'consultation.html',
      'delivery.html',
      'location.html',
      'medicine-details.html',
      'prescription-upload.html',
      'skin care.html',
      'Existingmed.html',
      'test-registration.html'
    ];
    
    // Create a heading for the file list
    const fileListHeading = document.createElement('p');
    fileListHeading.textContent = 'Select files to update:';
    fileList.appendChild(fileListHeading);
    
    // Create checkboxes for each file
    htmlFiles.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.style.margin = '5px 0';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `file-${file}`;
      checkbox.value = file;
      checkbox.checked = true;
      
      const label = document.createElement('label');
      label.htmlFor = `file-${file}`;
      label.textContent = file;
      label.style.marginLeft = '5px';
      
      fileItem.appendChild(checkbox);
      fileItem.appendChild(label);
      fileList.appendChild(fileItem);
    });
    
    // Add update button
    const updateButton = document.createElement('button');
    updateButton.textContent = 'Update Selected Files';
    updateButton.style.marginTop = '10px';
    updateButton.style.padding = '5px 10px';
    updateButton.style.backgroundColor = '#28a745';
    updateButton.style.color = 'white';
    updateButton.style.border = 'none';
    updateButton.style.borderRadius = '3px';
    updateButton.style.cursor = 'pointer';
    
    updateButton.onclick = async () => {
      // Get selected files
      const selectedFiles = [];
      htmlFiles.forEach(file => {
        const checkbox = document.getElementById(`file-${file}`);
        if (checkbox.checked) {
          selectedFiles.push(file);
        }
      });
      
      // Update results area
      results.innerHTML = '<p>Processing selected files...</p>';
      
      // Process each file
      let updatedCount = 0;
      for (const file of selectedFiles) {
        const updated = await addScriptsToFile(file);
        if (updated) {
          updatedCount++;
        }
      }
      
      // Update results
      if (updatedCount > 0) {
        results.innerHTML = `<p>Updated ${updatedCount} files. Download each file and replace the original in your project.</p>`;
      } else {
        results.innerHTML = '<p>No files needed updating. All selected files already have the required scripts.</p>';
      }
    };
    
    fileList.appendChild(updateButton);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', addHeaderToAllPages);
