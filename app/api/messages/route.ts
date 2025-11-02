import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  generateAstrologicalResponse,
  generateDailyHoroscope,
  processUserIntent,
  type AstrologicalContext,
  type UserIntent,
} from "@/lib/openai-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, phoneNumber, source = "web" } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required", success: false }, { status: 400 })
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json(
        { error: "Phone number is required to identify user", success: false },
        { status: 400 },
      )
    }

    // Identify user by phone number
    const user = await db.getUserByWhatsApp(phoneNumber.trim())

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found. Please complete registration first.",
          success: false,
          needsRegistration: true,
        },
        { status: 404 },
      )
    }

    // Get user's natal chart (if available)
    const natalChart = await db.getNatalChartByUser(user.id)

    // Process user intent using OpenAI
    const intentClassification = await processUserIntent(message)
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

      astrologicalResponse = await generateAstrologicalResponse(context, message, intent)
    }

    // Save conversation with source tracking
    const conversation = await db.createConversation({
      userId: user.id,
      userMessage: message,
      assistantResponse: astrologicalResponse,
      messageType,
      messageSource: source,
    })

    return NextResponse.json({
      success: true,
      response: astrologicalResponse,
      conversation,
      intent: intent,
    })
  } catch (error) {
    console.error("[v0] Messages API error:", error)
    return NextResponse.json({ error: "Failed to process message", success: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Messages API is active" })
}
