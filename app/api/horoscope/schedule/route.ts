import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateDailyHoroscope } from "@/lib/astrological-engine"
import { sendWhatsAppMessage } from "@/lib/twilio-client"

export async function POST(request: Request) {
  try {
    const { userId, immediate } = await request.json()

    const user = await db.getUser(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate horoscope
    const horoscopeContent = await generateDailyHoroscope(user.zodiacSign)
    const message = `✨ Daily Horoscope for ${user.zodiacSign} ✨\n\n${horoscopeContent}`

    if (immediate) {
      // Send immediately
      try {
        await sendWhatsAppMessage(user.whatsappNumber, message)
        console.log("[v0] Sent immediate horoscope to:", userId)
      } catch (error) {
        console.error("[v0] Failed to send immediate horoscope:", error)
      }
    }

    // Schedule for later
    const scheduledTime = new Date()
    scheduledTime.setDate(scheduledTime.getDate() + 1)
    scheduledTime.setHours(9, 0, 0, 0)

    const scheduled = await db.createScheduledMessage({
      userId,
      messageContent: message,
      scheduledTime: scheduledTime.toISOString(),
      sent: false,
    })

    return NextResponse.json({
      success: true,
      scheduled,
      scheduledFor: scheduledTime.toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error scheduling horoscope:", error)
    return NextResponse.json({ error: "Failed to schedule horoscope" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const messages = await db.getScheduledMessages()
    const pending = messages.filter((m) => !m.sent)
    const sent = messages.filter((m) => m.sent)

    return NextResponse.json({
      total: messages.length,
      pending: pending.length,
      sent: sent.length,
      messages,
    })
  } catch (error) {
    console.error("[v0] Error fetching scheduled messages:", error)
    return NextResponse.json({ error: "Failed to fetch scheduled messages" }, { status: 500 })
  }
}
