export interface User {
  id: string
  whatsappNumber: string
  name: string
  birthDate: string
  birthTime: string
  birthLocation: string
  zodiacSign: string
  createdAt: string
  updatedAt: string
}

export interface NatalChart {
  id: string
  userId: string
  sunSign: string
  moonSign: string
  ascendant: string
  chartData: Record<string, unknown>
  createdAt: string
}

export interface Conversation {
  id: string
  userId: string
  userMessage: string
  assistantResponse: string
  messageType: "question" | "horoscope" | "guidance"
  messageSource: "web" | "whatsapp"
  createdAt: string
}

export interface ScheduledMessage {
  id: string
  userId: string
  messageContent: string
  scheduledTime: string
  sent: boolean
  sentAt: string | null
  createdAt: string
}

export interface WhatsAppMessage {
  from: string
  to: string
  body: string
  messageId: string
}
