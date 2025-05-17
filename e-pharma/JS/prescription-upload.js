document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const nav = document.querySelector("nav")

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      nav.classList.toggle("active")
    })
  }

  // Prescription Image Preview
  const prescriptionInput = document.getElementById("prescription")
  const previewContainer = document.getElementById("previewContainer")
  const previewImage = document.getElementById("previewImage")

  if (prescriptionInput) {
    prescriptionInput.addEventListener("change", function () {
      const file = this.files[0]

      if (file) {
        const reader = new FileReader()

        reader.onload = (e) => {
          previewImage.src = e.target.result
          previewContainer.style.display = "block"
        }

        reader.readAsDataURL(file)
      } else {
        previewImage.src = ""
        previewContainer.style.display = "none"
      }
    })
  }

  // Form Submission
  const uploadForm = document.getElementById("uploadForm")

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Collect form data
      const formData = new FormData(uploadForm)

      // Simulate API call
      try {
        // Simulate a successful upload
        alert("Prescription uploaded successfully!")

        // Reset form
        uploadForm.reset()
        previewImage.src = ""
        previewContainer.style.display = "none"
      } catch (error) {
        console.error("Upload error:", error)
        alert("Failed to upload prescription. Please try again.")
      }
    })
  }
})
