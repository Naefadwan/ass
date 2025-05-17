/**
 * Email templates for E-Pharmacy application
 * Provides role-specific email templates with consistent branding
 * Both HTML and text versions are included for compatibility
 */

// Common header and footer templates to maintain consistent branding
const headerTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>E-Pharmacy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #333333; background-color: #f5f5f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          <tr>
            <td align="center" style="padding: 30px 0; background-color: #4CAF50; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">E-Pharmacy</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Your Digital Healthcare Partner</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
`;

const footerTemplate = `
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #f9f9f9; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; font-size: 14px; color: #666666;">
                &copy; ${new Date().getFullYear()} E-Pharmacy. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                This email was sent to you because you registered with E-Pharmacy.<br>
                Please do not reply to this email.
              </p>
              <div style="margin-top: 20px;">
                <a href="{{{privacyPolicyUrl}}}" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                <a href="{{{termsOfServiceUrl}}}" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                <a href="{{{contactUrl}}}" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Contact Us</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Button styling for calls to action
const buttonStyle = `display: inline-block; background-color: #4CAF50; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; margin: 20px 0; border: none; text-align: center;`;

// Helper function to insert data into templates
const insertData = (template, data = {}) => {
  let result = template;
  
  // Replace all placeholders with actual data
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{{${key}}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  // Replace default URLs if not provided
  const defaultUrls = {
    privacyPolicyUrl: 'https://e-pharmacy.com/privacy',
    termsOfServiceUrl: 'https://e-pharmacy.com/terms',
    contactUrl: 'https://e-pharmacy.com/contact'
  };
  
  Object.keys(defaultUrls).forEach(key => {
    const regex = new RegExp(`{{{${key}}}}`, 'g');
    if (result.includes(`{{{${key}}}}`)) {
      result = result.replace(regex, defaultUrls[key]);
    }
  });
  
  return result;
};

// Plain text fallback generator
const generatePlainText = (htmlContent) => {
  let plainText = htmlContent
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    // Replace URLs in the format <a href="URL">TEXT</a> with TEXT (URL)
    .replace(/([^\s]+) \(([^)]+)\)/g, '$1 ($2)')
    // Normalize newlines
    .replace(/\n+/g, '\n')
    // Trim
    .trim();
    
  return plainText;
};

/**
 * Standard user (patient) welcome and verification email
 * @param {Object} data - Data for template insertion
 * @returns {string} - HTML email content
 */
const userWelcome = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Welcome to E-Pharmacy!</h2>
    
    <p>Dear {{{firstName}}},</p>
    
    <p>Thank you for registering with E-Pharmacy. We're excited to have you join our community of patients who trust us for their healthcare needs.</p>
    
    <p>Your account has been created successfully with the username: <strong>{{{username}}}</strong></p>
    
    <p>To ensure the security of your account and to start using our services, please verify your email address by clicking the button below:</p>
    
    <p style="text-align: center;">
      <a href="{{{verificationUrl}}}" style="${buttonStyle}">Verify My Email</a>
    </p>
    
    <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
    
    <p style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all;">
      {{{verificationUrl}}}
    </p>
    
    <p>This verification link will expire in 24 hours for security reasons.</p>
    
    <h3 style="color: #4CAF50;">What's Next?</h3>
    
    <p>Once you've verified your email, you can:</p>
    
    <ul style="padding-left: 20px;">
      <li>Complete your health profile</li>
      <li>Browse medications and healthcare products</li>
      <li>Upload your prescriptions</li>
      <li>Connect with healthcare professionals</li>
    </ul>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our customer support team at <a href="mailto:support@e-pharmacy.com" style="color: #4CAF50;">support@e-pharmacy.com</a> or call us at +1-888-123-4567.</p>
    
    <p>We're looking forward to helping you with your healthcare needs!</p>
    
    <p>Best regards,<br>The E-Pharmacy Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Doctor welcome and verification email
 * @param {Object} data - Data for template insertion
 * @returns {string} - HTML email content
 */
