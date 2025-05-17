const asyncHandler = require("../../utils/asyncHandler");
const { User, AuditLog, sequelize } = require('../../models');
const ErrorResponse = require("../../utils/errorResponse");
const sendEmail = require("../../utils/sendEmail");
const { sanitizeInput } = require("../../utils/securityUtils");
const logger = require("../../utils/logger");
const emailTemplates = require("../../utils/emailTemplates");

/**
 * User registration controller with enhanced security, validation, and role-based processing
 * @desc    Register user
 * @route   POST /api/auth/register, /api/auth/register/{role}
 * @access  Public
 */
module.exports = asyncHandler(async (req, res, next) => {
  const requestId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  logger.info(`[REGISTER:${requestId}] Incoming request received`, {
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });
  
  try {
    // Extract and sanitize all input fields
    const {
      firstName,
      middleName,
      lastName,
      nationalNumber,
      email,
      phone,
      gender,
      username,
      password,
      securityQuestion,
      securityAnswer,
      role = "patient", // Default role
      // Role-specific fields
      dateOfBirth,
      allergies,
      // Doctor fields
      specialization,
      licenseNumber,
      yearsOfExperience,
      // Pharmacist fields
      pharmacyName,
      pharmacyAddress,
      // Admin fields
      adminCode,
      department
    } = req.body;

    // Sanitize critical fields
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);
    
    logger.info(`[REGISTER:${requestId}] Processing registration`, {
      email: sanitizedEmail,
      username: sanitizedUsername,
      role
    });
    
    // Basic validation (express validator should have already checked,
    // but this is an additional security layer)
    if (!sanitizedEmail || !sanitizedUsername || !password) {
      logger.warn(`[REGISTER:${requestId}] Missing required fields`);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Registration failed",
        errors: [{
          field: !sanitizedEmail ? "email" : !sanitizedUsername ? "username" : "password",
          message: "Required field is missing"
        }]
      });
    }

    // Quick check if email or username exists (without transaction)
    const existingUser = await User.findOne({ where: { email: sanitizedEmail } });
    if (existingUser) {
      logger.warn(`[REGISTER:${requestId}] Email already in use: ${sanitizedEmail}`);
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: "Registration failed",
        errors: [{
          field: "email",
          message: "Email address is already in use"
        }]
      });
    }

    const existingUsername = await User.findOne({ where: { username: sanitizedUsername } });
    if (existingUsername) {
      logger.warn(`[REGISTER:${requestId}] Username already taken: ${sanitizedUsername}`);
      return res.status(409).json({
        success: false,
        statusCode: 409,
        message: "Registration failed",
        errors: [{
          field: "username",
          message: "Username is already taken"
        }]
      });
    }
    
    // Role-specific validation
    if (role === "doctor" && (!specialization || !licenseNumber)) {
      logger.warn(`[REGISTER:${requestId}] Missing doctor-specific fields`);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Registration failed",
        errors: [
          !specialization ? { field: "specialization", message: "Specialization is required for doctors" } : null,
          !licenseNumber ? { field: "licenseNumber", message: "License number is required for doctors" } : null
        ].filter(Boolean)
      });
    }
    
    if (role === "pharmacist" && (!pharmacyName || !licenseNumber)) {
      logger.warn(`[REGISTER:${requestId}] Missing pharmacist-specific fields`);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Registration failed",
        errors: [
          !pharmacyName ? { field: "pharmacyName", message: "Pharmacy name is required for pharmacists" } : null,
          !licenseNumber ? { field: "licenseNumber", message: "License number is required for pharmacists" } : null
        ].filter(Boolean)
      });
    }
    
    if (role === "admin" && !adminCode) {
      logger.warn(`[REGISTER:${requestId}] Missing admin verification code`);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Registration failed",
        errors: [{
          field: "adminCode",
          message: "Admin verification code is required"
        }]
      });
    }
    
    // Verify admin code if registering as admin
    if (role === "admin" && adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
      logger.warn(`[REGISTER:${requestId}] Invalid admin verification code`);
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: "Registration failed",
        errors: [{
          field: "adminCode",
          message: "Invalid admin verification code"
        }]
      });
    }

    // Send immediate standardized acknowledgment response
    logger.info(`[REGISTER:${requestId}] Sending acknowledgment response`);
    
    // Set security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    res.status(202).json({
      success: true,
      statusCode: 202,
      message: "Registration request received and is being processed",
      data: {
        email: sanitizedEmail,
        username: sanitizedUsername,
        role,
        requestId,
        processingStatus: "pending"
      }
    });
    // Process registration asynchronously after sending response
    process.nextTick(async () => {
      logger.info(`[REGISTER:${requestId}] Starting background registration process`);
      let transaction;
      let emailRetryCount = 0;
      const MAX_EMAIL_RETRIES = 3;
      const EMAIL_RETRY_DELAY = 10000; // 10 seconds between retries
      
      try {
        // Start a new transaction for the background process
        transaction = await sequelize.transaction();
        logger.info(`[REGISTER:${requestId}] Transaction started`);
        
        // Double-check for existing email/username with transaction lock
        const doubleCheckUser = await User.findOne({ 
          where: { email: sanitizedEmail },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        
        if (doubleCheckUser) {
          logger.warn(`[REGISTER:${requestId}] Email already taken in background check: ${sanitizedEmail}`);
          await transaction.rollback();
          return;
        }
        
        const doubleCheckUsername = await User.findOne({ 
          where: { username: sanitizedUsername },
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        
        if (doubleCheckUsername) {
          logger.warn(`[REGISTER:${requestId}] Username already taken in background check: ${sanitizedUsername}`);
          await transaction.rollback();
          return;
        }
        
        // Prepare user data with role-specific fields
        const userData = {
          firstName: sanitizedFirstName,
          middleName: middleName ? sanitizeInput(middleName) : null,
          lastName: sanitizedLastName,
          nationalNumber: sanitizeInput(nationalNumber),
          email: sanitizedEmail,
          phone: sanitizeInput(phone),
          gender: sanitizeInput(gender),
          username: sanitizedUsername,
          password, // Will be hashed by Sequelize model hooks
          securityQuestion: sanitizeInput(securityQuestion),
          securityAnswer: sanitizeInput(securityAnswer),
          role: sanitizeInput(role)
        };
        
        // Add role-specific data based on user role
        switch (role) {
          case "patient":
            if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
            if (allergies) userData.allergies = JSON.stringify(allergies);
            break;
            
          case "doctor":
            userData.specialization = sanitizeInput(specialization);
            userData.licenseNumber = sanitizeInput(licenseNumber);
            userData.yearsOfExperience = parseInt(yearsOfExperience, 10);
            userData.isVerified = false; // Doctors require verification
            userData.requiresApproval = true;
            break;
            
          case "pharmacist":
            userData.pharmacyName = sanitizeInput(pharmacyName);
            userData.pharmacyAddress = sanitizeInput(pharmacyAddress);
            userData.licenseNumber = sanitizeInput(licenseNumber);
            userData.isVerified = false; // Pharmacists require verification
            userData.requiresApproval = true;
            break;
            
          case "admin":
            userData.department = sanitizeInput(department);
            // Admins are typically pre-verified through the admin code
            userData.isVerified = true;
            break;
            
          default:
            // Default patient role
            userData.role = "patient";
        }
        
        // Create user
        logger.info(`[REGISTER:${requestId}] Creating user record with role: ${role}`);
        const user = await User.create(userData, { transaction });
        
        logger.info(`[REGISTER:${requestId}] User created successfully with ID: ${user.id}`);
        
        // Generate verification token
        logger.info(`[REGISTER:${requestId}] Generating verification token`);
        const verificationToken = user.getEmailVerificationToken();
        await user.save({ 
          transaction,
          validate: false // Skip validation for token update
        });
        
        // Commit the transaction
        logger.info(`[REGISTER:${requestId}] Committing transaction`);
        await transaction.commit();
        logger.info(`[REGISTER:${requestId}] Transaction committed successfully`);
        
        // Create verification URL for email
        const verificationUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${verificationToken}`;
        
        // Log successful registration in audit log
        try {
          await AuditLog.create({
            userId: user.id,
            action: "USER_REGISTERED",
            resourceType: "User",
            resourceId: user.id,
            details: JSON.stringify({
              email: sanitizedEmail,
              username: sanitizedUsername,
              role: role,
              registeredAt: new Date().toISOString(),
              requestId
            }),
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
          });
          logger.info(`[REGISTER:${requestId}] Registration logged to audit log`);
        } catch (logError) {
          logger.error(`[REGISTER:${requestId}] Failed to create registration audit log:`, {
            error: logError.message,
            stack: logError.stack
          });
          // Non-critical error, continue with process
        }
        
        // Select email template based on role
        const getEmailTemplate = (role, data) => {
          switch(role) {
            case "doctor":
              return emailTemplates.doctorWelcome(data);
            case "pharmacist":
              return emailTemplates.pharmacistWelcome(data);
            case "admin":
              return emailTemplates.adminWelcome(data);
            case "patient":
            default:
              return emailTemplates.userWelcome(data);
          }
        };
        
        // Prepare email template data
        const emailData = {
          firstName: sanitizedFirstName,
          verificationUrl,
          username: sanitizedUsername,
          role: role
        };
        
        // Get role-specific email template
        const emailTemplate = getEmailTemplate(role, emailData);
        
        // Send welcome email with retry mechanism
        const sendVerificationEmail = async (retryCount = 0) => {
          try {
            logger.info(`[REGISTER:${requestId}] Sending welcome email to: ${sanitizedEmail} (Attempt ${retryCount + 1})`);
            
            await sendEmail({
              email: sanitizedEmail,
              subject: `Welcome to E-Pharmacy - ${role === 'patient' ? 'Verify Your Email' : 'Registration Received'}`,
              html: emailTemplate
            });
            
            logger.info(`[REGISTER:${requestId}] Welcome email sent successfully to: ${sanitizedEmail}`);
            
            // Log successful email in audit
            await AuditLog.create({
              userId: user.id,
              action: "EMAIL_SENT",
              resourceType: "User",
              resourceId: user.id,
              details: JSON.stringify({
                email: sanitizedEmail,
                type: "welcome_email",
                success: true,
                timestamp: new Date().toISOString()
              }),
              ipAddress: req.ip,
              userAgent: req.headers["user-agent"],
            });
            
          } catch (emailError) {
            logger.error(`[REGISTER:${requestId}] Welcome email could not be sent:`, {
              error: emailError.message,
              attempt: retryCount + 1
            });
            
            // Log failed email attempt
            try {
              await AuditLog.create({
                userId: user.id,
                action: "EMAIL_SEND_FAILED",
                resourceType: "User",
                resourceId: user.id,
                details: JSON.stringify({
                  email: sanitizedEmail,
                  error: emailError.message,
                  attempt: retryCount + 1,
                  timestamp: new Date().toISOString()
                }),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
              });
            } catch (logError) {
              logger.error(`[REGISTER:${requestId}] Failed to create email failure audit log:`, {
                error: logError.message
              });
            }
            
            // Retry if we haven't reached the maximum retry count
            if (retryCount < MAX_EMAIL_RETRIES) {
              logger.info(`[REGISTER:${requestId}] Scheduling email retry in ${EMAIL_RETRY_DELAY}ms`);
              setTimeout(() => sendVerificationEmail(retryCount + 1), EMAIL_RETRY_DELAY);
            } else {
              logger.error(`[REGISTER:${requestId}] Maximum email retry attempts reached. Email could not be sent.`);
              
              // Record final failure in audit log
              try {
                await AuditLog.create({
                  userId: user.id,
                  action: "EMAIL_SEND_FAILED_FINAL",
                  resourceType: "User",
                  resourceId: user.id,
                  details: JSON.stringify({
                    email: sanitizedEmail,
                    error: "Maximum retry attempts reached",
                    timestamp: new Date().toISOString()
                  }),
                  ipAddress: req.ip,
                  userAgent: req.headers["user-agent"],
                });
              } catch (logError) {
                logger.error(`[REGISTER:${requestId}] Failed to create final email failure audit log:`, {
                  error: logError.message
                });
              }
            }
          }
        };
        
        // Initiate email sending process
        await sendVerificationEmail();
        
      } catch (bgError) {
        logger.error(`[REGISTER:${requestId}] Error in background registration process:`, {
          error: bgError.message,
          stack: bgError.stack
        });
        
        // Rollback transaction if it exists
        if (transaction) {
          try {
            logger.info(`[REGISTER:${requestId}] Rolling back transaction`);
            await transaction.rollback();
            logger.info(`[REGISTER:${requestId}] Transaction rolled back successfully`);
          } catch (rollbackError) {
            logger.error(`[REGISTER:${requestId}] Error rolling back transaction:`, {
              error: rollbackError.message,
              stack: rollbackError.stack
            });
          }
        }
        
        // Log registration failure
        try {
          await AuditLog.create({
            action: "REGISTRATION_FAILED",
            resourceType: "User",
            details: JSON.stringify({
              email: sanitizedEmail,
              username: sanitizedUsername,
              role: role,
              error: bgError.message,
              timestamp: new Date().toISOString(),
              requestId
            }),
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
          });
          logger.info(`[REGISTER:${requestId}] Registration failure logged to audit log`);
        } catch (logError) {
          logger.error(`[REGISTER:${requestId}] Failed to create registration failure audit log:`, {
            error: logError.message,
            stack: logError.stack
          });
        }
      }
    });
  } catch (error) {
    logger.error(`[REGISTER:${requestId}] Error during initial registration processing:`, {
      error: error.message,
      stack: error.stack
    });
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "An unexpected error occurred during registration",
        errors: [{
          field: "server",
          message: "Server error during registration processing"
        }],
        ...(process.env.NODE_ENV === 'development' && { debug: error.message })
      });
    }
  }
});
