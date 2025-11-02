import { type NextRequest, NextResponse } from "next/server"
import { db, getHardcodedUser } from "@/lib/db"
import { generateAstrologicalResponse } from "@/lib/astrological-engine"
import { sendWhatsAppMessage } from "@/lib/twilio-client"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const from = formData.get("From") as string
    const body = formData.get("Body") as string
    const messageId = formData.get("MessageSid") as string

    console.log("[v0] Received WhatsApp message:", { from, body, messageId })

    // Use hardcoded user for MVP
    const user = getHardcodedUser()

    // Determine message type
    let messageType: "question" | "horoscope" | "guidance" = "question"
    if (body.toLowerCase().includes("horoscope")) {
      messageType = "horoscope"
    }

    // Generate astrological response
    const astrologicalResponse = await generateAstrologicalResponse(
      {
        sunSign: user.zodiacSign,
        moonSign: "Scorpio",
        ascendant: "Virgo",
      },
      body,
    )

    // Save conversation with WhatsApp source
    await db.createConversation({
      userId: user.id,
      userMessage: body,
      assistantResponse: astrologicalResponse,
      messageType,
      messageSource: "whatsapp",
    })

    console.log("[v0] Response generated for user:", user.id)

    // Send response back via WhatsApp
    try {
      await sendWhatsAppMessage(from, astrologicalResponse)
      console.log("[v0] Message sent successfully to:", from)
    } catch (error) {
      console.error("[v0] Failed to send WhatsApp message:", error)
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error("[v0] WhatsApp webhook error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "WhatsApp webhook is active" })
}