const doctorWelcome = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Welcome to E-Pharmacy, Dr. {{{lastName}}}!</h2>
    
    <p>Dear Dr. {{{firstName}}} {{{lastName}}},</p>
    
    <p>Thank you for registering with E-Pharmacy as a healthcare professional. We're pleased to welcome you to our network of qualified doctors.</p>
    
    <p>Your account has been created with the username: <strong>{{{username}}}</strong></p>
    
    <p><strong>Important:</strong> Your account is currently pending verification of your medical credentials. Our team will review the information and documentation you've provided.</p>
    
    <p>To prepare for the verification process, please complete these steps:</p>
    
    <ol style="padding-left: 20px;">
      <li>Verify your email address by clicking the button below</li>
      <li>Ensure your medical license information is up-to-date in your profile</li>
      <li>Complete your professional profile with specialization details</li>
    </ol>
    
    <p style="text-align: center;">
      <a href="{{{verificationUrl}}}" style="${buttonStyle}">Verify My Email</a>
    </p>
    
    <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
    
    <p style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all;">
      {{{verificationUrl}}}
    </p>
    
    <p>This verification link will expire in 24 hours for security reasons.</p>
    
    <h3 style="color: #4CAF50;">What to Expect Next:</h3>
    
    <p>Our verification team will review your credentials within 2-3 business days. You'll receive another email once your account has been fully verified. If additional information is needed, we'll contact you directly.</p>
    
    <p>Once verified, you'll be able to:</p>
    
    <ul style="padding-left: 20px;">
      <li>Participate in telemedicine consultations</li>
      <li>Review and issue digital prescriptions</li>
      <li>Access patient medical information (with consent)</li>
      <li>Collaborate with pharmacists on our platform</li>
    </ul>
    
    <p>If you have any questions about the verification process or need assistance, please contact our healthcare provider support team at <a href="mailto:provider-support@e-pharmacy.com" style="color: #4CAF50;">provider-support@e-pharmacy.com</a> or call us at +1-888-123-4567 ext. 2.</p>
    
    <p>Thank you for joining E-Pharmacy. We look forward to collaborating with you to improve healthcare delivery.</p>
    
    <p>Best regards,<br>The E-Pharmacy Provider Relations Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Pharmacist welcome and verification email
 * @param {Object} data - Data for template insertion
 * @returns {string} - HTML email content
 */
const pharmacistWelcome = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Welcome to E-Pharmacy!</h2>
    
    <p>Dear {{{firstName}}} {{{lastName}}},</p>
    
    <p>Thank you for registering with E-Pharmacy as a pharmacist. We're excited to welcome you to our network of pharmaceutical professionals.</p>
    
    <p>Your account has been created with the username: <strong>{{{username}}}</strong></p>
    
    <p><strong>Important:</strong> Your account is currently pending verification of your pharmacy credentials. Our team will review the information and documentation you've provided.</p>
    
    <p>To prepare for the verification process, please complete these steps:</p>
    
    <ol style="padding-left: 20px;">
      <li>Verify your email address by clicking the button below</li>
      <li>Ensure your pharmacy license information is up-to-date in your profile</li>
      <li>Complete your pharmacy details in your professional profile</li>
    </ol>
    
    <p style="text-align: center;">
      <a href="{{{verificationUrl}}}" style="${buttonStyle}">Verify My Email</a>
    </p>
    
    <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
    
    <p style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all;">
      {{{verificationUrl}}}
    </p>
    
    <p>This verification link will expire in 24 hours for security reasons.</p>
    
    <h3 style="color: #4CAF50;">What to Expect Next:</h3>
    
    <p>Our verification team will review your credentials within 2-3 business days. You'll receive another email once your account has been fully verified. If additional information is needed, we'll contact you directly.</p>
    
    <p>Once verified, you'll be able to:</p>
    
    <ul style="padding-left: 20px;">
      <li>Receive and process digital prescriptions</li>
      <li>Manage medication inventory</li>
      <li>Communicate with patients about their prescriptions</li>
      <li>Collaborate with doctors on our platform</li>
    </ul>
    
    <p>If you have any questions about the verification process or need assistance, please contact our pharmacy support team at <a href="mailto:pharmacy-support@e-pharmacy.com" style="color: #4CAF50;">pharmacy-support@e-pharmacy.com</a> or call us at +1-888-123-4567 ext. 3.</p>
    
    <p>Thank you for joining E-Pharmacy. We look forward to working with you to provide exceptional pharmaceutical care to our users.</p>
    
    <p>Best regards,<br>The E-Pharmacy Pharmacy Relations Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Admin welcome email
 * @param {Object} data - Data for template insertion
 * @returns {string} - HTML email content
 */
