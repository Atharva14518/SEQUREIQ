# SecureIQ — AI-Powered Cybersecurity Intelligence Platform
> **Ciphathon 26 · Team DomainDiggers**  
> Solving **PS-003** (Virtual Security Officer) + **PS-001** (Local Semantic Phishing Detector)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.ai) running locally with `llama3.2` model

### 1. Install Ollama model
```bash
ollama pull llama3.2
ollama serve          # keep this running
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # edit with your HIBP_API_KEY if needed
uvicorn main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
# Edit .env → set VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

### Or use Make
```bash
make install
make backend   # terminal 1
make frontend  # terminal 2
```

---

## 🏗️ Architecture

```
secureiq/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy async models + CRUD
│   ├── requirements.txt
│   ├── scanners/
│   │   ├── orchestrator.py  # Run all scanners concurrently
│   │   ├── ssl_checker.py
│   │   ├── email_security.py
│   │   ├── port_scanner.py
│   │   ├── headers_checker.py
│   │   ├── subdomain_finder.py
│   │   └── darkweb_checker.py
│   ├── ai/
│   │   ├── llm_client.py        # Ollama wrapper
│   │   ├── explainer.py         # Finding explanations
│   │   ├── attack_chain.py      # Attack chain generator
│   │   ├── fix_generator.py     # Fix steps generator
│   │   ├── hacker_simulation.py # Terminal hacker sim
│   │   ├── damage_calculator.py # ₹ financial risk
│   │   └── phishing_detector.py # PS-001 local AI detector
│   └── routes/
│       ├── scan.py
│       ├── chat.py
│       ├── report.py
│       ├── certificate.py
│       ├── phishing.py
│       └── onboarding.py
└── frontend/
    └── src/
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── Dashboard.jsx
        │   ├── PhishingDetector.jsx
        │   ├── ReportPage.jsx
        │   ├── OnboardingPage.jsx
        │   ├── SignInPage.jsx
        │   └── SignUpPage.jsx
        └── components/
            ├── ScoreGauge.jsx
            ├── FindingCard.jsx
            ├── HackerSimulation.jsx
            ├── DamageCalculator.jsx
            ├── AttackChain.jsx
            ├── Chatbot.jsx
            ├── SecurityCertificate.jsx
            ├── ScanProgress.jsx
            ├── CrisisAlert.jsx
            └── Toast.jsx
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2
HIBP_API_KEY=           # optional — haveibeenpwned.com API key
```

### Frontend (`frontend/.env`)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...   # from clerk.com
VITE_API_URL=http://localhost:8000
```

---

## 🛡️ Features

### Module 1 — Domain Security Intelligence (PS-003)
| Check | Details |
|-------|---------|
| SSL Certificate | Validity, expiry, grading |
| SPF Record | Email spoofing prevention |
| DMARC Policy | Email authentication policy |
| DKIM Setup | Email signing verification |
| Security Headers | HSTS, CSP, X-Frame, XSS Protection |
| Port Scanning | Dangerous exposed ports detection |
| Subdomain Exposure | 16 common subdomain checks |
| Dark Web Breach | HIBP breach detection |
| **AI Attack Chain** | Multi-step exploitation chain |
| **Hacker Simulation** | Terminal-style attack walkthrough |
| **₹ Damage Calculator** | Indian rupee financial risk |
| **Security Certificate** | PDF with QR verification (score ≥70) |
| **AI Chat** | Context-aware Q&A about YOUR scan |

### Module 2 — Phishing Intelligence (PS-001)
- **100% Local AI** — no data ever sent to cloud servers
- Soft-power manipulation detection
- India-specific: Digital Arrest, KYC fraud, UPI fraud, ED/CBI impersonation
- Channel-shift attack detection
- Real-time pattern flagging as you type
- Analysis history + statistics
- Cybercrime.gov.in reporting links

---

## 🏆 Hackathon Notes
- **PS-001 Privacy**: All phishing analysis runs via local Ollama. Zero network requests to external AI. Cryptographically verifiable via browser Network tab.
- **PS-003 AI**: Uses local Ollama for explanations, attack chains, fixes — no external API calls in main scan flow.
- **India-First**: All rupee estimates, context examples, and scam databases tuned for Indian SMBs.
