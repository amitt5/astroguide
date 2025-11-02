import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getZodiacSign } from "@/lib/astrological-engine"
import { calculateNatalChart, chartToNatalChart } from "@/lib/natal-chart-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, name, birthDate, birthTime, birthLocation } = body

    // Validate required fields
    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json({ error: "Phone number is required", success: false }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required", success: false }, { status: 400 })
    }

    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required", success: false }, { status: 400 })
    }

    if (!birthTime) {
      return NextResponse.json({ error: "Birth time is required", success: false }, { status: 400 })
    }

    if (!birthLocation || !birthLocation.trim()) {
      return NextResponse.json({ error: "Birth location is required", success: false }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.getUserByWhatsApp(phoneNumber.trim())
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this phone number already exists", success: false },
        { status: 409 },
      )
    }

    // Calculate zodiac sign from birth date
    const zodiacSign = getZodiacSign(birthDate)

    // Create user
    const user = await db.createUser({
      whatsappNumber: phoneNumber.trim(),
      name: name.trim(),
      birthDate: birthDate,
      birthTime: birthTime,
      birthLocation: birthLocation.trim(),
      zodiacSign,
    })

    // Calculate and save natal chart
    try {
      const calculatedChart = await calculateNatalChart({
        birthDate,
        birthTime,
        birthLocation: birthLocation.trim(),
      })

      if (calculatedChart) {
        const natalChartData = chartToNatalChart(user.id, calculatedChart)
        await db.createNatalChart(natalChartData)
        console.log(`[Registration] Natal chart calculated for user ${user.id}`)
      } else {
        console.warn(`[Registration] Could not calculate natal chart for user ${user.id}`)
      }
    } catch (chartError) {
      // Don't fail registration if chart calculation fails
      console.error("[Registration] Error calculating natal chart:", chartError)
    }

    return NextResponse.json({
      success: true,
      user,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("[v0] Registration API error:", error)
    return NextResponse.json({ error: "Failed to register user", success: false }, { status: 500 })
  }
}