const adminWelcome = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Welcome to the E-Pharmacy Administration Team</h2>
    
    <p>Dear {{{firstName}}} {{{lastName}}},</p>
    
    <p>Welcome to the E-Pharmacy administration team. Your administrator account has been created with the username: <strong>{{{username}}}</strong></p>
    
    <p>As an administrator, you have access to sensitive systems and data within our platform. Please review the following security guidelines carefully:</p>
    
    <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #ff6f00;">Important Security Guidelines</h3>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        <li>Never share your administrator credentials with anyone</li>
        <li>Use a strong, unique password and change it regularly</li>
        <li>Enable two-factor authentication in your account settings</li>
        <li>Always verify user identities before making sensitive changes</li>
        <li>Log out from all sessions when not actively using the system</li>
        <li>Report any suspicious activities immediately to the security team</li>
      </ul>
    </div>
    
    <p>To complete your account setup and access the administration panel, please verify your email address by clicking the button below:</p>
    
    <p style="text-align: center;">
      <a href="{{{verificationUrl}}}" style="${buttonStyle}">Verify My Email</a>
    </p>
    
    <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
    
    <p style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all;">
      {{{verificationUrl}}}
    </p>
    
    <p>This verification link will expire in 24 hours for security reasons.</p>
    
    <h3 style="color: #4CAF50;">Administrator Resources</h3>
    
    <p>Here are some resources to help you get started with your administrator role:</p>
    
    <ul style="padding-left: 20px;">
      <li>Access the <a href="https://admin.e-pharmacy.com" style="color: #4CAF50;">Administration Portal</a></li>
      <li>Review the <a href="https://e-pharmacy.com/admin-documentation" style="color: #4CAF50;">Administrator Documentation</a></li>
      <li>Familiarize yourself with our <a href="https://e-pharmacy.com/security-policies" style="color: #4CAF50;">Security Policies</a></li>
      <li>Join the admin team on our internal collaboration platform</li>
    </ul>
    
    <p>Your department head will schedule an onboarding session with you shortly to review your specific responsibilities and provide necessary training.</p>
    
    <p>If you have any questions or encounter any issues, please contact the IT support team at <a href="mailto:admin-support@e-pharmacy.com" style="color: #4CAF50;">admin-support@e-pharmacy.com</a> or call our direct admin support line at +1-888-123-4567 ext. 1.</p>
    
    <p>Welcome aboard!</p>
    
    <p>Best regards,<br>The E-Pharmacy Executive Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Email sent when email verification is successful for a patient
 * @param {Object} data - Data for template insertion
 * @returns {Object} - HTML and text email content
 */
const verificationSuccessPatient = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Email Verification Successful!</h2>
    
    <p>Dear {{{firstName}}},</p>
    
    <p>Great news! Your email address has been successfully verified. Your E-Pharmacy account is now fully activated.</p>
    
    <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #4CAF50; margin-top: 0;">Your Account is Ready</h3>
      <p style="margin-bottom: 0;">You can now access all features of the E-Pharmacy platform.</p>
    </div>
    
    <h3 style="color: #4CAF50;">Next Steps:</h3>
    
    <ol style="padding-left: 20px;">
      <li><strong>Complete your health profile</strong> - Add your health information to receive better recommendations</li>
      <li><strong>Add your prescriptions</strong> - Upload existing prescriptions to start managing your medications</li>
      <li><strong>Explore available medications</strong> - Browse our extensive catalog of medications and health products</li>
      <li><strong>Set up prescription reminders</strong> - Never miss a dose with our reminder system</li>
    </ol>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://e-pharmacy.com/dashboard" style="${buttonStyle}">Go to My Dashboard</a>
    </p>
    
    <p>Thank you for choosing E-Pharmacy for your healthcare needs. We're committed to providing you with the best possible service.</p>
    
    <p>Best regards,<br>The E-Pharmacy Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Email sent when verification is successful for doctors
 * @param {Object} data - Data for template insertion
 * @returns {Object} - HTML and text email content
 */
