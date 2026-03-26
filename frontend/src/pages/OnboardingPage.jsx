import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { initUserProfile, saveOnboardingData, completeOnboarding } from "../api/secureiq.js"

const WEBSITE_TYPES = [
  { id: "ecommerce", emoji: "🛒", name: "E-Commerce", desc: "Stores and checkout flows" },
  { id: "saas", emoji: "💻", name: "SaaS / App", desc: "Logins, APIs, subscriptions" },
  { id: "restaurant", emoji: "🍽", name: "Restaurant", desc: "Menus, orders, bookings" },
  { id: "healthcare", emoji: "🏥", name: "Healthcare", desc: "Sensitive customer data" },
  { id: "education", emoji: "🎓", name: "Education", desc: "Student and staff portals" },
  { id: "fintech", emoji: "💳", name: "Fintech", desc: "Payments and account flows" },
]

const VISITOR_OPTIONS = [
  { id: "under_1k", label: "<1K / Month" },
  { id: "1k_10k", label: "1K-10K" },
  { id: "10k_100k", label: "10K-100K" },
  { id: "100k_plus", label: "100K+" },
]

const TEAM_OPTIONS = [
  { id: "solo", label: "Just Me" },
  { id: "2_5", label: "2-5" },
  { id: "6_20", label: "6-20" },
  { id: "20_plus", label: "20+" },
]

