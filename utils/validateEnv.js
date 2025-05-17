const { cleanEnv, str, port, num, bool, url, email } = require("envalid")

// Validate environment variables
const validateEnv = () => {
  return cleanEnv(process.env, {
    // Server Configuration
    NODE_ENV: str({ choices: ["development", "production", "test"] }),
    PORT: port({ default: 5000 }),

    // Database Configuration
    POSTGRES_DB: str(),
    POSTGRES_USER: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_HOST: str(),
    POSTGRES_PORT: port({ default: 5432 }),
    SYNC_DB: bool({ default: false }),

    // JWT Configuration
    JWT_SECRET: str({ devDefault: "dev_secret_change_in_production" }),
    JWT_EXPIRE: str({ default: "30d" }),
    JWT_COOKIE_EXPIRE: num({ default: 30 }),

    // File Upload Configuration
    FILE_UPLOAD_PATH: str({ default: "./public/uploads" }),
    MAX_FILE_UPLOAD: num({ default: 5000000 }), // 5MB

    // Email Configuration
    SMTP_HOST: str({ default: "" }),
    SMTP_PORT: port({ default: 587 }),
    FROM_NAME: str({ default: "E-Pharmacy" }),
    FROM_EMAIL: email({ default: "noreply@epharmacy.com" }),
    SMTP_EMAIL: email({ default: "" }),
    SMTP_PASSWORD: str({ default: "" }),

    // API Keys (optional in development)
    OPENAI_API_KEY: str({ default: "" }),

    // Frontend Configuration
    CLIENT_URL: url({ default: "http://localhost:3000" }),
    NEXT_PUBLIC_API_URL: str({ default: "http://localhost:5000" }),
  })
}

module.exports = validateEnv
