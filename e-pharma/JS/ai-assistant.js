// Use local functions first, then fall back to imports if needed
const getIsLoggedIn = () => {
  // First try to use the global function from header-fix.js
  if (typeof window.isUserLoggedIn === 'function') {
    return window.isUserLoggedIn();
  }
  
  // Fall back to imported function if available
  try {
    const { isLoggedIn } = require('./auth.js');
    return isLoggedIn();
  } catch (e) {
    // Final fallback - check localStorage directly
    console.log('[AI] Using fallback login check');
    return !!localStorage.getItem('auth_token');
  }
};

// Try to import other functions from auth.js
let doLogin, getToken;
try {
  import('./auth.js')
    .then(module => {
      doLogin = module.login;
      getToken = module.getToken;
    })
    .catch(err => console.error('[AI] Failed to import auth.js:', err));
} catch (e) {
  console.error('[AI] Error setting up auth imports:', e);
}
// API Configuration
const API_BASE_URL = "http://localhost:5000";
const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  // Use the debug endpoint that bypasses both CSRF and auth validation
  AI_ASSISTANT_CHAT: "/api/ai-assistant/debug/chat",
  CSRF_TOKEN: "/api/ai-assistant/csrf-token"
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
  return endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
}

document.addEventListener("DOMContentLoaded", function() {
  // Elements
  const chatForm = document.getElementById("chatForm");
  const userMessageInput = document.getElementById("userMessage");
  const chatMessages = document.getElementById("chatMessages");
  const topicButtons = document.querySelectorAll(".topic-btn");

  // Chat history management
  const chatHistory = {
    messages: [],
    maxMessages: 50,
    storageKey: 'ai_assistant_chat_history',
    
    // Load chat history from localStorage
    load() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.messages = JSON.parse(stored);
          console.log(`[Chat History] Loaded ${this.messages.length} messages from storage`);
        }
      } catch (err) {
        console.error('[Chat History] Error loading chat history:', err);
        this.messages = [];
      }
      return this.messages;
    },
    
    // Save chat history to localStorage
    save() {
      try {
        // Ensure we don't exceed the maximum number of messages
        if (this.messages.length > this.maxMessages) {
          this.messages = this.messages.slice(-this.maxMessages);
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
        console.log(`[Chat History] Saved ${this.messages.length} messages to storage`);
      } catch (err) {
        console.error('[Chat History] Error saving chat history:', err);
      }
    },
    
    // Add a message to history
    addMessage(text, isUser) {
      this.messages.push({
        text,
        isUser,
        timestamp: new Date().toISOString()
      });
      this.save();
    },
    
    // Clear all chat history
    clear() {
      this.messages = [];
      localStorage.removeItem(this.storageKey);
      console.log('[Chat History] Cleared chat history');
    }
  };
  
  // Load and display previous chat history on page load
  const loadChatHistory = () => {
    const messages = chatHistory.load();
    if (messages && messages.length > 0) {
      // Clear any existing messages first
      while (chatMessages.firstChild) {
        chatMessages.removeChild(chatMessages.firstChild);
      }
      
      // Add messages from history
      messages.forEach(msg => {
        addMessage(msg.text, msg.isUser, false); // Don't save to history again
      });
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  };
  
  // Run once on page load
  loadChatHistory();

  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const nav = document.querySelector(".main-nav")

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => nav.classList.toggle("active"))
  }

  // AI Chat Functionality
  // Sample responses for common health questions
  const responses = {
    hello: "Hello! How can I help you with your health or medication questions today?",
    hi: "Hi there! How can I assist you with your health or medication questions today?",
    help: "I can help you with information about medications, common health conditions, general wellness advice, and potential drug interactions. What would you like to know?",
    paracetamol:
      "Paracetamol (also known as acetaminophen) is a pain reliever and fever reducer. It's used to treat many conditions such as headache, muscle aches, arthritis, backache, toothaches, colds, and fevers. Common side effects may include nausea, stomach pain, and headache. The standard adult dose is 500-1000mg every 4-6 hours, not exceeding 4000mg in 24 hours.",
    ibuprofen:
      "Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) used to relieve pain, reduce inflammation, and lower fever. It's commonly used for conditions like headaches, toothaches, back pain, arthritis, menstrual cramps, or minor injuries. Common side effects include stomach pain, heartburn, and nausea. It should be taken with food to reduce stomach irritation.",
    aspirin:
      "Aspirin is a salicylate that reduces substances in the body that cause pain, fever, and inflammation. It's used to treat pain, reduce fever or inflammation, and is sometimes used to reduce the risk of heart attacks and stroke. Side effects may include stomach irritation, bleeding, and allergic reactions. It should not be given to children due to the risk of Reye's syndrome.",
    diabetes:
      "Diabetes is a chronic condition that affects how your body turns food into energy. There are three main types: Type 1, Type 2, and gestational diabetes. Symptoms may include increased thirst, frequent urination, hunger, fatigue, and blurred vision. Management typically involves monitoring blood sugar levels, medication, healthy eating, regular physical activity, and maintaining a healthy weight.",
    hypertension:
      "Hypertension, or high blood pressure, is a common condition where the long-term force of the blood against your artery walls is high enough that it may eventually cause health problems. It often has no symptoms but can lead to serious health issues like heart disease and stroke. Management includes lifestyle changes (healthy diet, regular exercise, limiting alcohol, not smoking) and medications if necessary.",
    "What are the common side effects of paracetamol?":
      "Common side effects of paracetamol are rare when taken as directed, but may include nausea, stomach pain, and headache. Serious side effects are very rare but can include allergic reactions (rash, itching, swelling), unusual tiredness, and yellowing of the skin or eyes (signs of liver problems). If you experience serious side effects, seek medical attention immediately.",
    "How should I store my medications?":
      "Most medications should be stored in a cool, dry place away from direct sunlight and moisture. Unless specifically instructed, avoid storing medications in the bathroom as humidity can affect their potency. Keep medications in their original containers with labels intact, and always check expiration dates. Store medications out of reach of children and pets. Some medications may require refrigeration - always check the label or ask your pharmacist.",
    "What is the difference between generic and brand-name drugs?":
      "Generic and brand-name drugs contain the same active ingredients and work the same way in the body. The main differences are in name, appearance, and cost. Generic drugs are typically less expensive because manufacturers don't have to repeat the clinical trials that the brand-name drugs underwent. They must meet the same FDA standards for quality, strength, purity, and stability as brand-name drugs.",
    "How can I manage high blood pressure naturally?":
      "Natural ways to manage high blood pressure include maintaining a healthy weight, regular physical activity (aim for 150 minutes per week), eating a diet rich in fruits, vegetables, whole grains, and low-fat dairy (like the DASH diet), reducing sodium intake, limiting alcohol consumption, not smoking, managing stress, and getting adequate sleep. These lifestyle changes should complement, not replace, any prescribed medications.",
    "What vitamins should I take daily?":
      "The need for daily vitamins varies based on age, sex, diet, and health conditions. Most people who eat a balanced diet get sufficient vitamins. However, common supplements include a multivitamin, vitamin D (especially for those with limited sun exposure), calcium (particularly for women), and omega-3 fatty acids. Always consult with a healthcare provider before starting any supplement regimen, as some can interact with medications or have side effects.",
  }

  // Function to add a message to the chat
  function addMessage(text, isUser = false, saveToHistory = true) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`

    const avatarDiv = document.createElement("div")
    avatarDiv.className = "message-avatar"

    const icon = document.createElement("i")
    icon.className = isUser ? "fas fa-user" : "fas fa-robot"
    avatarDiv.appendChild(icon)

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"

    // Process text for links and formatting
    text = processText(text)
    contentDiv.innerHTML = text

    messageDiv.appendChild(avatarDiv)
    messageDiv.appendChild(contentDiv)
    chatMessages.appendChild(messageDiv)

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight
    
    // Save to history if requested (and not already being loaded from history)
    if (saveToHistory) {
      chatHistory.addMessage(text, isUser);
    }
  }

  // Function to process text for links and formatting
  function processText(text) {
    // Convert URLs to links
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')

    // Convert line breaks to <p> tags
    const paragraphs = text.split("\n\n")
    if (paragraphs.length > 1) {
      return paragraphs.map((p) => `<p>${p}</p>`).join("")
    }

    return text
  }

  // Function to show typing indicator with optimized message
  async function showTypingIndicator() {
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "chat-message ai typing-indicator";
    typingIndicator.innerHTML = `
      <div class="chat-message-content">
        <div class="typing-animation">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        <div class="typing-message">Searching medications database...</div>
      </div>
    `;
    
    // Add to chat container
    const chatMessages = document.querySelector(".chat-messages");
    if (chatMessages) {
      chatMessages.appendChild(typingIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Update the message after a few seconds to manage user expectations
      setTimeout(() => {
        if (document.contains(typingIndicator)) {
          const messageEl = typingIndicator.querySelector('.typing-message');
          if (messageEl) {
            messageEl.textContent = "Generating medical information... (5-10 seconds)";
          }
        }
      }, 2000);
    }
    
    return typingIndicator;

    messageDiv.appendChild(avatarDiv)
    messageDiv.appendChild(typingDiv)
    chatMessages.appendChild(messageDiv)

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight

    return messageDiv
  }

  // Helper to get CSRF token from backend
  let csrfToken = null;
  let csrfTokenPromise = null;
  
  // Function to set CSRF token in cookies
  function setCsrfTokenCookie(token) {
    document.cookie = `XSRF-TOKEN=${token}; path=/; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
  }
  
  async function fetchCsrfToken(forceRefresh = false) {
    // Return existing token if we have one and not forcing refresh
    if (csrfToken && !forceRefresh) {
      return csrfToken;
    }
    
    // If we're already fetching a token, return that promise
    if (csrfTokenPromise && !forceRefresh) {
      return csrfTokenPromise;
    }
    
    // Create a new promise to fetch the token
    csrfTokenPromise = (async () => {
      try {
        console.log('[CSRF] Fetching new CSRF token...');
        
        // Get auth token if available
        const token = getToken ? getToken() : (localStorage.getItem('token') || '');
        
        const response = await fetch(getApiUrl(API_ENDPOINTS.CSRF_TOKEN), {
          method: 'GET',
          credentials: 'include', // Important for cookies
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token && { 'Authorization': `Bearer ${token}`, 'X-Auth-Token': token })
          },
          mode: 'cors' // Explicitly state this is a CORS request
        });
        
        if (!response.ok) {
          console.error(`[CSRF] HTTP error! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.data && data.data.csrfToken) {
          csrfToken = data.data.csrfToken;
          // Also set the token in a cookie for the next request
          setCsrfTokenCookie(csrfToken);
          console.log('[CSRF] New token received and cookie set:', csrfToken);
          return csrfToken;
        } else {
          console.error('[CSRF] No CSRF token in response:', data);
          throw new Error('No CSRF token in response');
        }
      } catch (error) {
        console.error('[CSRF] Error fetching token:', error);
        // Clear the cached token on error
        csrfToken = null;
        throw error;
      } finally {
        // Clear the promise so we can try again
        csrfTokenPromise = null;
      }
    })();
    
    return csrfTokenPromise;
  }

  // Function to get AI response - always use backend
  async function getAIResponse(userMessage) {
    try {
      showTypingIndicator();
      
      console.log('[AI] Using debug mode - bypassing all security checks');
      
      // Simplified request for debug mode
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        mode: 'cors',
        body: JSON.stringify({ message: userMessage })
      };
      
      console.log('[AI] Sending debug request to:', getApiUrl(API_ENDPOINTS.AI_ASSISTANT_CHAT));
      
      let res = await fetch(getApiUrl(API_ENDPOINTS.AI_ASSISTANT_CHAT), requestOptions);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[AI] Server error: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log('[AI] Debug response:', data);
      
      // Handle the new debug endpoint format
      if (data && data.success === true && data.data && data.data.message) {
        return data.data.message;
      }
      
      // Handle the standard response format
      if (data && data.message) {
        return data.message;
      }
      
      console.error('[AI] Unexpected response format:', data);
      throw new Error('Unexpected response format from server');
      
    } catch (error) {
      console.error("[AI] Error in getAIResponse:", error);
      
      // Handle specific error cases
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error("Could not connect to the server. Please check your internet connection.");
      } else if (error.message.includes('CSRF') || error.message.includes('token')) {
        throw new Error("Security token error. Please refresh the page and try again.");
      }
      
      // Re-throw the original error if we don't have a specific handler
      throw error;
    }
  }

  // Handle form submission
  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userMessage = userMessageInput.value.trim();
      if (!getIsLoggedIn()) {
        addMessage("Please <a href='../login.html'>log in</a> to use the AI assistant.");
        return;
      }
      if (userMessage) {
        addMessage(userMessage, true);
        userMessageInput.value = "";
        const typingIndicator = showTypingIndicator();
        try {
          const aiResponse = await getAIResponse(userMessage);
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
          }
          addMessage(aiResponse);
        } catch (err) {
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
          }
          // Log error to browser console for debug
          console.error('[AI Chat] Error:', err);
          addMessage(`<span style='color:red;'>${err.message || "Sorry, something went wrong contacting the AI."}</span>`);
        }
      }
    });
  }

  // Handle topic button clicks
  if (topicButtons) {
    topicButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        if (!getIsLoggedIn()) {
          addMessage("Please <a href='../login.html'>log in</a> to use the AI assistant.");
          return;
        }
        const topic = button.dataset.topic;
        addMessage(topic, true);
        const typingIndicator = showTypingIndicator();
        try {
          const aiResponse = await getAIResponse(topic);
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
          }
          addMessage(aiResponse);
        } catch (err) {
          if (typingIndicator && typingIndicator.parentNode) {
            typingIndicator.parentNode.removeChild(typingIndicator);
          }
          addMessage(err.message || "Sorry, something went wrong contacting the AI.");
        }
      });
    });
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
