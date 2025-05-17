document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const nav = document.querySelector(".main-nav")

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      nav.classList.toggle("active")
    })
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item")

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question")

    question.addEventListener("click", () => {
      // Toggle active class on the clicked item
      item.classList.toggle("active")

      // Close other open FAQs
      faqItems.forEach((otherItem) => {
        if (otherItem !== item && otherItem.classList.contains("active")) {
          otherItem.classList.remove("active")
        }
      })
    })
  })

  // Zip Code Checker
  const zipCodeInput = document.getElementById("zipCode")
  const checkZipButton = document.getElementById("checkZip")
  const zipResult = document.getElementById("zipResult")

  // Sample list of valid zip codes (in a real application, this would be checked against a database)
  const validZipCodes = ["12345", "23456", "34567", "45678", "56789"]

  if (checkZipButton) {
    checkZipButton.addEventListener("click", () => {
      const zipCode = zipCodeInput.value.trim()

      // Basic validation
      if (!zipCode) {
        zipResult.textContent = "Please enter a zip code."
        zipResult.className = "zip-result"
        return
      }

      // Check if zip code is valid format (5 digits)
      const zipRegex = /^\d{5}$/
      if (!zipRegex.test(zipCode)) {
        zipResult.textContent = "Please enter a valid 5-digit zip code."
        zipResult.className = "zip-result"
        return
      }

      // Check if delivery is available
      if (validZipCodes.includes(zipCode)) {
        zipResult.textContent = "Great news! Delivery is available in your area."
        zipResult.className = "zip-result available"
      } else {
        zipResult.textContent = "Sorry, delivery is not yet available in your area."
        zipResult.className = "zip-result unavailable"
      }
    })
  }

  // Allow Enter key to trigger zip code check
  if (zipCodeInput) {
    zipCodeInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault()
        checkZipButton.click()
      }
    })
  }

  // Update current year in footer
  const currentYearElement = document.getElementById("currentYear")
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear()
  }

  // Load cart count
  updateCartCount()
})

// Function to update cart count
function updateCartCount() {
  const cartCountElement = document.getElementById("cartCount")
  if (cartCountElement) {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const count = cart.reduce((total, item) => total + item.quantity, 0)
    cartCountElement.textContent = count
    cartCountElement.style.display = count > 0 ? "flex" : "none"
  }
}
