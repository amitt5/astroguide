import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateAstrologicalResponse } from "@/lib/astrological-engine"

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
          error:
            "User not found. Please ensure you have registered with this phone number. If this is your first time, please provide your birth details to create an account.",
          success: false,
        },
        { status: 404 },
      )
    }

    // Get user's natal chart (if available)
    const natalChart = await db.getNatalChartByUser(user.id)

    // Determine message type
    let messageType: "question" | "horoscope" | "guidance" = "question"
    if (message.toLowerCase().includes("horoscope")) {
      messageType = "horoscope"
    } else if (message.toLowerCase().includes("guidance") || message.toLowerCase().includes("advice")) {
      messageType = "guidance"
    }

    // Generate astrological response
    // Use natal chart data if available, otherwise use basic zodiac sign
    const astrologicalResponse = await generateAstrologicalResponse(
      {
        sunSign: user.zodiacSign,
        moonSign: natalChart?.moonSign || "Unknown",
        ascendant: natalChart?.ascendant || "Unknown",
      },
      message,
    )

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
    })
  } catch (error) {
    console.error("[v0] Messages API error:", error)
    return NextResponse.json({ error: "Failed to process message", success: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Messages API is active" })
}
