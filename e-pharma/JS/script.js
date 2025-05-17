document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const nav = document.querySelector("nav")

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      nav.classList.toggle("active")
    })
  }

  // Cart Functionality
  const cartButton = document.getElementById("cart-button")
  const cartPopup = document.getElementById("cart-popup")
  const closeCart = document.getElementById("close-cart")

  if (cartButton && cartPopup) {
    cartButton.addEventListener("click", () => {
      cartPopup.classList.add("active")
    })

    closeCart.addEventListener("click", () => {
      cartPopup.classList.remove("active")
    })

    // Close cart when clicking outside
    document.addEventListener("click", (event) => {
      if (!cartPopup.contains(event.target) && event.target !== cartButton) {
        cartPopup.classList.remove("active")
      }
    })
  }

  // Password Toggle
  const togglePassword = document.getElementById("toggle-password")
  const passwordInput = document.getElementById("password")

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
      passwordInput.setAttribute("type", type)

      // Toggle icon
      const icon = togglePassword.querySelector("i")
      icon.classList.toggle("fa-eye")
      icon.classList.toggle("fa-eye-slash")
    })
  }
})
