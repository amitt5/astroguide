interface TwilioConfig {
  accountSid: string
  authToken: string
  whatsappNumber: string
}

let twilioConfig: TwilioConfig | null = null

export function initializeTwilio(config: TwilioConfig) {
  twilioConfig = config
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<string> {
  if (!twilioConfig) {
    console.warn("[v0] Twilio not initialized. Message would be sent to:", to, body)
    // For MVP without Twilio, just log the message
    return `mock-sid-${Date.now()}`
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Messages.json`

    const formData = new URLSearchParams()
    formData.append("From", `whatsapp:${twilioConfig.whatsappNumber}`)
    formData.append("To", `whatsapp:${to}`)
    formData.append("Body", body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString(
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