const verificationSuccessDoctor = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Email Verification Successful!</h2>
    
    <p>Dear Dr. {{{firstName}}} {{{lastName}}},</p>
    
    <p>Thank you for verifying your email address. This is the first step in the verification process for your healthcare provider account.</p>
    
    <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #4CAF50; margin-top: 0;">Credential Verification In Progress</h3>
      <p>Our team is now reviewing your medical credentials. You'll receive a separate notification when this process is complete, typically within 2-3 business days.</p>
    </div>
    
    <h3 style="color: #4CAF50;">While You Wait:</h3>
    
    <ul style="padding-left: 20px;">
      <li>Complete your professional profile with your specializations and areas of expertise</li>
      <li>Set your availability for telemedicine consultations</li>
      <li>Review our prescription guidelines and policies</li>
      <li>Explore the provider dashboard features</li>
    </ul>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://doctors.e-pharmacy.com/dashboard" style="${buttonStyle}">Access Provider Dashboard</a>
    </p>
    
    <p>If you have any questions about the verification process, please contact our provider support team at <a href="mailto:provider-support@e-pharmacy.com" style="color: #4CAF50;">provider-support@e-pharmacy.com</a>.</p>
    
    <p>Thank you for partnering with E-Pharmacy to improve healthcare delivery.</p>
    
    <p>Best regards,<br>The E-Pharmacy Provider Relations Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Email sent when verification is successful for pharmacists
 * @param {Object} data - Data for template insertion
 * @returns {Object} - HTML and text email content
 */
const verificationSuccessPharmacist = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Email Verification Successful!</h2>
    
    <p>Dear {{{firstName}}} {{{lastName}}},</p>
    
    <p>Thank you for verifying your email address. This is the first step in the verification process for your pharmacist account.</p>
    
    <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #4CAF50; margin-top: 0;">Pharmacy Verification In Progress</h3>
      <p>Our team is now reviewing your pharmacy credentials and license information. You'll receive a separate notification when this process is complete, typically within 2-3 business days.</p>
    </div>
    
    <h3 style="color: #4CAF50;">While You Wait:</h3>
    
    <ul style="padding-left: 20px;">
      <li>Complete your pharmacy profile with operating hours and services offered</li>
      <li>Set up your medication inventory</li>
      <li>Review our prescription fulfillment policies</li>
      <li>Explore the pharmacy dashboard features</li>
    </ul>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://pharmacy.e-pharmacy.com/dashboard" style="${buttonStyle}">Access Pharmacy Dashboard</a>
    </p>
    
    <p>If you have any questions about the verification process, please contact our pharmacy support team at <a href="mailto:pharmacy-support@e-pharmacy.com" style="color: #4CAF50;">pharmacy-support@e-pharmacy.com</a>.</p>
    
    <p>Thank you for partnering with E-Pharmacy to provide high-quality pharmaceutical care.</p>
    
    <p>Best regards,<br>The E-Pharmacy Pharmacy Relations Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Email sent when verification is successful for admins
 * @param {Object} data - Data for template insertion
 * @returns {Object} - HTML and text email content
 */
const verificationSuccessAdmin = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Email Verification Successful!</h2>
    
    <p>Dear {{{firstName}}} {{{lastName}}},</p>
    
    <p>Your email address has been successfully verified. Your administrator account is now active.</p>
    
    <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #4CAF50; margin-top: 0;">Administrator Access Granted</h3>
      <p style="margin-bottom: 0;">You now have full access to the E-Pharmacy administration portal.</p>
    </div>
    
    <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #ff6f00;">Security Reminder</h3>
      <p style="margin-bottom: 0;">Remember to enable two-factor authentication for your account to add an extra layer of security. This can be done in your account settings.</p>
    </div>
    
    <h3 style="color: #4CAF50;">Get Started:</h3>
    
    <ul style="padding-left: 20px;">
      <li>Log in to the administration portal</li>
      <li>Review your assigned roles and permissions</li>
      <li>Set up your security preferences</li>
      <li>Complete your administrator training modules</li>
    </ul>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://admin.e-pharmacy.com/dashboard" style="${buttonStyle}">Access Admin Dashboard</a>
    </p>
    
    <p>If you have any questions or need assistance, please contact the IT support team at <a href="mailto:admin-support@e-pharmacy.com" style="color: #4CAF50;">admin-support@e-pharmacy.com</a>.</p>
    
    <p>Best regards,<br>The E-Pharmacy IT Security Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Email sent when credentials are approved for healthcare providers
 * @param {Object} data - Data for template insertion
 * @returns {Object} - HTML and text email content
 */
