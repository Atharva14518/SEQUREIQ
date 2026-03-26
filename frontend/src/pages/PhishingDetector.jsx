import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { analyzeConversation, analyzePhishing, getPhishingHistory, getPhishingStats } from "../api/secureiq.js"
import ConversationAnalyzer from "../components/ConversationAnalyzer.jsx"
import PsychDimensions from "../components/PsychDimensions.jsx"
import { useVoiceRecorder } from "../hooks/useVoiceRecorder"
import posthog from "../lib/posthog.js"
import { buildAnalysisProperties } from "../lib/analytics.js"

const MSG_TYPES = ["Email", "WhatsApp", "SMS", "Other"]
const INSTANT_PATTERNS = [
  { pattern: /urgent|immediately|asap|right now|final notice/i, label: "URGENCY TACTICS", color: "#B6A596" },
  { pattern: /otp|one.time.password|verification code/i, label: "OTP REQUEST", color: "#DC9F85" },
  { pattern: /whatsapp|telegram|signal|message me/i, label: "CHANNEL SHIFT ATTEMPT", color: "#DC9F85" },
  { pattern: /cbi|police|cybercrime|arrest|warrant/i, label: "AUTHORITY IMPERSONATION", color: "#DC9F85" },
]

export default function PhishingDetector() {
  const { user } = useUser()
  const [tab, setTab] = useState("single")
  const [msgType, setMsgType] = useState("Email")
  const [senderInfo, setSenderInfo] = useState("")
  const [messageText, setMessageText] = useState("")
  const [conversationText, setConversationText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [instantFlags, setInstantFlags] = useState([])
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [transcribedFromVoice, setTranscribedFromVoice] = useState(false)

  const { isRecording, isTranscribing, error: voiceError, toggleRecording } = useVoiceRecorder({
    mode: "analyze",
    requestPayload: () => ({
      context: "security",
      message_type: msgType.toLowerCase(),
      sender_info: senderInfo || "Unknown",
      clerk_user_id: user?.id || "anon",
    }),
    onTranscript: (text) => {
      setMessageText(text)
      setTranscribedFromVoice(true)
    },
    onAnalysis: (analysis) => {
      setResult(analysis)
      refreshPhishingData()
    },
  })

  useEffect(() => {
    if (user) {
      getPhishingHistory(user.id).then(setHistory).catch(() => {})
      getPhishingStats(user.id).then(setStats).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    const flags = INSTANT_PATTERNS.filter((item) => item.pattern.test(messageText)).map((item) => ({ label: item.label, color: item.color }))
    setInstantFlags(flags)
  }, [messageText])

  useEffect(() => {
    let interval
    if (timerActive) interval = setInterval(() => setTimer((current) => current + 0.1), 100)
    else setTimer(0)
    return () => clearInterval(interval)
  }, [timerActive])

  const refreshPhishingData = () => {
    if (!user?.id) return
    getPhishingHistory(user.id).then(setHistory).catch(() => {})
    getPhishingStats(user.id).then(setStats).catch(() => {})
  }

  const analyzeSingle = async () => {
    if (!messageText.trim()) return
    const clickedProps = buildAnalysisProperties({
      messageText,
      messageType: msgType.toLowerCase(),
    })
    posthog.capture("analyze_clicked", {
      ...clickedProps,
      source: "frontend",
      flow: "phishing_single",
    })
    console.log("[PostHog] analyze_clicked", clickedProps)
    setAnalyzing(true)
    setResult(null)
    setTimerActive(true)
    try {
      const response = await analyzePhishing({
        message_text: messageText,
        message_type: msgType.toLowerCase(),
        sender_info: senderInfo,
        clerk_user_id: user?.id || "anon",
      })
      setResult(response)
      const resultProps = buildAnalysisProperties({
        messageText,
        messageType: msgType.toLowerCase(),
        verdict: response.verdict,
        score: response.risk_score,
      })
      posthog.capture("analysis_result", {
        ...resultProps,
        source: "frontend",
        flow: "phishing_single",
      })
      console.log("[PostHog] analysis_result", resultProps)
      refreshPhishingData()
    } catch {
      setResult({ error: true, verdict: "ERROR", risk_score: 0 })
    } finally {
      setTimerActive(false)
      setAnalyzing(false)
    }
  }

  const analyzeThread = async () => {
    if (!conversationText.trim()) return
    const clickedProps = buildAnalysisProperties({
      messageText: conversationText,
      messageType: msgType.toLowerCase(),
    })
    posthog.capture("analyze_clicked", {
      ...clickedProps,
      source: "frontend",
      flow: "phishing_thread",
    })
    console.log("[PostHog] analyze_clicked", clickedProps)
    setAnalyzing(true)
    setResult(null)
    setTimerActive(true)
    try {
      const response = await analyzeConversation({
        conversation_text: conversationText,
        message_type: msgType.toLowerCase(),
        sender_info: senderInfo,
        clerk_user_id: user?.id || "anon",
      })
      setResult(response)
      const resultProps = buildAnalysisProperties({
        messageText: conversationText,
        messageType: msgType.toLowerCase(),
        verdict: response.verdict,
        score: response.risk_score,
      })
      posthog.capture("analysis_result", {
        ...resultProps,
        source: "frontend",
        flow: "phishing_thread",
      })
      console.log("[PostHog] analysis_result", resultProps)
      refreshPhishingData()
    } catch {
      setResult({ error: true, verdict: "ERROR", risk_score: 0 })
    } finally {
      setTimerActive(false)
      setAnalyzing(false)
    }
  }

  const verdictStyle = (verdict) => {
    if (verdict === "SAFE") return { bg: "rgba(182,165,150,0.10)", border: "#B6A596" }
    if (verdict === "PHISHING") return { bg: "rgba(220,159,133,0.10)", border: "#DC9F85" }
    if (verdict === "SUSPICIOUS") return { bg: "rgba(220,159,133,0.06)", border: "#66473B" }
    return { bg: "rgba(220,159,133,0.20)", border: "#DC9F85" }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#181818" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
          <div>
            <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
              - Phishing Intelligence Engine
            </p>
            <h1 style={{ fontSize: "clamp(34px, 6vw, 66px)", lineHeight: "0.92", marginBottom: "12px", color: "#EBDCC4" }}>
              Local AI Analysis
            </h1>
            <p style={{ color: "#B6A596", lineHeight: "1.7", maxWidth: "640px" }}>
              Strict threat scoring for messages, voice transcripts, and multi-turn scams targeting Indian businesses.
            </p>
          </div>
          <Link
            to="/dashboard"
            style={{
              border: "1px solid #35211A",
              borderRadius: "4px",
              padding: "12px 16px",
              color: "#B6A596",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Back To Dashboard
          </Link>
        </div>

        <div style={{ borderLeft: "2px solid #DC9F85", paddingLeft: "16px", marginBottom: "28px" }}>
          <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            Processing Mode: Local-Only + Whisper
          </p>
          <p style={{ color: "#B6A596", lineHeight: "1.7" }}>
            Text analysis stays local to your backend flow. Voice input is transcribed before phishing analysis and then scored with the same strict rules.
          </p>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid #35211A", borderBottom: "1px solid #35211A", marginBottom: "28px" }} className="phishing-stats-grid">
            {[
              ["Analyzed", stats.total_analyzed],
              ["Threats", stats.threats_detected],
              ["Safe", stats.safe_messages],
            ].map(([label, value], index) => (
              <div key={label} style={{ padding: "24px 16px", borderRight: index < 2 ? "1px solid #35211A" : "none" }}>
                <p style={{ color: "#EBDCC4", fontSize: "clamp(26px, 5vw, 44px)", fontWeight: "700", marginBottom: "6px" }}>{value}</p>
                <p style={{ color: "#66473B", fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: "24px" }} className="phishing-main-grid">
          <div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              {[
                ["single", "Single Message -"],
                ["thread", "Conversation Thread -"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: tab === key ? "#DC9F85" : "#B6A596",
                    fontSize: "11px",
                    fontWeight: "600",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
              {MSG_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setMsgType(type)}
                  style={{
                    background: "transparent",
                    border: "1px solid #35211A",
                    borderRadius: "4px",
                    padding: "10px 12px",
                    color: msgType === type ? "#EBDCC4" : "#B6A596",
                    fontSize: "11px",
                    fontWeight: "600",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="card">
              <label htmlFor="sender_info" style={{ display: "block", marginBottom: "8px" }}>
                From
              </label>
              <input
                id="sender_info"
                className="input-field"
                value={senderInfo}
                onChange={(e) => setSenderInfo(e.target.value)}
                style={{ marginBottom: "20px", borderColor: "#35211A" }}
              />

              {tab === "single" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "12px", flexWrap: "wrap" }}>
                    <p
                      style={{
                        fontFamily: "'General Sans', sans-serif",
                        fontSize: "10px",
                        fontWeight: "600",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#B6A596",
                      }}
                    >
                      Paste Or Dictate Message -
                    </p>
                    <button
                      onClick={toggleRecording}
                      style={{
                        background: isRecording ? "rgba(220,159,133,0.15)" : "transparent",
                        border: `1px solid ${isRecording ? "#DC9F85" : "#35211A"}`,
                        borderRadius: "4px",
                        padding: "6px 12px",
                        color: isRecording ? "#DC9F85" : "#66473B",
                        fontFamily: "'General Sans', sans-serif",
                        fontSize: "10px",
                        fontWeight: "600",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ animation: isRecording ? "blink 1s ease infinite" : "none" }}>{isRecording ? "⏹" : "🎤"}</span>
                      {isTranscribing ? "TRANSCRIBING..." : isRecording ? "STOP" : "VOICE INPUT"}
                    </button>
                  </div>

                  <textarea
                    className="input-field"
                    style={{ minHeight: "240px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", borderColor: "#35211A" }}
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value)
                      setTranscribedFromVoice(false)
                    }}
                  />

                  {transcribedFromVoice && (
                    <p style={{ color: "#DC9F85", fontSize: "11px", marginTop: "10px" }}>Transcribed from voice input.</p>
                  )}

                  {voiceError && (
                    <p style={{ color: "#DC9F85", fontSize: "11px", marginTop: "10px" }}>{voiceError}</p>
                  )}

                  <p style={{ color: "#66473B", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "18px", marginBottom: "10px" }}>
                    Detected Patterns
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {instantFlags.map((flag) => (
                      <span key={flag.label} style={{ border: `1px solid ${flag.color}`, borderRadius: "4px", padding: "6px 8px", color: flag.color, fontSize: "11px", fontWeight: "600", letterSpacing: "0.06em" }}>
                        {flag.label}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={analyzeSingle}
                    disabled={analyzing || !messageText.trim()}
                    style={{
                      width: "100%",
                      marginTop: "24px",
                      background: "#DC9F85",
                      border: "none",
                      borderRadius: "4px",
                      padding: "14px 18px",
                      color: "#181818",
                      fontSize: "12px",
                      fontWeight: "700",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Analyze -
                  </button>
                </>
              ) : (
                <>
                  <label htmlFor="conversation_text" style={{ display: "block", marginBottom: "8px" }}>
                    Conversation Thread
                  </label>
                  <textarea
                    id="conversation_text"
                    className="input-field"
                    placeholder={`Examples:\nCREDIBLE SUPPORT: Your account will be suspended.\nSCAM BOT: Act now and move to WhatsApp.\nHR DEPT: Transfer funds immediately.`}
                    style={{ minHeight: "240px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", borderColor: "#35211A" }}
                    value={conversationText}
                    onChange={(e) => setConversationText(e.target.value)}
                  />
                  <button
                    onClick={analyzeThread}
                    disabled={analyzing || !conversationText.trim()}
                    style={{
                      width: "100%",
                      marginTop: "24px",
                      background: "#DC9F85",
                      border: "none",
                      borderRadius: "4px",
                      padding: "14px 18px",
                      color: "#181818",
                      fontSize: "12px",
                      fontWeight: "700",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    Analyze Thread -
                  </button>
                </>
              )}

              {analyzing && (
                <p style={{ color: "#B6A596", fontSize: "11px", fontWeight: "600", marginTop: "12px" }}>
                  Running analysis - <span style={{ color: "#DC9F85" }}>{timer.toFixed(1)}s</span>
                </p>
              )}
            </div>
          </div>

          <div>
            {!result && (
              <div className="card">
                <p style={{ color: "#B6A596", lineHeight: "1.7" }}>Verdict panel will appear after analysis.</p>
              </div>
            )}

            {result && !result.error && tab === "thread" && <ConversationAnalyzer analysis={result} />}

            {result && !result.error && tab === "single" && (
              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ background: verdictStyle(result.verdict).bg, border: `1px solid ${verdictStyle(result.verdict).border}`, borderRadius: "4px", padding: "18px" }}>
                  <p style={{ color: "#B6A596", fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Verdict Header
                  </p>
                  <p style={{ color: "#EBDCC4", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: "700" }}>
                    {result.risk_score} <span style={{ color: "#B6A596", fontSize: "12px" }}>/ 100</span>
                  </p>
                  <p style={{ color: "#DC9F85", fontSize: "22px", fontWeight: "700", marginTop: "6px" }}>{result.verdict}</p>
                </div>

                <div className="card">
                  <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
                    - Soft-Power Analysis
                  </p>
                  {(result.manipulation_techniques || []).slice(0, 3).map((technique, index) => (
                    <div key={`${technique.technique}-${index}`} style={{ marginBottom: "16px" }}>
                      <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
                        {String(index + 1).padStart(2, "0")} - {technique.technique}
                      </p>
                      {technique.evidence && (
                        <code
                          style={{
                            display: "block",
                            marginTop: "6px",
                            marginBottom: "8px",
                            background: "#0D0D0D",
                            border: "1px solid #35211A",
                            padding: "10px",
                            color: "#DC9F85",
                            borderRadius: "4px",
                          }}
                        >
                          {technique.evidence}
                        </code>
                      )}
                      <p style={{ color: "#B6A596", lineHeight: "1.7" }}>{technique.explanation}</p>
                    </div>
                  ))}

                  {result.india_specific_scam && (
                    <p style={{ color: "#EBDCC4", background: "rgba(220,159,133,0.2)", border: "1px solid #DC9F85", borderRadius: "4px", padding: "10px 12px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Known Pattern: {result.india_specific_scam}
                    </p>
                  )}
                </div>

                <PsychDimensions dimensions={result.psychological_dimensions} />

                <button
                  style={{
                    width: "100%",
                    background: result.recommended_action === "REPORT_TO_CYBERCRIME" ? "transparent" : "#DC9F85",
                    border: `1px solid ${result.recommended_action === "REPORT_TO_CYBERCRIME" ? "#DC9F85" : "#DC9F85"}`,
                    borderRadius: "4px",
                    padding: "14px 18px",
                    color: result.recommended_action === "REPORT_TO_CYBERCRIME" ? "#DC9F85" : "#181818",
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {result.recommended_action === "REPORT_TO_CYBERCRIME" ? "Report This Threat -" : "Safe Response -"}
                </button>
              </div>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: "32px" }}>
            <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
              - Analysis History
            </p>
            <div style={{ display: "grid", gap: "0" }}>
              {history.map((item) => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 3fr 1fr", gap: "12px", padding: "14px 0", borderBottom: "1px solid #35211A" }} className="history-grid-row">
                  <p style={{ color: "#EBDCC4", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>{item.verdict}</p>
                  <p style={{ color: "#B6A596", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>{item.message_type}</p>
                  <p style={{ color: "#B6A596", lineHeight: "1.6" }}>{item.message_preview}</p>
                  <p style={{ color: "#66473B", fontSize: "11px", textAlign: "right" }}>{new Date(item.analyzed_at).toLocaleDateString("en-IN")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (max-width: 900px) {
          .phishing-main-grid,
          .phishing-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .history-grid-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
