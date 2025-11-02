import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateDailyHoroscope } from "@/lib/astrological-engine"
import { sendWhatsAppMessage } from "@/lib/twilio-client"

// This cron job runs daily at 9 AM UTC
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[v0] Starting daily horoscope cron job")

    // Get all users
    const users = await db.getAllUsers()
    console.log(`[v0] Found ${users.length} users to send horoscopes to`)

    let sent = 0
    let failed = 0

    for (const user of users) {
      try {
        // Generate horoscope for user's zodiac sign
        const horoscope = await generateDailyHoroscope(user.zodiacSign)

        // Format message with horoscope
        const message = `✨ Daily Horoscope for ${user.zodiacSign} ✨\n\n${horoscope}`

        // Send via WhatsApp
        await sendWhatsAppMessage(user.whatsappNumber, message)

        // Create scheduled message record
        await db.createScheduledMessage({
          userId: user.id,
          messageContent: message,
          scheduledTime: new Date().toISOString(),
          sent: true,
        })

        sent++
        console.log(`[v0] Sent horoscope to user ${user.id}`)
      } catch (error) {
        failed++
        console.error(`[v0] Failed to send horoscope to user ${user.id}:`, error)
      }
    }

    console.log(`[v0] Horoscope cron job completed. Sent: ${sent}, Failed: ${failed}`)

    return NextResponse.json({
      success: true,
      message: `Horoscopes sent to ${sent} users. ${failed} failed.`,
      sent,
      failed,
    })
  } catch (error) {
    console.error("[v0] Cron job error:", error)
    return NextResponse.json(
      { error: "Cron job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
