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
 * Generates a conversational, personalized astrological response using OpenAI
 */
export async function generateAstrologicalResponse(
  context: AstrologicalContext,
  userQuestion: string,
  intent?: UserIntent,
  userName?: string, // Added parameter for user's name
  previousInteractions?: number, // Added parameter to track relationship history
): Promise<string> {
  try {
    const intentContext = intent
      ? `Intent: ${intent.replace("_", " ")}`
      : "Intent: General guidance"
    
    // Simplify available chart info for easier reference
    const chartInfo = {
      sun: context.sunSign ? `${context.sunSign} (${signElements[context.sunSign] || "Unknown"} element)` : "Unknown",
      moon: context.moonSign !== "Unknown" ? `${context.moonSign} (${signElements[context.moonSign] || "Unknown"} element)` : "Unknown",
      ascendant: context.ascendant !== "Unknown" ? `${context.ascendant} (${signElements[context.ascendant] || "Unknown"} element)` : "Unknown",
    }
    
    // Identify current astrological timing
    const currentDate = new Date()
    const month = currentDate.getMonth() + 1
    const day = currentDate.getDate()
    
    // Simplified astrological timing reference
    let currentTiming = "We're currently in "
    // Simple season calculation
    if ((month === 3 && day >= 20) || (month > 3 && month < 6) || (month === 6 && day < 21)) {
      currentTiming += "spring, a time of new beginnings and growth."
    } else if ((month === 6 && day >= 21) || (month > 6 && month < 9) || (month === 9 && day < 22)) {
      currentTiming += "summer, a time of action and expression."
    } else if ((month === 9 && day >= 22) || (month > 9 && month < 12) || (month === 12 && day < 21)) {
      currentTiming += "autumn, a time of reflection and balance."
    } else {
      currentTiming += "winter, a time of introspection and planning."
    }

    const prompt = `You're a friendly, experienced astrologer chatting with ${userName || "someone"} on WhatsApp. This is ${previousInteractions && previousInteractions > 3 ? "someone you've been working with for a while" : "a newer connection"}. Keep things conversational and authentic.

IMPORTANT: Your goal is to sound like a real person texting, not a formal astrology textbook or AI. Use contractions, casual language, and a warm, personal tone throughout.

THEIR CHART BASICS:
Sun: ${chartInfo.sun}
Moon: ${chartInfo.moon} 
Rising: ${chartInfo.ascendant}
${context.birthDate ? `Born: ${context.birthDate}` : ""}
${context.birthLocation ? `Location: ${context.birthLocation}` : ""}

THEIR QUESTION: "${userQuestion}"
${intentContext}

CURRENT TIMING: ${currentTiming}

HOW TO RESPOND:
1. Start with a casual, personal greeting using their name if available
2. Keep your total response BRIEF (1-2 short paragraphs max) - this is WhatsApp!
3. Make ONE specific observation about their chart that relates to their question
4. Offer ONE practical insight or suggestion they can actually use
5. Add a touch of your personality (a light joke, personal anecdote, or question for them)
6. Use natural language patterns with contractions (I'm, you're, doesn't, etc.)

DON'Ts:
- Don't use "Dear Seeker" or any formal salutations
- Don't overload with astrological jargon - limit to 1-2 key astrological terms maximum
- Don't give a generic response that could apply to anyone
- Don't end with spiritual platitudes or formal sign-offs
- Don't write more than 150 words total

TONE GUIDE:
- Sound like a knowledgeable friend texting, not delivering a sermon
- Be conversational, warm, and occasionally use emojis if appropriate
- Vary sentence length and structure for natural rhythm
- Show your personality and humanity

Remember: People want quick, accessible insights they can apply to their lives. Make them feel understood, not lectured.`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You're a personable astrologer having a casual WhatsApp conversation. You're knowledgeable but talk like a real person - warm, concise, and authentic.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.85, // Slightly higher for more natural variation
      max_tokens: 250, // Reduced to enforce brevity
      presence_penalty: 0.6, // Encourages more novel language
      frequency_penalty: 0.5, // Discourages repetitive patterns
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    return content.trim()
  } catch (error) {
    console.error("[OpenAI] Error generating astrological response:", error)
    // Improved fallback response - more conversational
    return `Hey there! Looking at your ${context.sunSign} energy, I can see why you're asking about "${userQuestion.substring(0, 30)}...". Trust your gut on this one - your ${context.moonSign !== "Unknown" ? context.moonSign : "emotional"} side already knows what to do. Let me know if you want to dig deeper into this!`
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

