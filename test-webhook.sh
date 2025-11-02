#!/bin/bash

# Replace with your actual Vercel URL
WEBHOOK_URL="https://your-app.vercel.app/api/whatsapp/webhook"

# Test GET endpoint (should return active message)
echo "Testing GET endpoint..."
curl -X GET "$WEBHOOK_URL"
echo -e "\n\n"

# Test POST with mock Twilio webhook data
echo "Testing POST endpoint with mock data..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+1234567890" \
  -d "Body=Hi" \
  -d "MessageSid=test123"
echo -e "\n"
