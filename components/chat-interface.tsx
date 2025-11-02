"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send } from "lucide-react"

interface Message {
  id: string
  userMessage: string
  assistantResponse: string
  timestamp: string
}

export function ChatInterface() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneSubmitted, setPhoneSubmitted] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Registration form state
  const [registrationData, setRegistrationData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthLocation: "",
  })
  const [registering, setRegistering] = useState(false)

  // Load phone number from localStorage on mount
  useEffect(() => {
    const storedPhone = localStorage.getItem("astroguide_phone")
    if (storedPhone) {
      setPhoneNumber(storedPhone)
      setPhoneSubmitted(true)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phoneNumber.trim()) {
      // Store phone number in localStorage
      localStorage.setItem("astroguide_phone", phoneNumber.trim())
      setPhoneSubmitted(true)
    }
  }

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistering(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          name: registrationData.name.trim(),
          birthDate: registrationData.birthDate,
          birthTime: registrationData.birthTime,
          birthLocation: registrationData.birthLocation.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Registration successful - hide registration form
        setShowRegistration(false)
        setMessages([
          ...messages,
          {
            id: `registration-${Date.now()}`,
            userMessage: "",
            assistantResponse: `Welcome ${data.user.name}! Your account has been created. Your zodiac sign is ${data.user.zodiacSign}. How can I help you today?`,
            timestamp: new Date().toISOString(),
          },
        ])
        // Clear registration form
        setRegistrationData({
          name: "",
          birthDate: "",
          birthTime: "",
          birthLocation: "",
        })
      } else {
        setMessages([
          ...messages,
          {
            id: `error-${Date.now()}`,
            userMessage: "",
            assistantResponse: data.error || "Registration failed. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error("[v0] Registration error:", error)
      setMessages([
        ...messages,
        {
          id: `error-${Date.now()}`,
          userMessage: "",
          assistantResponse: "Sorry, there was an error during registration. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setRegistering(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !phoneNumber.trim()) return

    setLoading(true)
    const userMessage = input
    setInput("")

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          phoneNumber: phoneNumber.trim(),
          source: "web",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages([
          ...messages,
          {
            id: data.conversation.id,
            userMessage: userMessage,
            assistantResponse: data.response,
            timestamp: new Date().toISOString(),
          },
        ])
      } else if (data.needsRegistration) {
        // User not found - show registration form
        setShowRegistration(true)
        setMessages([
          ...messages,
          {
            id: `info-${Date.now()}`,
            userMessage: userMessage,
            assistantResponse: "Welcome! To get personalized astrological guidance, please complete your registration below.",
            timestamp: new Date().toISOString(),
          },
        ])
      } else {
        // Handle error response
        setMessages([
          ...messages,
          {
            id: `error-${Date.now()}`,
            userMessage: userMessage,
            assistantResponse: data.error || "Sorry, I couldn't process your message. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setMessages([
        ...messages,
        {
          id: `error-${Date.now()}`,
          userMessage: userMessage,
          assistantResponse: "Sorry, there was an error processing your message. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Phone number input screen
  if (!phoneSubmitted) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">AstroGuide</h1>
            <p className="text-purple-100 text-sm mt-1">Cosmic wisdom at your fingertips</p>
          </div>
        </div>

        {/* Phone Number Input */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl">✨</div>
              <h2 className="text-2xl font-bold text-gray-700">Welcome to AstroGuide</h2>
              <p className="text-gray-600">
                To get started, please enter your phone number. This helps us identify you and provide personalized
                astrological guidance.
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Format: Include country code (e.g., +1234567890 or +919876543210)
                </p>
              </div>
              <Button
                type="submit"
                disabled={!phoneNumber.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                Continue
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AstroGuide</h1>
            <p className="text-purple-100 text-sm mt-1">Cosmic wisdom at your fingertips</p>
          </div>
          <div className="text-sm text-purple-200">
            {phoneNumber}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-4">
                <div className="text-6xl">✨</div>
                <h2 className="text-2xl font-bold text-gray-700">Welcome to AstroGuide</h2>
                <p className="text-gray-500 max-w-sm">
                  Ask me anything about your cosmic journey, receive personalized astrological guidance, or get your
                  daily horoscope.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg rounded-tr-none p-4 max-w-sm shadow-md">
                  <p className="text-sm">{message.userMessage}</p>
                </div>
              </div>

              {/* Assistant Response */}
              <div className="flex justify-start">
                <div className="bg-white border border-purple-200 rounded-lg rounded-tl-none p-4 max-w-sm shadow-md">
                  <p className="text-gray-800 text-sm leading-relaxed">{message.assistantResponse}</p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-purple-200 rounded-lg rounded-tl-none p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">Consulting the stars...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Registration Form */}
      {showRegistration && (
        <div className="bg-purple-50 border-t border-purple-200 p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Complete Your Registration</h3>
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={registrationData.name}
                    onChange={(e) =>
                      setRegistrationData({ ...registrationData, name: e.target.value })
                    }
                    required
                    disabled={registering}
                    className="w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date *
                  </label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={registrationData.birthDate}
                    onChange={(e) =>
                      setRegistrationData({ ...registrationData, birthDate: e.target.value })
                    }
                    required
                    disabled={registering}
                    className="w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="birthTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Time *
                  </label>
                  <Input
                    id="birthTime"
                    type="time"
                    value={registrationData.birthTime}
                    onChange={(e) =>
                      setRegistrationData({ ...registrationData, birthTime: e.target.value })
                    }
                    required
                    disabled={registering}
                    className="w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label htmlFor="birthLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Location *
                  </label>
                  <Input
                    id="birthLocation"
                    type="text"
                    placeholder="City, Country"
                    value={registrationData.birthLocation}
                    onChange={(e) =>
                      setRegistrationData({ ...registrationData, birthLocation: e.target.value })
                    }
                    required
                    disabled={registering}
                    className="w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={registering || !registrationData.name || !registrationData.birthDate || !registrationData.birthTime || !registrationData.birthLocation}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  {registering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegistration(false)}
                  disabled={registering}
                  className="border-purple-200"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-purple-200 p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
          <Input
            type="text"
            placeholder="Ask the cosmos..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || showRegistration}
            className="flex-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim() || showRegistration}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
