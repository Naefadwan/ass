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

  // Form Validation and Submission
  const consultationForm = document.getElementById("consultationForm")

  if (consultationForm) {
    consultationForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Basic form validation
      const name = document.getElementById("name").value.trim()
      const email = document.getElementById("email").value.trim()
      const phone = document.getElementById("phone").value.trim()
      const consultationType = document.getElementById("consultationType").value
      const preferredDate = document.getElementById("preferredDate").value
      const preferredTime = document.getElementById("preferredTime").value
      const consultationMethod = document.getElementById("consultationMethod").value
      const concerns = document.getElementById("concerns").value.trim()
      const privacyPolicy = document.getElementById("privacy-policy").checked

      // Check if all required fields are filled
      if (
        !name ||
        !email ||
        !phone ||
        !consultationType ||
        !preferredDate ||
        !preferredTime ||
        !consultationMethod ||
        !concerns ||
        !privacyPolicy
      ) {
        alert("Please fill in all required fields.")
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.")
        return
      }

      // Phone validation (basic)
      const phoneRegex = /^\d{10,15}$/
      if (!phoneRegex.test(phone.replace(/[^0-9]/g, ""))) {
        alert("Please enter a valid phone number.")
        return
      }

      // Date validation (must be future date)
      const selectedDate = new Date(preferredDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        alert("Please select a future date for your consultation.")
        return
      }

      // If all validations pass, simulate form submission
      const formData = {
        name,
        email,
        phone,
        consultationType,
        preferredDate,
        preferredTime,
        consultationMethod,
        concerns,
      }

      // In a real application, this would be an API call
      console.log("Form data:", formData)

      // Show success message
      alert(
        "Your consultation request has been submitted successfully! We will contact you shortly to confirm your appointment.",
      )

      // Reset form
      consultationForm.reset()
    })
  }

  // Date input min attribute (prevent selecting past dates)
  const preferredDateInput = document.getElementById("preferredDate")
  if (preferredDateInput) {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")

    preferredDateInput.min = `${yyyy}-${mm}-${dd}`
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
