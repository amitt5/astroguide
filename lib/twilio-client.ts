interface TwilioConfig {
  accountSid: string
  authToken: string
  whatsappNumber: string
}

let twilioConfig: TwilioConfig | null = null

export function initializeTwilio(config: TwilioConfig) {
  twilioConfig = config
}

function getTwilioConfig(): TwilioConfig | null {
  // If not initialized, try to initialize from environment variables
  if (!twilioConfig) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    if (accountSid && authToken && whatsappNumber) {
      twilioConfig = {
        accountSid,
        authToken,
        whatsappNumber,
      }
      console.log("[Twilio] Initialized from environment variables")
    }
  }
  return twilioConfig
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<string> {
  const config = getTwilioConfig()
  
  if (!config) {
    console.warn("[Twilio] Twilio not initialized. Message would be sent to:", to, body)
    // For MVP without Twilio, just log the message
    return `mock-sid-${Date.now()}`
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`

    const formData = new URLSearchParams()
    formData.append("From", config.whatsappNumber)
    formData.append("To", `whatsapp:${to}`)
    formData.append("Body", body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString(
          "base64",
        )}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`)
    }

    const data = (await response.json()) as { sid: string }
    return data.sid
  } catch (error) {
    console.error("[v0] Error sending WhatsApp message:", error)
    throw error
  }
}
