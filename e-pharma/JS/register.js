document.addEventListener("DOMContentLoaded", () => {
  console.log("register.js loaded");
  function nextStep(currentStep) {
    let canProceed = true
    if (currentStep === 1) {
      ;["firstName", "lastName", "nationalNumber", "phone", "gender", "email"].forEach((id) => {
        if (!document.getElementById(id).value) {
          alert(`Please fill the ${id} field.`)
          canProceed = false
        }
      })
    }
    if (canProceed) {
      document.getElementById(`step${currentStep}`).classList.remove("active")
      document.getElementById(`step${currentStep + 1}`).classList.add("active")
      document.querySelectorAll(".step-indicator span")[currentStep].classList.add("active")
    }
  }

  function prevStep(currentStep) {
    document.getElementById(`step${currentStep}`).classList.remove("active")
    document.getElementById(`step${currentStep - 1}`).classList.add("active")
    document.querySelectorAll(".step-indicator span")[currentStep - 1].classList.remove("active")
  }

  document.getElementById("toggleRegPassword").onclick = () => {
    const pw = document.getElementById("reg-password")
    pw.type = pw.type === "password" ? "text" : "password"
  }
  document.getElementById("toggleConfirmPassword").onclick = () => {
    const pw = document.getElementById("confirm-password")
    pw.type = pw.type === "password" ? "text" : "password"
  }

  // Attach next step event listeners
  const nextBtns = document.querySelectorAll('.next-btn');
  nextBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      // Step numbers are 1-based: first next-btn is for step 1, second for step 2, etc.
      nextStep(idx + 1);
    });
  });

  // Attach previous step event listeners
  const prevBtns = document.querySelectorAll('.previous-btn');
  prevBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      // Step numbers are 2-based for previous (since first step has no previous)
      prevStep(idx + 2);
    });
  });

  const form = document.getElementById("registrationForm");
  if (form) {
    console.log("Form found, attaching submit handler");
    form.onsubmit = async (e) => {
      console.log("Form submitted (from debug)");
      e.preventDefault()

      const password = document.getElementById("reg-password").value
      const confirmPassword = document.getElementById("confirm-password").value
      console.log("Password:", password, "ConfirmPassword:", confirmPassword);

      if (password !== confirmPassword) {
        alert("Passwords do not match!")
        console.log("Passwords do not match");
        return
      }

      const formData = {
        firstName: document.getElementById("firstName").value,
        middleName: document.getElementById("middleName").value,
        lastName: document.getElementById("lastName").value,
        nationalNumber: document.getElementById("nationalNumber").value,
        phone: document.getElementById("phone").value,
        gender: document.getElementById("gender").value,
        diseases: Array.from(document.querySelectorAll('input[name="diseases"]:checked')).map((i) => i.value),
        allergies: Array.from(document.querySelectorAll('input[name="allergies"]:checked')).map((i) => i.value),
        healthNotes: document.getElementById("healthNotes").value,
        username: document.getElementById("username").value,
        password,
        securityQuestion: document.getElementById("securityQuestion").value,
        securityAnswer: document.getElementById("securityAnswer").value,
        email: document.getElementById("email").value,
        role: "patient"
      }
      console.log("FormData:", formData);

      try {
        // Fetch CSRF token from /api and extract from response body
        const csrfRes = await fetch("http://localhost:5000/api", { credentials: "include" });
        const csrfData = await csrfRes.json();
        const csrfToken = csrfData.csrfToken;

        if (!csrfToken) {
          alert('Could not retrieve CSRF token. Please try refreshing the page.');
          return;
        }

        console.log("Sending fetch request...");
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          },
          credentials: "include",
          body: JSON.stringify(formData),
        })
        console.log("Fetch response received");

        const data = await res.json()
        console.log("Response data:", data);

        if (res.ok) {
          // Store the registered email in localStorage
          localStorage.setItem("prefillEmail", formData.email);
          
          // Option: Auto login after registration
          if (data.token) {
            // IMPORTANT: Clear any existing user data first to prevent using test data
            localStorage.removeItem('user_info');
            localStorage.removeItem('e_pharma_user_profile');
            
            // Store auth token using our standard key
            localStorage.setItem("e_pharma_auth_token", data.token);
            
            // Also store user profile data
            if (data.user) {
              // Store the user data from the server
              localStorage.setItem("user_info", JSON.stringify(data.user));
              console.log("Stored registration user data from server:", data.user);
            } else {
              // Create basic user info if server didn't provide it
              const userInfo = {
                name: formData.firstName + " " + formData.lastName,
                email: formData.email,
                role: formData.role || "customer"
              };
              localStorage.setItem("user_info", JSON.stringify(userInfo));
              console.log("Created and stored registration user data:", userInfo);
            }
            
            // Use the global login state function if available (from header-fix.js)
            if (typeof window.setUserLoggedIn === 'function') {
              window.setUserLoggedIn({
                name: formData.firstName + " " + formData.lastName,
                email: formData.email,
                role: formData.role || "customer"
              });
            }
            
            // Redirect to dashboard instead of login
            window.location.href = "home2.html";
            return;
          }
          
          // If no token provided, redirect to login page
          window.location.href = "login.html";
        } else {
          // Show detailed error info if available
          console.log("Registration error:", data);
          
          // Detailed error logging
          if (data.details && Array.isArray(data.details)) {
            console.log("Validation error details:");
            data.details.forEach((detail, index) => {
              console.log(`Error ${index + 1}:`, detail);
            });
          }
          
          if (data.details && Array.isArray(data.details) && data.details.length > 0) {
            // Format validation errors in a readable way
            const validationErrors = data.details.map(error => {
              const field = error.path || error.param || error.field || 'Field';
              const message = error.message || error.msg || 'Invalid value';
              return `- ${field}: ${message}`;
            }).join('\n');
            
            alert(`Registration failed: Validation errors\n${validationErrors}`);
          } else {
            // Generic error message
            const errorMsg = data.message || data.error || 'Registration failed';
            alert(errorMsg);
          }
        }
      } catch (err) {
        alert("Server error or network issue.")
        console.error("Fetch error:", err)
      }
    }
  } else {
    console.log("Form not found!");
  }

  window.nextStep = nextStep
  window.prevStep = prevStep
})
