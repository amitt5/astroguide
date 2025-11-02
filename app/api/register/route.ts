import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getZodiacSign } from "@/lib/astrological-engine"

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

