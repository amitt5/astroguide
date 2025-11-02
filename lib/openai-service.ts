import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type UserIntent =
  | "horoscope"
  | "investment_advice"
  | "relationship"
  | "career"
  | "health"
  | "general_guidance"
  | "unknown"

export interface IntentClassification {
  intent: UserIntent
  confidence: number
  requiresClarification?: boolean
  clarificationQuestion?: string
}

export interface AstrologicalContext {
  sunSign: string
  moonSign: string
  ascendant: string
  birthDate?: string
  birthTime?: string
  birthLocation?: string
}

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

/**
 * Classifies user intent from their message
 */
export async function processUserIntent(
  userMessage: string,
): Promise<IntentClassification> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an intent classification system for an astrology app. Analyze user messages and classify them into one of these categories:

- horoscope: Asking about daily/weekly/monthly horoscope, what will happen today/tomorrow, general predictions
- investment_advice: Questions about money, investments, financial decisions, business ventures, crypto, stocks
- relationship: Questions about love, romance, partnerships, compatibility, dating, marriage
- career: Questions about job, career, work, professional decisions, career changes
- health: Questions about physical or mental health, wellness, medical concerns
- general_guidance: General life questions, decision-making, spiritual guidance, personal growth
- unknown: Cannot determine clear intent

Respond with ONLY a JSON object in this exact format:
{
  "intent": "one_of_the_categories_above",
  "confidence": 0.0_to_1.0,
  "requiresClarification": true_or_false,
  "clarificationQuestion": "question_if_needs_clarification_or_null"
}

Keep confidence scores realistic. If intent is unclear, set requiresClarification to true and provide a helpful question.`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    const classification = JSON.parse(content) as IntentClassification

    // Validate intent
    const validIntents: UserIntent[] = [
      "horoscope",
      "investment_advice",
      "relationship",
      "career",
      "health",
      "general_guidance",
      "unknown",
    ]
    if (!validIntents.includes(classification.intent)) {
      classification.intent = "unknown"
    }

    return classification
  } catch (error) {
    console.error("[OpenAI] Error classifying intent:", error)
    // Fallback to unknown intent
    return {
      intent: "unknown",
      confidence: 0,
      requiresClarification: false,
    }
  }
}

/**
 * Generates an astrological response using OpenAI
 */
export async function generateAstrologicalResponse(
  context: AstrologicalContext,
  userQuestion: string,
  intent?: UserIntent,
): Promise<string> {
  try {
    const intentContext = intent
      ? `Intent: ${intent.replace("_", " ")}`
      : "Intent: General guidance"

    const prompt = `You are an expert astrological counselor with deep knowledge of natal charts, planetary transits, and astrological wisdom. Provide insightful, personalized astrological guidance based on the user's birth chart and question.

User's Birth Chart:
- Sun Sign: ${context.sunSign} (${signCharacteristics[context.sunSign] || "mysterious"})
- Moon Sign: ${context.moonSign} (${context.moonSign !== "Unknown" ? signCharacteristics[context.moonSign] || "mysterious" : "not yet calculated"})
- Ascendant: ${context.ascendant} (${context.ascendant !== "Unknown" ? signCharacteristics[context.ascendant] || "mysterious" : "not yet calculated"})

Sun Sign Element: ${signElements[context.sunSign] || "Unknown"}
${context.moonSign !== "Unknown" ? `Moon Sign Element: ${signElements[context.moonSign] || "Unknown"}` : ""}
${context.ascendant !== "Unknown" ? `Ascendant Element: ${signElements[context.ascendant] || "Unknown"}` : ""}

${context.birthDate ? `Birth Date: ${context.birthDate}` : ""}
${context.birthTime ? `Birth Time: ${context.birthTime}` : ""}
${context.birthLocation ? `Birth Location: ${context.birthLocation}` : ""}

User's Question: "${userQuestion}"
${intentContext}

Provide a thoughtful, compassionate astrological response that:
1. Acknowledges their question with empathy
2. Relates it to their birth chart and astrological influences
3. Offers actionable insights and guidance
4. Includes relevant planetary or astrological considerations when appropriate
5. Maintains a supportive, encouraging tone

Keep your response concise (2-4 paragraphs), conversational, and authentic. Sound like a wise, experienced astrologer who genuinely cares about helping the user. Avoid generic statements - be specific to their chart and question.`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert astrological counselor. Provide insightful, personalized, and compassionate astrological guidance.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    return content.trim()
  } catch (error) {
    console.error("[OpenAI] Error generating astrological response:", error)
    // Fallback response
    const sunSignTraits = signCharacteristics[context.sunSign] || "mysterious"
    return `Based on your ${context.sunSign} Sun sign (${sunSignTraits}), I sense your question about "${userQuestion}" requires deeper contemplation. Your ${context.moonSign !== "Unknown" ? `${context.moonSign} Moon` : "intuitive nature"} brings emotional depth to this matter. Trust your inner wisdom and let the cosmic energies guide you. Your ${context.ascendant !== "Unknown" ? `${context.ascendant} Ascendant` : "authentic self"} brings a unique perspective to this situation.`
  }
}

/**
 * Generates daily horoscope using OpenAI
 */
export async function generateDailyHoroscope(
  sunSign: string,
  date?: string,
): Promise<string> {
  try {
    const dateContext = date ? `Date: ${date}` : "Today"

    const prompt = `You are an expert astrologer. Generate a personalized daily horoscope for someone with the following sign:

Sun Sign: ${sunSign} (${signCharacteristics[sunSign] || "mysterious"})
Element: ${signElements[sunSign] || "Unknown"}
${dateContext}

Create a brief, uplifting daily horoscope (2-3 sentences) that:
1. Acknowledges the current planetary energy
2. Provides guidance for the day
3. Highlights opportunities or areas to focus on
4. Maintains an optimistic, encouraging tone

Keep it concise, inspiring, and personalized to the ${sunSign} sign's nature.`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert astrologer specializing in daily horoscopes. Provide uplifting, personalized guidance.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    return content.trim()
  } catch (error) {
    console.error("[OpenAI] Error generating daily horoscope:", error)
    const traits = signCharacteristics[sunSign] || "unique"
    return `Daily Horoscope for ${sunSign} (${traits}): Today brings new opportunities for growth and self-discovery. The stars align to support your endeavors. Pay attention to synchronicities and trust the universe's guidance.`
  }
}

