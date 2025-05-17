/**
 * Mock Prescription Verification Service
 *
 * This utility simulates a prescription verification service for development and testing.
 * It provides predictable responses based on input data without requiring external API calls.
 */

// Controlled substances database for testing
const CONTROLLED_SUBSTANCES = [
  { name: "Alprazolam", schedule: "IV", aliases: ["Xanax"] },
  { name: "Oxycodone", schedule: "II", aliases: ["OxyContin", "Roxicodone"] },
  { name: "Adderall", schedule: "II", aliases: ["Amphetamine"] },
  { name: "Ritalin", schedule: "II", aliases: ["Methylphenidate"] },
  { name: "Vicodin", schedule: "II", aliases: ["Hydrocodone"] },
  { name: "Ambien", schedule: "IV", aliases: ["Zolpidem"] },
  { name: "Valium", schedule: "IV", aliases: ["Diazepam"] },
  { name: "Ativan", schedule: "IV", aliases: ["Lorazepam"] },
  { name: "Tramadol", schedule: "IV", aliases: [] },
  { name: "Codeine", schedule: "II", aliases: [] },
]

// Licensed doctors database for testing
const LICENSED_DOCTORS = [
  { name: "Dr. Jane Smith", license: "MD12345", hospital: "City General Hospital" },
  { name: "Dr. John Williams", license: "MD54321", hospital: "Memorial Medical Center" },
  { name: "Dr. Sarah Johnson", license: "MD98765", hospital: "University Hospital" },
  { name: "Dr. Michael Brown", license: "MD56789", hospital: "Community Health Center" },
]

/**
 * Mock OCR function to simulate text extraction from prescription images
 * @param {string} filePath - Path to the prescription image
 * @param {Object} options - Additional options for OCR
 * @returns {Promise<Object>} OCR results
 */
const mockOCR = async (filePath, options = {}) => {
  // Extract filename to determine mock response
  const filename = filePath.split("/").pop().toLowerCase()

  // Default OCR result
  const result = {
    text: "Dr. Jane Smith\nLicense: MD12345\nCity General Hospital\nPatient: John Doe\nDate: 2023-05-15\nRx: Amoxicillin 500mg\nSig: 1 capsule by mouth three times daily\nDisp: 30 capsules\nRefills: 1",
    confidence: 0.92,
    blocks: [
      { text: "Dr. Jane Smith", type: "doctor_name", confidence: 0.95 },
      { text: "License: MD12345", type: "license", confidence: 0.93 },
      { text: "City General Hospital", type: "hospital", confidence: 0.94 },
      { text: "Patient: John Doe", type: "patient", confidence: 0.91 },
      { text: "Date: 2023-05-15", type: "date", confidence: 0.96 },
      { text: "Rx: Amoxicillin 500mg", type: "medication", confidence: 0.89 },
      { text: "Sig: 1 capsule by mouth three times daily", type: "instructions", confidence: 0.87 },
      { text: "Disp: 30 capsules", type: "dispense", confidence: 0.92 },
      { text: "Refills: 1", type: "refills", confidence: 0.95 },
    ],
  }

  // Simulate different prescriptions based on filename
  if (filename.includes("controlled") || filename.includes("xanax")) {
    result.text = result.text.replace("Amoxicillin 500mg", "Alprazolam 0.5mg")
    result.text = result.text.replace("Refills: 1", "Refills: 0")
    result.text = result.text.replace("three times daily", "twice daily as needed for anxiety")
    result.blocks[5].text = "Rx: Alprazolam 0.5mg"
    result.blocks[6].text = "Sig: 1 tablet by mouth twice daily as needed for anxiety"
    result.blocks[8].text = "Refills: 0"
  } else if (filename.includes("tampered") || filename.includes("fake")) {
    // Lower confidence for tampered prescriptions
    result.confidence = 0.65
    result.blocks.forEach((block) => {
      block.confidence = Math.max(0.5, block.confidence - 0.3)
    })
  } else if (filename.includes("ai") || filename.includes("generated")) {
    // Slightly different format for AI-generated prescriptions
    result.text = result.text.replace("Dr. Jane Smith", "Dr. Jane A. Smith, M.D.")
    result.text = result.text.replace("License: MD12345", "License #MD12345")
    result.blocks[0].text = "Dr. Jane A. Smith, M.D."
    result.blocks[1].text = "License #MD12345"
  }

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 500))

  return result
}

