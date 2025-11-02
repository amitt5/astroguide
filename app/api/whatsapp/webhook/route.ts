import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  generateAstrologicalResponse,
  generateDailyHoroscope,
  processUserIntent,
  type AstrologicalContext,
} from "@/lib/openai-service"
import { sendWhatsAppMessage } from "@/lib/twilio-client"
import { getZodiacSign } from "@/lib/astrological-engine"
import { calculateNatalChart, chartToNatalChart } from "@/lib/natal-chart-service"

/**
 * Extract phone number from Twilio WhatsApp format
 * Format: "whatsapp:+1234567890" or "whatsapp: 1234567890" -> "+1234567890" or "1234567890"
 */
function extractPhoneNumber(from: string): string {
  // Remove "whatsapp:" prefix if present and clean up
  let phoneNumber = from.replace(/^whatsapp:/i, "").trim()
  
  // Ensure it starts with + if it's a valid international format
  // If it doesn't start with + and looks like a number, keep as is (might be local format)
  return phoneNumber
}

/**
 * Parse registration message from WhatsApp
 * Format: REGISTER\nName: ...\nDate: ...\nTime: ...\nLocation: ...
 */
function parseRegistrationMessage(body: string): {
  name?: string
  birthDate?: string
  birthTime?: string
  birthLocation?: string
} | null {
  const lines = body.split("\n").map((line) => line.trim())
  
  if (!lines[0] || !lines[0].toLowerCase().includes("register")) {
    return null
  }

  const data: { name?: string; birthDate?: string; birthTime?: string; birthLocation?: string } = {}

  for (const line of lines) {
    if (line.toLowerCase().startsWith("name:")) {
      data.name = line.substring(5).trim()
    } else if (line.toLowerCase().startsWith("date:")) {
      data.birthDate = line.substring(5).trim()
    } else if (line.toLowerCase().startsWith("time:")) {
      data.birthTime = line.substring(5).trim()
    } else if (line.toLowerCase().startsWith("location:")) {
      data.birthLocation = line.substring(9).trim()
    }
  }

  // Return data only if all fields are present
  if (data.name && data.birthDate && data.birthTime && data.birthLocation) {
    return data
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get("From") as string
    const body = formData.get("Body") as string
    const messageId = formData.get("MessageSid") as string

    console.log("[WhatsApp] Received message:", { from, body: body?.substring(0, 50), messageId })

    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 })
    }

    if (!from) {
      return NextResponse.json({ error: "From number is required" }, { status: 400 })
    }

    // Extract phone number from Twilio format
    const phoneNumber = extractPhoneNumber(from)

    // Check if this is a registration message
    const registrationData = parseRegistrationMessage(body)

    // Identify user by phone number
    let user = await db.getUserByWhatsApp(phoneNumber)

    // Handle registration
    if (registrationData) {
      if (user) {
        // User already exists
        const message = "You're already registered! Send me your questions and I'll provide personalized astrological guidance. ✨"
        await sendWhatsAppMessage(phoneNumber, message)
        return NextResponse.json({ success: true, message: "User already registered" })
      }

      // Create new user
      try {
        const zodiacSign = getZodiacSign(registrationData.birthDate!)

        user = await db.createUser({
          whatsappNumber: phoneNumber,
          name: registrationData.name!,
          birthDate: registrationData.birthDate!,
          birthTime: registrationData.birthTime!,
          birthLocation: registrationData.birthLocation!,
          zodiacSign,
        })

        // Calculate and save natal chart
        try {
          console.log(`[WhatsApp] Calculating natal chart for user ${user.id}`, {
            birthDate: registrationData.birthDate,
            birthTime: registrationData.birthTime,
            birthLocation: registrationData.birthLocation,
          })
          
          const calculatedChart = await calculateNatalChart({
            birthDate: registrationData.birthDate!,
            birthTime: registrationData.birthTime!,
            birthLocation: registrationData.birthLocation!,
          })

          if (calculatedChart) {
            try {
              const natalChartData = chartToNatalChart(user.id, calculatedChart)
              await db.createNatalChart(natalChartData)
              console.log(`[WhatsApp] Natal chart calculated and saved for user ${user.id}`)
            } catch (dbError) {
              console.error(`[WhatsApp] Error saving natal chart for user ${user.id}:`, dbError)
              if (dbError instanceof Error) {
                console.error("[WhatsApp] Database error details:", dbError.message)
              }
            }
          } else {
            console.warn(`[WhatsApp] Could not calculate natal chart for user ${user.id} - calculateNatalChart returned null`)
          }
        } catch (chartError) {
          // Don't fail registration if chart calculation fails
          console.error("[WhatsApp] Error calculating natal chart:", chartError)
          if (chartError instanceof Error) {
            console.error("[WhatsApp] Error details:", chartError.message)
            console.error("[WhatsApp] Error stack:", chartError.stack)
          }
        }

        const successMessage =
          `Welcome ${user.name}! ✨\n\nYour account has been created successfully.\n` +
          `Your zodiac sign is ${user.zodiacSign}.\n\n` +
          `You can now ask me questions like:\n` +
          `• "What's my horoscope today?"\n` +
          `• "Should I invest in crypto?"\n` +
          `• "What about my career?"\n\n` +
          `Ask me anything! 🌟`

        await sendWhatsAppMessage(phoneNumber, successMessage)
        console.log("[WhatsApp] User registered successfully:", phoneNumber)
        return NextResponse.json({ success: true, message: "User registered", userId: user.id })
      } catch (error) {
        console.error("[WhatsApp] Registration error:", error)
        const errorMessage = "Sorry, there was an error during registration. Please try again with the correct format:\n\nREGISTER\nName: [Your Name]\nDate: YYYY-MM-DD\nTime: HH:MM\nLocation: [City, Country]"
        await sendWhatsAppMessage(phoneNumber, errorMessage)
        return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 })
      }
    }

    if (!user) {
      // User not found - send registration prompt
      const registrationMessage =
        "Welcome to AstroGuide! ✨\n\nTo get personalized astrological guidance, please register first.\n\n" +
        "Please send your registration details in this format:\n" +
        "REGISTER\nName: [Your Name]\nDate: YYYY-MM-DD\nTime: HH:MM (24-hour)\nLocation: [City, Country]\n\n" +
        "Example:\n" +
        "REGISTER\nName: John Doe\nDate: 1990-05-15\nTime: 14:30\nLocation: New York, USA"

      try {
        // Use extracted phoneNumber (without whatsapp: prefix) - sendWhatsAppMessage will add it
        await sendWhatsAppMessage(phoneNumber, registrationMessage)
        console.log("[WhatsApp] Sent registration prompt to:", phoneNumber)
      } catch (error) {
        console.error("[WhatsApp] Failed to send registration prompt:", error)
      }

      return NextResponse.json({ success: true, message: "Registration prompt sent" })
    }

    // Get user's natal chart (if available)
    const natalChart = await db.getNatalChartByUser(user.id)

    // Process user intent using OpenAI
    const intentClassification = await processUserIntent(body)
    const intent = intentClassification.intent

    // Map intent to message type for database storage
    let messageType: "question" | "horoscope" | "guidance" = "question"
    if (intent === "horoscope") {
      messageType = "horoscope"
    } else if (
      intent === "investment_advice" ||
      intent === "relationship" ||
      intent === "career" ||
      intent === "health" ||
      intent === "general_guidance"
    ) {
      messageType = "guidance"
    }

    // Generate astrological response based on intent
    let astrologicalResponse: string

    if (intent === "horoscope") {
      // Generate daily horoscope
      astrologicalResponse = await generateDailyHoroscope(user.zodiacSign)
    } else {
      // Generate personalized response using OpenAI
      const context: AstrologicalContext = {
        sunSign: user.zodiacSign,
        moonSign: natalChart?.moonSign || "Unknown",
        ascendant: natalChart?.ascendant || "Unknown",
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthLocation: user.birthLocation,
      }

      astrologicalResponse = await generateAstrologicalResponse(context, body, intent)
    }

    // Save conversation with WhatsApp source
    await db.createConversation({
      userId: user.id,
      userMessage: body,
      assistantResponse: astrologicalResponse,
      messageType,
      messageSource: "whatsapp",
    })

    console.log("[WhatsApp] Response generated for user:", user.id, "intent:", intent)

    // Send response back via WhatsApp
    try {
      await sendWhatsAppMessage(phoneNumber, astrologicalResponse)
      console.log("[WhatsApp] Message sent successfully to:", phoneNumber)
    } catch (error) {
      console.error("[WhatsApp] Failed to send WhatsApp message:", error)
      // Log more details about the error
      if (error instanceof Error) {
        console.error("[WhatsApp] Error details:", error.message)
      }
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error("[WhatsApp] Webhook error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "WhatsApp webhook is active" })
}
