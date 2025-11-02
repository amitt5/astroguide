import type { User, NatalChart, Conversation, ScheduledMessage } from "./types"
import { supabase } from "./supabase"

/**
 * @deprecated This function is deprecated and will be removed.
 * Use getUserByWhatsApp() or getUser() instead.
 * This is a temporary stub for backward compatibility during migration.
 * TODO: Update API routes to use proper user identification.
 */
export function getHardcodedUser(): User {
  throw new Error(
    "getHardcodedUser() is deprecated. Use getUserByWhatsApp() or getUser() instead. This will be fixed in the next step when we implement user identification."
  )
}

// Helper function to map database row to User type
function mapRowToUser(row: any): User {
  return {
    id: row.id,
    whatsappNumber: row.whatsapp_number,
    name: row.name,
    birthDate: row.birth_date,
    birthTime: row.birth_time,
    birthLocation: row.birth_location,
    zodiacSign: row.zodiac_sign,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Helper function to map database row to NatalChart type
function mapRowToNatalChart(row: any): NatalChart {
  return {
    id: row.id,
    userId: row.user_id,
    sunSign: row.sun_sign,
    moonSign: row.moon_sign,
    ascendant: row.ascendant,
    chartData: row.chart_data || {},
    createdAt: row.created_at,
  }
}

// Helper function to map database row to Conversation type
function mapRowToConversation(row: any): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    userMessage: row.user_message,
    assistantResponse: row.assistant_response,
    messageType: row.message_type,
    messageSource: row.message_source,
    createdAt: row.created_at,
  }
}

// Helper function to map database row to ScheduledMessage type
function mapRowToScheduledMessage(row: any): ScheduledMessage {
  return {
    id: row.id,
    userId: row.user_id,
    messageContent: row.message_content,
    scheduledTime: row.scheduled_time,
    sent: row.sent,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }
}

// Database operations using Supabase
export const db = {
  // Users
  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const { data: row, error } = await supabase
      .from("users")
      .insert({
        whatsapp_number: data.whatsappNumber,
        name: data.name,
        birth_date: data.birthDate,
        birth_time: data.birthTime,
        birth_location: data.birthLocation,
        zodiac_sign: data.zodiacSign,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    return mapRowToUser(row)
  },

  async getUserByWhatsApp(whatsappNumber: string): Promise<User | null> {
    const { data: row, error } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_number", whatsappNumber)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get user: ${error.message}`)
    }

    return mapRowToUser(row)
  },

  async getUser(id: string): Promise<User | null> {
    const { data: row, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get user: ${error.message}`)
    }

    return mapRowToUser(row)
  },

  async getAllUsers(): Promise<User[]> {
    const { data: rows, error } = await supabase.from("users").select("*")

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`)
    }

    return rows.map(mapRowToUser)
  },

  // Natal Charts
  async createNatalChart(data: Omit<NatalChart, "id" | "createdAt">): Promise<NatalChart> {
    const { data: row, error } = await supabase
      .from("natal_charts")
      .insert({
        user_id: data.userId,
        sun_sign: data.sunSign,
        moon_sign: data.moonSign,
        ascendant: data.ascendant,
        chart_data: data.chartData,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create natal chart: ${error.message}`)
    }

    return mapRowToNatalChart(row)
  },

  async getNatalChartByUser(userId: string): Promise<NatalChart | null> {
    const { data: row, error } = await supabase
      .from("natal_charts")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get natal chart: ${error.message}`)
    }

    return mapRowToNatalChart(row)
  },

  // Conversations
  async createConversation(data: Omit<Conversation, "id" | "createdAt">): Promise<Conversation> {
    const { data: row, error } = await supabase
      .from("conversations")
      .insert({
        user_id: data.userId,
        user_message: data.userMessage,
        assistant_response: data.assistantResponse,
        message_type: data.messageType,
        message_source: data.messageSource,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    return mapRowToConversation(row)
  },

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    const { data: rows, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to get conversations: ${error.message}`)
    }

    return rows.map(mapRowToConversation)
  },

  async getAllConversations(): Promise<Conversation[]> {
    const { data: rows, error } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to get conversations: ${error.message}`)
    }

    return rows.map(mapRowToConversation)
  },

  // Scheduled Messages
  async createScheduledMessage(
    data: Omit<ScheduledMessage, "id" | "createdAt" | "sentAt">,
  ): Promise<ScheduledMessage> {
    const { data: row, error } = await supabase
      .from("scheduled_messages")
      .insert({
        user_id: data.userId,
        message_content: data.messageContent,
        scheduled_time: data.scheduledTime,
        sent: data.sent,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create scheduled message: ${error.message}`)
    }

    return mapRowToScheduledMessage(row)
  },

  async getScheduledMessages(): Promise<ScheduledMessage[]> {
    const { data: rows, error } = await supabase
      .from("scheduled_messages")
      .select("*")
      .order("scheduled_time", { ascending: true })

    if (error) {
      throw new Error(`Failed to get scheduled messages: ${error.message}`)
    }

    return rows.map(mapRowToScheduledMessage)
  },

  async markMessageAsSent(id: string): Promise<void> {
    const { error } = await supabase
      .from("scheduled_messages")
      .update({
        sent: true,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      throw new Error(`Failed to mark message as sent: ${error.message}`)
    }
  },

  async getScheduledMessagesByUser(userId: string): Promise<ScheduledMessage[]> {
    const { data: rows, error } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_time", { ascending: true })

    if (error) {
      throw new Error(`Failed to get scheduled messages: ${error.message}`)
    }

    return rows.map(mapRowToScheduledMessage)
  },
}
