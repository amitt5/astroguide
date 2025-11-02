export interface AstrologicalContext {
  sunSign: string
  moonSign: string
  ascendant: string
  question?: string
}

const zodiacSigns = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
]

const signCharacteristics: Record<string, string> = {
  Aries: "courageous, passionate, and energetic",
  Taurus: "stable, reliable, and grounded",
  Gemini: "communicative, intellectual, and curious",
  Cancer: "emotional, intuitive, and nurturing",
  Leo: "confident, creative, and generous",
  Virgo: "analytical, practical, and detail-oriented",
  Libra: "balanced, diplomatic, and artistic",
  Scorpio: "intense, transformative, and mysterious",
  Sagittarius: "adventurous, optimistic, and philosophical",
  Capricorn: "disciplined, ambitious, and responsible",
  Aquarius: "innovative, humanitarian, and independent",
  Pisces: "intuitive, artistic, and compassionate",
}

const signElements: Record<string, string> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
}

function buildAstrologicalPrompt(context: AstrologicalContext, userQuestion: string): string {
  return `You are an expert astrological counselor. Provide insightful, personalized astrological guidance based on the user's birth chart and question.

User's Birth Chart:
- Sun Sign: ${context.sunSign} (${signCharacteristics[context.sunSign]})
- Moon Sign: ${context.moonSign} (${signCharacteristics[context.moonSign]})
- Ascendant: ${context.ascendant} (${signCharacteristics[context.ascendant]})

Sun Sign Element: ${signElements[context.sunSign]}
Moon Sign Element: ${signElements[context.moonSign]}
Ascendant Element: ${signElements[context.ascendant]}

User's Question: "${userQuestion}"

Provide a thoughtful, compassionate astrological response that:
1. Acknowledges their question
2. Relates it to their birth chart
3. Offers actionable astrological insights
4. Includes relevant planetary considerations

Keep your response concise (2-3 paragraphs) and conversational.`
}

function buildHoroscopePrompt(sunSign: string): string {
  return `You are an expert astrologer. Generate a personalized daily horoscope for someone with the following sign:

Sun Sign: ${sunSign} (${signCharacteristics[sunSign]})
Element: ${signElements[sunSign]}

Create a brief, uplifting daily horoscope (2-3 sentences) that:
1. Acknowledges the current planetary energy
2. Provides guidance for the day
3. Highlights opportunities or areas to focus on
4. Maintains an optimistic, encouraging tone

Keep it concise and inspiring.`
}

export async function generateAstrologicalResponse(
  context: AstrologicalContext,
  userQuestion: string,
): Promise<string> {
  try {
    const mockResponses = [
      `As a ${context.sunSign} with ${context.moonSign} Moon energy, your question about "${userQuestion}" resonates deeply with your ${context.ascendant} Ascendant. Your ${signElements[context.sunSign]} element brings passionate, grounded energy to this situation. The cosmic energies suggest embracing your natural ${signCharacteristics[context.sunSign]} nature—this will guide you to clarity.`,

      `Your ${context.sunSign} Sun seeks truth, and your ${context.moonSign} Moon feels it intuitively. Regarding "${userQuestion}": Trust the wisdom your ${context.ascendant} Ascendant brings to the surface. With your ${signElements[context.moonSign]} Moon element, you have the emotional intelligence to navigate this beautifully.`,

      `The stars align with your question, dear ${context.sunSign}. Your ${context.moonSign} Moon brings sensitivity, while your ${context.ascendant} Ascendant radiates authentic presence. In this moment of "${userQuestion}", the universe invites you to blend your ${signElements[context.sunSign]} fire with your ${signElements[context.moonSign]} intuition.`,

      `As someone shaped by ${context.sunSign} courage and ${context.moonSign} depth, you're asking exactly what the cosmos intended. Your ${context.ascendant} Ascendant amplifies your ability to see beyond the surface. With your ${signCharacteristics[context.sunSign]} nature, "${userQuestion}" becomes an opportunity for growth.`,
    ]

    const randomIndex = Math.floor(Math.random() * mockResponses.length)
    return mockResponses[randomIndex]
  } catch (error) {
    console.error("[v0] Error generating astrological response:", error)
    const sunSignTraits = signCharacteristics[context.sunSign] || "mysterious"
    return `Based on your ${context.sunSign} Sun sign (${sunSignTraits}), and your ${context.moonSign} Moon sign, I sense your question about "${userQuestion}" requires deeper contemplation. Trust your intuition and let the cosmic energies guide you. Your ${context.ascendant} Ascendant brings a unique perspective to this matter.`
  }
}

export async function generateDailyHoroscope(sunSign: string): Promise<string> {
  try {
    const mockHoroscopes = [
      `Daily Horoscope for ${sunSign}: Today, the cosmos invites you to embrace your ${signCharacteristics[sunSign]} nature. A moment of clarity arrives in the afternoon. Trust your instincts—they're unusually sharp today. The ${signElements[sunSign]} element within you is energized and ready for action.`,

      `For ${sunSign} today: With the current planetary energy, you're naturally aligned with abundance. Your ${signElements[sunSign]} essence shines brightly. Pay attention to synchronicities—the universe is sending you messages. A meaningful conversation brings unexpected insight.`,

      `${sunSign} Daily Insight: Today calls for your unique ${signCharacteristics[sunSign]} approach. The stars support bold moves and authentic expression. You'll feel a surge of creative energy in the evening. Lean into what feels right in your heart.`,

      `Cosmic Message for ${sunSign}: This day brings opportunities wrapped in familiar challenges. Your intuition is your greatest guide. The universe celebrates your ${signCharacteristics[sunSign]} spirit. Something you've been hoping for shows signs of manifesting.`,
    ]

    const randomIndex = Math.floor(Math.random() * mockHoroscopes.length)
    return mockHoroscopes[randomIndex]
  } catch (error) {
    console.error("[v0] Error generating daily horoscope:", error)
    const traits = signCharacteristics[sunSign] || "unique"
    return `Daily Horoscope for ${sunSign} (${traits}): Today brings new opportunities for growth and self-discovery. The stars align to support your endeavors. Pay attention to synchronicities and trust the universe's guidance.`
  }
}

export function getZodiacSign(birthDate: string): string {
  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()

  const signs = [
    { name: "Capricorn", start: [12, 22], end: [1, 19] },
    { name: "Aquarius", start: [1, 20], end: [2, 18] },
    { name: "Pisces", start: [2, 19], end: [3, 20] },
    { name: "Aries", start: [3, 21], end: [4, 19] },
    { name: "Taurus", start: [4, 20], end: [5, 20] },
    { name: "Gemini", start: [5, 21], end: [6, 20] },
    { name: "Cancer", start: [6, 21], end: [7, 22] },
    { name: "Leo", start: [7, 23], end: [8, 22] },
    { name: "Virgo", start: [8, 23], end: [9, 22] },
    { name: "Libra", start: [9, 23], end: [10, 22] },
    { name: "Scorpio", start: [10, 23], end: [11, 21] },
    { name: "Sagittarius", start: [11, 22], end: [12, 21] },
  ]

  for (const sign of signs) {
    const [startMonth, startDay] = sign.start
    const [endMonth, endDay] = sign.end

    if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
      return sign.name
    }
  }

  return "Capricorn"
}
