export function containsLink(text = "") {
  return /(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i.test(text)
}

export function containsUrgency(text = "") {
  return /\b(urgent|immediately|right now|asap|final notice|act now|last chance|deadline|within \d+ hours?)\b/i.test(text)
}

export function containsRiskyPatterns(text = "") {
  return /\b(otp|password|bank account|verify account|kyc|arrest|legal action|cbi|rbi|transfer money|upi|click here)\b/i.test(text)
}

export function buildAnalysisProperties({
  messageText = "",
  messageType = "unknown",
  verdict = "UNKNOWN",
  score = 0,
}) {
  const contains_link = containsLink(messageText)
  const contains_urgency = containsUrgency(messageText)
  const possible_false_negative = verdict === "SAFE" && containsRiskyPatterns(messageText)

  return {
    message_length: messageText.length,
    type: messageType,
    contains_link,
    contains_urgency,
    possible_false_negative,
    verdict,
    score,
  }
}
