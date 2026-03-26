import { motion } from "framer-motion"

export default function AttackChain({ chain: attackChain }) {
  if (!attackChain?.has_chain) return null

  return (
    <div
      className="card"
      style={{
        borderColor: "#DC9F85",
        background: "rgba(220,159,133,0.04)",
      }}
    >
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
        - Attack Chain Detected
      </p>

      <h2
        style={{
          fontFamily: "'Clash Grotesk', sans-serif",
          fontSize: "clamp(22px, 3vw, 40px)",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: "1.0",
          color: "#EBDCC4",
          marginBottom: "16px",
          wordBreak: "break-word",
        }}
      >
        {attackChain?.chain_title || "MULTI-STEP EXPLOIT CHAIN"}
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
        <span className="label-sm" style={{ color: "#DC9F85", border: "1px solid #DC9F85", borderRadius: 4, padding: "6px 8px" }}>
          {attackChain.chain_severity || "Critical"}
        </span>
        <span className="label-sm" style={{ color: "#B6A596", border: "1px solid #35211A", borderRadius: 4, padding: "6px 8px" }}>
          {attackChain.time_to_compromise || "Immediate"}
        </span>
        <span className="label-sm" style={{ color: "#B6A596", border: "1px solid #35211A", borderRadius: 4, padding: "6px 8px" }}>
          Weakest Link: {attackChain.weakest_link || "Unknown"}
        </span>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {(attackChain.steps || []).map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{
              padding: "14px 16px",
              border: "1px solid #35211A",
              borderRadius: "4px",
              background: "#1E1E1E",
            }}
          >
            <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
              Step {step.step_number || index + 1}
            </p>
            <p style={{ color: "#EBDCC4", fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>{step.action}</p>
            <p style={{ color: "#B6A596", fontSize: "13px", lineHeight: "1.6" }}>
              Tool: <span style={{ color: "#DC9F85" }}>{step.hacker_tool}</span> • Exploits: {step.vulnerability_used}
            </p>
            <p style={{ color: "#66473B", fontSize: "12px", lineHeight: "1.5", marginTop: "6px" }}>Impact: {step.business_impact}</p>
          </motion.div>
        ))}
      </div>

      {attackChain.chain_summary && (
        <p style={{ color: "#B6A596", lineHeight: "1.7", marginTop: "18px" }}>{attackChain.chain_summary}</p>
      )}

      {attackChain.priority_fix && (
        <div style={{ marginTop: "18px", borderTop: "1px solid #35211A", paddingTop: "16px" }}>
          <p style={{ color: "#DC9F85", fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
            Priority Fix
          </p>
          <p style={{ color: "#EBDCC4", lineHeight: "1.6" }}>{attackChain.priority_fix}</p>
        </div>
      )}
    </div>
  )
}