/**
 * Mock function to detect controlled substances in prescription text
 * @param {Object} extractedText - OCR results from prescription
 * @returns {Promise<Array>} Detected controlled substances
 */
const mockDetectControlledSubstances = async (extractedText) => {
  const detectedSubstances = []
  const text = extractedText.text.toLowerCase()

  CONTROLLED_SUBSTANCES.forEach((substance) => {
    if (text.includes(substance.name.toLowerCase())) {
      detectedSubstances.push({
        name: substance.name,
        schedule: substance.schedule,
        matchType: "direct",
      })
    } else {
      substance.aliases.forEach((alias) => {
        if (text.includes(alias.toLowerCase())) {
          detectedSubstances.push({
            name: substance.name,
            schedule: substance.schedule,
            matchType: "alias",
            matchedAlias: alias,
          })
        }
      })
    }
  })

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 300))

  return detectedSubstances
}

/**
 * Mock function to detect tampering in prescription images
 * @param {string} filePath - Path to the prescription image
 * @returns {Promise<Object>} Tampering detection results
 */
const mockDetectTampering = async (filePath) => {
  // Extract filename to determine mock response
  const filename = filePath.split("/").pop().toLowerCase()

  // Default result (no tampering)
  const result = {
    tampered: false,
    confidence: 0.95,
    methods: [
      { name: "error_level_analysis", result: "no_tampering", confidence: 0.94 },
      { name: "clone_detection", result: "no_cloning", confidence: 0.96 },
      { name: "metadata_analysis", result: "consistent", confidence: 0.93 },
      { name: "noise_analysis", result: "consistent", confidence: 0.92 },
    ],
  }

  // Simulate tampering detection based on filename
  if (filename.includes("tampered") || filename.includes("fake") || filename.includes("altered")) {
    result.tampered = true
    result.confidence = 0.85
    result.methods[0].result = "tampering_detected"
    result.methods[0].confidence = 0.87
    result.methods[2].result = "inconsistent"
    result.methods[2].confidence = 0.82
  }

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 700))

  return result
}

/**
 * Mock function to detect AI-generated prescription images
 * @param {string} filePath - Path to the prescription image
 * @returns {Promise<Object>} AI detection results
 */
const mockDetectAIGeneration = async (filePath) => {
  // Extract filename to determine mock response
  const filename = filePath.split("/").pop().toLowerCase()

  // Default result (not AI-generated)
  const result = {
    aiGenerated: false,
    confidence: 0.93,
    methods: [
      { name: "gan_detection", result: "not_detected", confidence: 0.92 },
      { name: "artifact_analysis", result: "natural", confidence: 0.94 },
      { name: "pattern_analysis", result: "natural", confidence: 0.91 },
    ],
  }

  // Simulate AI detection based on filename
  if (filename.includes("ai") || filename.includes("generated") || filename.includes("synthetic")) {
    result.aiGenerated = true
    result.confidence = 0.88
    result.methods[0].result = "detected"
    result.methods[0].confidence = 0.89
    result.methods[1].result = "artificial"
    result.methods[1].confidence = 0.87
    result.methods[2].result = "artificial"
    result.methods[2].confidence = 0.9
  }

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 600))

  return result
}

/**
 * Mock function to validate doctor information
 * @param {Object} doctorInfo - Doctor information from form
 * @param {Object} extractedText - OCR results from prescription
 * @returns {Promise<Object>} Validation results
 */
