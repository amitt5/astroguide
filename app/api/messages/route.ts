import { type NextRequest, NextResponse } from "next/server"
import { db, getHardcodedUser } from "@/lib/db"
import { generateAstrologicalResponse } from "@/lib/astrological-engine"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, source = "web" } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Use hardcoded user for MVP
    const user = getHardcodedUser()

    // Determine message type
    let messageType: "question" | "horoscope" | "guidance" = "question"
    if (message.toLowerCase().includes("horoscope")) {
      messageType = "horoscope"
    } else if (message.toLowerCase().includes("guidance") || message.toLowerCase().includes("advice")) {
      messageType = "guidance"
    }

    // Generate astrological response
    const astrologicalResponse = await generateAstrologicalResponse(
      {
        sunSign: user.zodiacSign,
        moonSign: "Scorpio",
        ascendant: "Virgo",
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
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Messages API is active" })
}
