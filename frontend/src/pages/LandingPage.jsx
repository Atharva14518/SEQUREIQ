import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react"

export default function LandingPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      style={{
        background: "#181818",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <svg
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0.03,
        }}
      >
        <filter id="noise-land">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-land)" />
      </svg>

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          background: "rgba(24,24,24,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #35211A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.35C17.25 23.15 21 18.25 21 13V7L12 2z"
              fill="rgba(220,159,133,0.15)"
              stroke="#DC9F85"
              strokeWidth="1.5"
            />
            <path d="M9 12l2 2 4-4" stroke="#DC9F85" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span
            style={{
              fontFamily: "'Clash Grotesk', sans-serif",
              fontSize: "18px",
              fontWeight: "700",
              color: "#EBDCC4",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            SecureIQ
          </span>
        </div>

        <div style={{ display: "flex", gap: "32px" }} className="nav-links-desktop">
          {["Features", "How It Works", "Pricing"].map((link) => (
            <span
              key={link}
              style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: "12px",
                fontWeight: "500",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#B6A596",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#EBDCC4"
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#B6A596"
              }}
            >
              {link}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          style={{
            display: "none",
            background: "transparent",
            border: "1px solid #35211A",
            borderRadius: "4px",
            padding: "8px 10px",
            color: "#EBDCC4",
            fontFamily: "'General Sans', sans-serif",
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }} className="nav-auth">
          <SignedOut>
            <button
              onClick={() => navigate("/sign-in")}
              style={{
                background: "transparent",
                border: "1px solid #66473B",
                borderRadius: "4px",
                padding: "8px 20px",
                color: "#EBDCC4",
                fontFamily: "'General Sans', sans-serif",
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              LOG IN
            </button>
            <button
              onClick={() => navigate("/sign-up")}
              style={{
                background: "#DC9F85",
                border: "none",
                borderRadius: "4px",
                padding: "8px 20px",
                color: "#181818",
                fontFamily: "'General Sans', sans-serif",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              GET STARTED -
            </button>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "#DC9F85",
                border: "none",
                borderRadius: "4px",
                padding: "8px 20px",
                color: "#181818",
                fontFamily: "'General Sans', sans-serif",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              DASHBOARD -
            </button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="mobile-menu"
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            zIndex: 99,
            background: "#181818",
            borderBottom: "1px solid #35211A",
            padding: "16px 24px",
            display: "none",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {["Features", "How It Works", "Pricing"].map((link) => (
            <span
              key={link}
              style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#B6A596",
              }}
            >
              {link}
            </span>
          ))}
        </div>
      )}

      <section
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "120px 48px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220,159,133,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            right: "5%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220,159,133,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", width: "100%" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid #35211A",
              borderRadius: "4px",
              padding: "6px 16px",
              marginBottom: "40px",
            }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#DC9F85" }} />
            <span
              style={{
                fontFamily: "'General Sans', sans-serif",
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#B6A596",
              }}
            >
              AI-POWERED SECURITY INTELLIGENCE
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Clash Grotesk', sans-serif",
              fontSize: "clamp(52px, 10vw, 120px)",
              fontWeight: "700",
              lineHeight: "0.88",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#EBDCC4",
              marginBottom: "32px",
            }}
          >
            YOUR WEBSITE.
            <br />
            <span style={{ color: "#DC9F85" }}>SECURED.</span>
            <br />
            <span style={{ color: "#B6A596" }}>EXPLAINED.</span>
          </h1>

          <p
            style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: "18px",
              fontWeight: "300",
              color: "#B6A596",
              lineHeight: "1.7",
              maxWidth: "560px",
              margin: "0 auto 48px",
            }}
          >
            SecureIQ scans 15+ security checkpoints in 60 seconds and explains every risk in plain English. No IT team
            required.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1px",
              background: "#35211A",
              border: "1px solid #35211A",
              borderRadius: "4px",
              overflow: "hidden",
              maxWidth: "600px",
              margin: "0 auto 48px",
            }}
          >
            {[
              { num: "63M+", label: "SMBs at Risk" },
              { num: "60S", label: "Scan Time" },
              { num: "Rs35L", label: "Avg Breach Cost" },
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  background: "#181818",
                  padding: "20px 16px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Clash Grotesk', sans-serif",
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#DC9F85",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.num}
                </div>
                <div
                  style={{
                    fontFamily: "'General Sans', sans-serif",
                    fontSize: "11px",
                    fontWeight: "500",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#66473B",
                    marginTop: "4px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <button
              onClick={() => navigate("/sign-up")}
              style={{
                background: "#DC9F85",
                border: "none",
                borderRadius: "4px",
                padding: "16px 40px",
                color: "#181818",
                fontFamily: "'General Sans', sans-serif",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              START FREE SCAN -
            </button>
            <button
              onClick={() => navigate("/sign-in")}
              style={{
                background: "transparent",
                border: "1px solid #66473B",
                borderRadius: "4px",
                padding: "16px 40px",
                color: "#EBDCC4",
                fontFamily: "'General Sans', sans-serif",
                fontSize: "13px",
                fontWeight: "600",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              SIGN IN
            </button>
          </div>

          <p
            style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: "11px",
              color: "#35211A",
              letterSpacing: "0.05em",
            }}
          >
            NO CREDIT CARD • FREE FOREVER • TRUSTED BY 500+ INDIAN BUSINESSES
          </p>
        </div>
      </section>

      <section style={{ padding: "100px 48px", borderTop: "1px solid #35211A" }}>
        <p
          style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#DC9F85",
            marginBottom: "64px",
            textAlign: "center",
          }}
        >
          - CAPABILITIES
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1px",
            background: "#35211A",
            border: "1px solid #35211A",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {[
            {
              num: "01",
              title: "DOMAIN\nINTELLIGENCE",
              desc: "15-point automated scan across SSL, DNS, email infrastructure, and network exposure. Results in 60 seconds.",
              tag: "- ACTIVE",
            },
            {
              num: "02",
              title: "THREAT\nSIMULATION",
              desc: "Live terminal simulation showing exactly how a hacker would exploit your vulnerabilities step by step.",
              tag: "- ACTIVE",
            },
            {
              num: "03",
              title: "PHISHING\nINTELLIGENCE",
              desc: "Local AI detects soft-power manipulation, hierarchy leverage, and channel-shift attacks. Zero cloud transfer.",
              tag: "- PS-001",
            },
            {
              num: "04",
              title: "AUTO-FIX\nDNS",
              desc: "One click generates the exact DNS record and deploys it automatically. No developer needed.",
              tag: "- INNOVATIVE",
            },
          ].map((feature, index) => (
            <div key={index} style={{ background: "#181818", padding: "40px 32px" }}>
              <p
                style={{
                  fontFamily: "'General Sans', sans-serif",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#35211A",
                  letterSpacing: "0.1em",
                  marginBottom: "24px",
                }}
              >
                {feature.num}
              </p>
              <h3
                style={{
                  fontFamily: "'Clash Grotesk', sans-serif",
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#EBDCC4",
                  lineHeight: "0.9",
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  whiteSpace: "pre-line",
                  marginBottom: "16px",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  fontFamily: "'General Sans', sans-serif",
                  fontSize: "14px",
                  fontWeight: "300",
                  color: "#B6A596",
                  lineHeight: "1.7",
                  marginBottom: "24px",
                }}
              >
                {feature.desc}
              </p>
              <span
                style={{
                  fontFamily: "'General Sans', sans-serif",
                  fontSize: "10px",
                  fontWeight: "600",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#DC9F85",
                }}
              >
                {feature.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid #35211A",
          padding: "40px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {["SECUREIQ © 2026", "BUILT FOR INDIA'S DIGITAL ECONOMY", "CIPHATHON 26' - DOMAINDIGGERS"].map((text, index) => (
          <span
            key={index}
            style={{
              fontFamily: "'General Sans', sans-serif",
              fontSize: "10px",
              fontWeight: "500",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#35211A",
            }}
          >
            {text}
          </span>
        ))}
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop,
          .nav-auth {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: inline-flex !important;
          }
          .mobile-menu {
            display: flex !important;
          }
          section {
            padding: 80px 24px 60px !important;
          }
          h1 {
            font-size: 48px !important;
          }
        }
      `}</style>
    </div>
  )
}