const TECH_LEVELS = [
  { id: "non_tech", label: "Not Technical" },
  { id: "basic", label: "Basic" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
]

const CONCERNS = ["Data Theft", "Ransomware", "Phishing", "Account Takeover", "Compliance", "Reputation Damage"]
const HOSTING_OPTIONS = ["Cloudflare", "AWS", "GoDaddy", "Hostinger", "BigRock", "SiteGround", "Vercel", "Netlify", "DigitalOcean", "Other / Not Sure"]

export default function OnboardingPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [answers, setAnswers] = useState({
    website_type: "",
    monthly_visitors: "",
    team_size: "",
    tech_comfort_level: "",
    biggest_concern: "",
    hosting_provider: "",
    business_name: "",
    website_url: "",
  })

  const update = (key, value) => setAnswers((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (user) {
      initUserProfile(user.id, user.primaryEmailAddress?.emailAddress, user.fullName).catch(() => {})
    }
  }, [user])

  const canProceed = () => {
    if (step === 1) return Boolean(answers.website_type)
    if (step === 2) return Boolean(answers.monthly_visitors && answers.team_size && answers.tech_comfort_level)
    if (step === 3) return Boolean(answers.hosting_provider)
    return true
  }

  const handleNext = async () => {
    if (!canProceed() || loading) return

    if (step < 4) {
      await saveOnboardingData({ clerk_user_id: user?.id, ...answers }).catch(() => {})
      setStep((current) => current + 1)
      return
    }

    setLoading(true)
    await saveOnboardingData({ clerk_user_id: user?.id, ...answers }).catch(() => {})
    await completeOnboarding(user?.id).catch(() => {})
    setLoading(false)
    setDone(true)
    setTimeout(() => navigate("/dashboard"), 1200)
  }

  const renderChoiceButton = (selected, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1px solid ${selected ? "#DC9F85" : "#35211A"}`,
        borderRadius: "4px",
        padding: "12px 16px",
        color: selected ? "#EBDCC4" : "#B6A596",
        fontFamily: "'General Sans', sans-serif",
        fontSize: "12px",
        fontWeight: "600",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ background: "#181818", minHeight: "100vh" }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "#181818",
          borderBottom: "1px solid #35211A",
        }}
      >
        <div
          style={{
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
          }}
        >
          <p
            style={{
              fontFamily: "'Clash Grotesk', sans-serif",
              fontSize: "18px",
              fontWeight: "700",
              color: "#EBDCC4",
              letterSpacing: "-0.02em",
            }}
          >
            SecureIQ
          </p>
          <p
            style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: "11px",
              fontWeight: "600",
              color: "#B6A596",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Step {step} of 4
          </p>
        </div>
        <div style={{ height: "2px", background: "#35211A" }}>
          <div style={{ height: "2px", width: `${(step / 4) * 100}%`, background: "#DC9F85", transition: "width 200ms ease" }} />
        </div>
      </div>

      <div
        style={{
          paddingTop: "80px",
          paddingBottom: "100px",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "80px 32px 120px",
        }}
      >
        {done ? (
          <div style={{ paddingTop: "80px", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 54px)", marginBottom: "16px", color: "#EBDCC4" }}>Setup Complete</h2>
            <p style={{ color: "#B6A596", fontSize: "16px" }}>Redirecting to your dashboard...</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div>
                <p
                  style={{
                    fontFamily: "'General Sans', sans-serif",
                    fontSize: "11px",
                    fontWeight: "600",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#DC9F85",
                    marginBottom: "16px",
                  }}
                >
                  - Business Setup
                </p>
                <h1 style={{ fontSize: "clamp(34px, 6vw, 62px)", lineHeight: "0.92", marginBottom: "12px", color: "#EBDCC4" }}>
                  Select Business Type
                </h1>
                <p style={{ color: "#B6A596", lineHeight: 1.7, maxWidth: "620px" }}>
                  Choose the closest fit so SecureIQ can tailor your financial risk and attack-path explanations.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginTop: "32px",
                  }}
                  className="onboarding-type-grid"
                >
                  {WEBSITE_TYPES.map((type) => {
                    const selectedType = answers.website_type
                    return (
                      <div
                        key={type.id}
                        onClick={() => update("website_type", type.id)}
                        style={{
                          background: "#1E1E1E",
                          border: selectedType === type.id ? "1px solid #DC9F85" : "1px solid #35211A",
                          borderRadius: "4px",
                          padding: "20px 16px",
                          cursor: "pointer",
                          minHeight: "100px",
                          overflow: "hidden",
                          transition: "border-color 150ms",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'General Sans', sans-serif",
                            fontSize: "20px",
                            marginBottom: "8px",
                            color: "#EBDCC4",
                          }}
                        >
                          {type.emoji}
                        </p>
                        <p
                          style={{
                            fontFamily: "'General Sans', sans-serif",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: selectedType === type.id ? "#EBDCC4" : "#B6A596",
                            marginBottom: "4px",
                            lineHeight: "1.3",
                          }}
                        >
                          {type.name}
                        </p>
                        <p
                          style={{
                            fontFamily: "'General Sans', sans-serif",
                            fontSize: "11px",
                            fontWeight: "300",
                            color: "#66473B",
                            lineHeight: "1.4",
                          }}
                        >
                          {type.desc}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
                  - Business Scale
                </p>
                <h1 style={{ fontSize: "clamp(34px, 6vw, 62px)", lineHeight: "0.92", marginBottom: "24px", color: "#EBDCC4" }}>
                  Operational Context
                </h1>

                <div style={{ display: "grid", gap: "28px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "10px" }}>Monthly Visitors</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {VISITOR_OPTIONS.map((option) => renderChoiceButton(answers.monthly_visitors === option.id, () => update("monthly_visitors", option.id), option.label))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "10px" }}>Team Size</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {TEAM_OPTIONS.map((option) => renderChoiceButton(answers.team_size === option.id, () => update("team_size", option.id), option.label))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "10px" }}>Technical Comfort</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {TECH_LEVELS.map((option) => renderChoiceButton(answers.tech_comfort_level === option.id, () => update("tech_comfort_level", option.id), option.label))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
                  - Security Context
                </p>
                <h1 style={{ fontSize: "clamp(34px, 6vw, 62px)", lineHeight: "0.92", marginBottom: "24px", color: "#EBDCC4" }}>
                  Hosting And Risk Priorities
                </h1>

                <div style={{ display: "grid", gap: "28px" }}>
                  <div>
                    <label htmlFor="hosting_provider" style={{ display: "block", marginBottom: "10px" }}>
                      Hosting Provider
                    </label>
                    <select
                      id="hosting_provider"
                      className="input-field"
                      value={answers.hosting_provider}
                      onChange={(e) => update("hosting_provider", e.target.value)}
                      style={{ borderColor: "#35211A" }}
                    >
                      <option value="">Select</option>
                      {HOSTING_OPTIONS.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "10px" }}>Biggest Concern</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {CONCERNS.map((concern) => renderChoiceButton(answers.biggest_concern === concern, () => update("biggest_concern", concern), concern))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
                  - Final Details
                </p>
                <h1 style={{ fontSize: "clamp(34px, 6vw, 62px)", lineHeight: "0.92", marginBottom: "24px", color: "#EBDCC4" }}>
                  Finish Setup
                </h1>

                <div style={{ display: "grid", gap: "24px" }}>
                  <div>
                    <label htmlFor="business_name" style={{ display: "block", marginBottom: "10px" }}>
                      Business Name
                    </label>
                    <input
                      id="business_name"
                      className="input-field"
                      value={answers.business_name}
                      onChange={(e) => update("business_name", e.target.value)}
                      style={{ borderColor: "#35211A" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="website_url" style={{ display: "block", marginBottom: "10px" }}>
                      Website URL
                    </label>
                    <input
                      id="website_url"
                      className="input-field"
                      value={answers.website_url}
                      onChange={(e) => update("website_url", e.target.value)}
                      style={{ borderColor: "#35211A" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!done && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#181818",
            borderTop: "1px solid #35211A",
            padding: "16px 48px",
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1}
            style={{
              background: "transparent",
              border: "1px solid #35211A",
              borderRadius: "4px",
              padding: "12px 18px",
              color: step === 1 ? "#35211A" : "#B6A596",
              fontFamily: "'General Sans', sans-serif",
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: step === 1 ? "not-allowed" : "pointer",
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || loading}
            style={{
              background: !canProceed() || loading ? "transparent" : "#DC9F85",
              border: `1px solid ${!canProceed() || loading ? "#35211A" : "#DC9F85"}`,
              borderRadius: "4px",
              padding: "12px 20px",
              color: !canProceed() || loading ? "#35211A" : "#181818",
              fontFamily: "'General Sans', sans-serif",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: !canProceed() || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Setting Up..." : step === 4 ? "Complete Setup" : "Next"}
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .onboarding-type-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