const mockValidateDoctorInfo = async (doctorInfo, extractedText) => {
  const textContent = extractedText.text.toLowerCase()

  // Check if doctor exists in our mock database
  const doctorExists = LICENSED_DOCTORS.some(
    (doctor) =>
      doctor.name.toLowerCase().includes(doctorInfo.name.toLowerCase()) &&
      doctor.license.toLowerCase() === doctorInfo.license.toLowerCase(),
  )

  // Check if doctor info appears in the prescription text
  const nameMatch = textContent.includes(doctorInfo.name.toLowerCase())
  const licenseMatch = textContent.includes(doctorInfo.license.toLowerCase())
  const hospitalMatch = doctorInfo.hospital ? textContent.includes(doctorInfo.hospital.toLowerCase()) : false

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 400))

  return {
    validated: doctorExists || (nameMatch && licenseMatch),
    confidence: doctorExists ? 0.95 : nameMatch && licenseMatch ? 0.85 : 0.5,
    nameMatch,
    licenseMatch,
    hospitalMatch,
    contactMatch: false, // Mock service doesn't validate contact info
    inDatabase: doctorExists,
  }
}

/**
 * Main mock verification function
 * @param {string} filePath - Path to the prescription image
 * @param {Object} formData - Form data submitted with the prescription
 * @returns {Promise<Object>} Complete verification results
 */
const mockVerifyPrescription = async (filePath, formData = {}) => {
  try {
    // 1. Extract text from prescription image
    const extractedText = await mockOCR(filePath)

    // 2. Check for controlled substances
    const controlledSubstances = await mockDetectControlledSubstances(extractedText)

    // 3. Check for tampering
    const tamperDetectionResult = await mockDetectTampering(filePath)

    // 4. Check for AI generation
    const aiDetectionResult = await mockDetectAIGeneration(filePath)

    // 5. Validate doctor information
    const doctorValidationResult = await mockValidateDoctorInfo(
      {
        name: formData.doctorName || "",
        license: formData.doctorLicense || "",
        hospital: formData.doctorHospital || "",
        contact: formData.doctorContact || "",
      },
      extractedText,
    )

    // 6. Determine if manual review is needed
    const needsManualReview =
      controlledSubstances.some((substance) => substance.schedule === "II") ||
      tamperDetectionResult.confidence < 0.85 ||
      aiDetectionResult.confidence < 0.85 ||
      !doctorValidationResult.validated

    // 7. Determine overall verification status
    let verificationStatus = "verified"
    let complianceStatus = "compliant"

    if (tamperDetectionResult.tampered || aiDetectionResult.aiGenerated) {
      verificationStatus = "failed"
      complianceStatus = "non_compliant"
    } else if (needsManualReview) {
      verificationStatus = "pending_review"
      complianceStatus = "pending"
    }

    // 8. Compile complete verification result
    const verificationResult = {
      prescriptionId: `mock_${Date.now()}`,
      fileName: filePath.split("/").pop(),
      originalName: formData.originalName || filePath.split("/").pop(),
      uploadDate: new Date().toISOString(),
      verificationStatus,
      verificationDetails: {
        ocrResult: {
          confidence: extractedText.confidence,
          blockCount: extractedText.blocks.length,
        },
        tamperDetection: tamperDetectionResult,
        aiGeneration: aiDetectionResult,
        doctorValidation: doctorValidationResult,
      },
      controlledSubstances,
      tamperedStatus: tamperDetectionResult.tampered ? "detected" : "not_detected",
      aiGeneratedStatus: aiDetectionResult.aiGenerated ? "detected" : "not_detected",
      complianceStatus,
      needsManualReview,
      extractedText: extractedText.text, // Include extracted text for reference
    }

    return {
      success: true,
      data: verificationResult,
    }
  } catch (error) {
    console.error("Mock verification error:", error)
    return {
      success: false,
      error: "Prescription verification failed",
      details: error.message,
    }
  }
}

module.exports = {
  mockVerifyPrescription,
  mockOCR,
  mockDetectControlledSubstances,
  mockDetectTampering,
  mockDetectAIGeneration,
  mockValidateDoctorInfo,
}
