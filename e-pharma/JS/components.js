// Function to load HTML components
function loadComponent(elementId, componentPath) {
  const element = document.getElementById(elementId)
  if (!element) return

  fetch(componentPath)
    .then((response) => response.text())
    .then((html) => {
      element.innerHTML = html
      // Dispatch event to notify that component is loaded
      document.dispatchEvent(new CustomEvent("componentLoaded", { detail: { id: elementId } }))
    })
    .catch((error) => console.error(`Error loading component ${componentPath}:`, error))
}

// Function to initialize components on a page
function initComponents() {
  // Load search bar if container exists
  if (document.getElementById("searchBarContainer")) {
    loadComponent("searchBarContainer", "/components/search-bar.html")
    document.addEventListener("componentLoaded", (e) => {
      if (e.detail.id === "searchBarContainer") {
        const script = document.createElement("script")
        script.src = "/js/search-bar.js"
        document.body.appendChild(script)
      }
    })
  }

  // Load featured products if container exists
  if (document.getElementById("featuredProductsContainer")) {
    loadComponent("featuredProductsContainer", "/components/featured-products.html")
    document.addEventListener("componentLoaded", (e) => {
      if (e.detail.id === "featuredProductsContainer") {
        const script = document.createElement("script")
        script.src = "/js/featured-products.js"
        document.body.appendChild(script)
      }
    })
  }
}

// Initialize components when DOM is loaded
document.addEventListener("DOMContentLoaded", initComponents)
