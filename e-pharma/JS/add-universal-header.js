// Universal Header Updater
// This script must be run directly on each HTML page
// It will add the required header scripts to the current page

(function() {
  // Scripts to add
  const scripts = [
    { src: '../JS/header-fix.js', id: 'header-fix-script' },
    { src: '../JS/user-auth-final.js', id: 'user-auth-final-script' }
  ];
  
  // Function to add a script to the head
  function addScript(src, id) {
    // Check if script already exists
    if (document.getElementById(id)) {
      console.log(`Script ${id} already exists`);
      return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    
    // Add to head
    document.head.appendChild(script);
    console.log(`Added script: ${src}`);
  }
  
  // Add all scripts
  scripts.forEach(script => {
    addScript(script.src, script.id);
  });
  
  console.log('Header scripts added to page');
})();