const credentialsApproved = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Your Healthcare Provider Credentials Are Approved!</h2>
    
    <p>Dear ${data.role === 'doctor' ? 'Dr.' : ''} {{{firstName}}} {{{lastName}}},</p>
    
    <p>Great news! Your professional credentials have been verified and approved by our team. Your ${data.role === 'doctor' ? 'doctor' : 'pharmacist'} account is now fully activated.</p>
    
    <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #4CAF50; margin-top: 0;">Account Fully Activated</h3>
      <p style="margin-bottom: 0;">You now have complete access to all ${data.role === 'doctor' ? 'healthcare provider' : 'pharmacy'} features on our platform.</p>
    </div>
    
    <h3 style="color: #4CAF50;">Next Steps:</h3>
    ${data.role === 'doctor' ? `
    <ol style="padding-left: 20px;">
      <li><strong>Complete your professional profile</strong> - Add your specializations, education, and professional experience</li>
      <li><strong>Set your availability</strong> - Configure your schedule for telemedicine consultations</li>
      <li><strong>Review prescription guidelines</strong> - Familiarize yourself with our digital prescription policies</li>
      <li><strong>Connect with pharmacies</strong> - Establish relationships with pharmacies on our platform</li>
    </ol>
    ` : `
    <ol style="padding-left: 20px;">
      <li><strong>Complete your pharmacy profile</strong> - Add your services, operating hours, and delivery options</li>
      <li><strong>Set up your inventory</strong> - Add medications and healthcare products to your digital inventory</li>
      <li><strong>Configure prescription workflows</strong> - Set up your prescription handling processes</li>
      <li><strong>Connect with doctors</strong> - Establish relationships with healthcare providers on our platform</li>
    </ol>
    `}
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.role === 'doctor' ? 'https://doctors.e-pharmacy.com/dashboard' : 'https://pharmacy.e-pharmacy.com/dashboard'}" style="${buttonStyle}">Go to ${data.role === 'doctor' ? 'Provider' : 'Pharmacy'} Dashboard</a>
    </p>
    
    <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0d47a1;">Important Information</h3>
      <p>Please review our healthcare ${data.role === 'doctor' ? 'provider' : 'pharmacy'} guidelines and policies to ensure compliance with regulatory requirements and platform standards.</p>
      <p style="margin-bottom: 0;">Our team is available to assist you with any questions or technical issues as you get started with the platform.</p>
    </div>
    
    <p>As a verified ${data.role === 'doctor' ? 'healthcare provider' : 'pharmacist'} on E-Pharmacy, you play a crucial role in our mission to improve healthcare access and outcomes. We're excited to have you as part of our professional network.</p>
    
    <p>If you have any questions or need assistance, please contact our ${data.role === 'doctor' ? 'provider' : 'pharmacy'} support team at <a href="mailto:${data.role === 'doctor' ? 'provider-support@e-pharmacy.com' : 'pharmacy-support@e-pharmacy.com'}" style="color: #4CAF50;">${data.role === 'doctor' ? 'provider-support@e-pharmacy.com' : 'pharmacy-support@e-pharmacy.com'}</a>.</p>
    
    <p>Best regards,<br>The E-Pharmacy ${data.role === 'doctor' ? 'Provider Relations' : 'Pharmacy Relations'} Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Email sent when credentials are rejected for healthcare providers
 * @param {Object} data - Data for template insertion
 * @returns {Object} - HTML and text email content
 */
const credentialsRejected = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Your Credentials Review Update</h2>
    
    <p>Dear ${data.role === 'doctor' ? 'Dr.' : ''} {{{firstName}}} {{{lastName}}},</p>
    
    <p>Thank you for your interest in joining E-Pharmacy as a ${data.role === 'doctor' ? 'healthcare provider' : 'pharmacist'}. Our verification team has completed the review of your credentials.</p>
    
    <div style="background-color: #ffeaeb; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #c62828;">Additional Information Required</h3>
      <p>We were unable to complete the verification process with the information provided. To proceed with your account activation, we need the following:</p>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        ${data.reasons ? data.reasons.map(reason => `<li>${reason}</li>`).join('') : '<li>Additional credential documentation</li>'}
      </ul>
    </div>
    
    <p>Please log in to your account and update your profile with the requested information. Once updated, our team will review your application again.</p>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.role === 'doctor' ? 'https://doctors.e-pharmacy.com/profile' : 'https://pharmacy.e-pharmacy.com/profile'}" style="${buttonStyle}">Update My Profile</a>
    </p>
    
    <p>If you have any questions about the verification requirements or need assistance with the process, please contact our verification team at <a href="mailto:verification@e-pharmacy.com" style="color: #4CAF50;">verification@e-pharmacy.com</a>.</p>
    
    <p>We appreciate your patience and look forward to welcoming you to our platform once the verification process is complete.</p>
    
    <p>Best regards,<br>The E-Pharmacy Verification Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Password reset email template
 * @param {Object} data - Data for template insertion
 * @returns {Object} - HTML and text email content
 */
const passwordReset = (data) => {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Password Reset Request</h2>
    
    <p>Dear ${data.role === 'doctor' ? 'Dr.' : ''} {{{firstName}}},</p>
    
    <p>We received a request to reset your password for your E-Pharmacy account. To proceed with the password reset, please click the button below:</p>
    
    <p style="text-align: center;">
      <a href="{{{resetUrl}}}" style="${buttonStyle}">Reset My Password</a>
    </p>
    
    <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
    
    <p style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all;">
      {{{resetUrl}}}
    </p>
    
    <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #ff6f00;">Important Security Notice</h3>
      <p style="margin-bottom: 0;">This password reset link will expire in 1 hour for security reasons. If you did not request a password reset, please ignore this email or contact our support team immediately if you have concerns about your account security.</p>
    </div>
    
    <p>For security reasons, we recommend using a strong, unique password that:</p>
    <ul style="padding-left: 20px;">
      <li>Is at least 8 characters long</li>
      <li>Contains a mix of uppercase and lowercase letters</li>
      <li>Includes numbers and special characters</li>
      <li>Is not used for any other accounts</li>
    </ul>
    
    <p>If you have any questions or need assistance, please contact our support team at <a href="mailto:support@e-pharmacy.com" style="color: #4CAF50;">support@e-pharmacy.com</a>.</p>
    
    <p>Best regards,<br>The E-Pharmacy Security Team</p>
  `;
  
  return {
    html: insertData(headerTemplate + content + footerTemplate, data),
    text: generatePlainText(insertData(content, data))
  };
};

/**
 * Get template by role and type
 * @param {string} role - User role
 * @param {string} type - Template type
 * @param {Object} data - Template data
 * @returns {Object} - Template HTML and text
 */
const getTemplateByRole = (role, type, data) => {
  const templates = {
    welcome: {
      patient: userWelcome,
      doctor: doctorWelcome,
      pharmacist: pharmacistWelcome,
      admin: adminWelcome
    },
    verification_success: {
      patient: verificationSuccessPatient,
      doctor: verificationSuccessDoctor,
      pharmacist: verificationSuccessPharmacist,
      admin: verificationSuccessAdmin
    }
  };
  
  // Get the appropriate template function
  const templateFunc = templates[type]?.[role] || templates[type]?.patient;
  
  if (!templateFunc) {
    console.error(`Template not found for role: ${role}, type: ${type}`);
    return null;
  }
  
  return templateFunc(data);
};

module.exports = {
  // Main template functions
  userWelcome,
  doctorWelcome,
  pharmacistWelcome,
  adminWelcome,
  
  // Verification success templates
  verificationSuccessPatient,
  verificationSuccessDoctor,
  verificationSuccessPharmacist,
  verificationSuccessAdmin,
  
  // Credential management templates
  credentialsApproved,
  credentialsRejected,
  
  // Additional templates
  passwordReset,
  
  // Utility functions
  getTemplateByRole,
  insertData,
  generatePlainText
};
