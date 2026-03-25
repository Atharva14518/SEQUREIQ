import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'

export default function LandingPage() {
  return (
    <div style={{ background: '#181818', color: '#EBDCC4' }}>
      <nav className="fixed top-0 left-0 right-0 z-50 px-12 py-6 flex items-center justify-between">
        <span className="label-sm">SECUREIQ-PS003</span>
        <div className="h-px w-32" style={{ background: '#35211A' }} />
        <div className="flex items-center gap-3">
          <span className="label-sm" style={{ fontSize: 10, color: '#35211A' }}>INVITE ONLY</span>
          <SignedOut>
            <Link to="/sign-in" className="btn-ghost">SIGN IN</Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="btn-primary">DASHBOARD</Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <section className="relative min-h-screen px-12 pt-28 pb-20 flex flex-col justify-end">
        <div className="absolute top-28 left-12 flex items-center gap-3">
          <div style={{ width: 24, height: 1, background: '#DC9F85' }} />
          <span className="label-accent">EARLY ACCESS</span>
        </div>

        <h1 className="display-hero headline-depth w-full" data-text="SECUREIQ">
          <span>SECUREIQ</span>
        </h1>
        <div className="divider mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-6">
            <p className="body-copy">
              The only platform that watches, explains, and fixes your business security - autonomously. Built for India&apos;s 63 million unprotected businesses.
            </p>
            <span className="status-dot critical label-sm">THREAT MONITORING ACTIVE</span>
            <div className="flex gap-3 flex-wrap">
              <Link to="/sign-up" className="btn-primary">SCAN YOUR DOMAIN</Link>
              <a href="#capabilities" className="btn-ghost">LEARN MORE</a>
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7 space-y-4">
            {[
              ['63M+', 'Indian SMBs Unprotected', '#EBDCC4'],
              ['60S', 'Complete Security Scan', '#EBDCC4'],
              ['₹35L', 'Average Breach Cost Prevented', '#DC9F85'],
            ].map(([value, label, color]) => (
              <div key={value} className="pt-4 border-t" style={{ borderColor: '#35211A' }}>
                <p className="display-md" style={{ color }}>{value}</p>
                <p className="label-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 right-12">
          <svg className="rotating-badge" width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="31" fill="none" stroke="#35211A" strokeWidth="1" />
            <path id="waitingPath" d="M32,32 m-24,0 a24,24 0 1,1 48,0 a24,24 0 1,1 -48,0" fill="none" />
            <text style={{ fontSize: 11, fill: '#35211A', letterSpacing: '0.08em' }}>
              <textPath href="#waitingPath">WAITING LIST • WAITING LIST • </textPath>
            </text>
          </svg>
        </div>
      </section>

      <section id="capabilities" className="px-12 py-28 border-t" style={{ borderColor: '#35211A' }}>
        <p className="label-accent mb-16">- CAPABILITIES</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            ['01', 'DOMAIN\nINTELLIGENCE', '15-point automated reconnaissance across SSL, DNS, email infrastructure, and network exposure.', '- ACTIVE'],
            ['02', 'THREAT\nSIMULATION', 'Watch a live terminal simulation of your exact attack chain. Real vulnerability chains, real breach scenarios.', '- ACTIVE'],
            ['03', 'PHISHING\nINTELLIGENCE', 'Local AI detects soft-power manipulation, hierarchy leverage, and channel-shift attacks. Zero cloud transfer.', '- PS-001 CERTIFIED'],
          ].map(([num, title, copy, status], index) => (
            <div key={num} className={`pr-6 ${index < 2 ? 'md:border-r' : ''}`} style={{ borderColor: '#35211A' }}>
              <p className="label-sm mb-8" style={{ color: '#35211A' }}>{num}</p>
              <h3 className="display-md mb-4" style={{ whiteSpace: 'pre-line' }}>{title}</h3>
              <p className="body-copy">{copy}</p>
              <p className="label-sm mt-8" style={{ color: '#DC9F85' }}>{status}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-12 py-28 border-t" style={{ borderColor: '#35211A' }}>
        <p className="label-accent mb-10">- WHAT MAKES THIS DIFFERENT</p>
        <h2 className="display-lg headline-depth mb-12" style={{ whiteSpace: 'pre-line' }} data-text={'NOT A DASHBOARD.\nAN AUTONOMOUS\nSECURITY OFFICER.'}>
          <span>{'NOT A DASHBOARD.\nAN AUTONOMOUS\nSECURITY OFFICER.'}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            ['AUTONOMOUS HEALING', 'Fixes DNS misconfigurations with guided and automated workflows.'],
            ['RUPEE DAMAGE MATH', 'Financial impact quantified in rupees, tailored for Indian SMBs.'],
            ['ATTACK CHAIN', 'Visualized breach path from weak signal to business-critical exploit.'],
            ['LOCAL AI ONLY', 'Zero cloud transfer for phishing analysis and private message safety.'],
          ].map(([t, d]) => (
            <div key={t} className="border-l pl-6" style={{ borderColor: '#35211A' }}>
              <p className="label-sm mb-2" style={{ color: '#EBDCC4' }}>{t}</p>
              <p className="body-copy">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-12 py-20 border-t" style={{ borderColor: '#35211A' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            ['"SecureIQ replaced guesswork with clarity in under one minute."', 'A. Khanna', 'Founder, D2C Retail'],
            ['"The attack simulation made risk obvious to our whole team instantly."', 'S. Iyer', 'CTO, Logistics Startup'],
            ['"We finally had an actionable security roadmap without enterprise tooling."', 'R. Menon', 'Director, Healthcare SME'],
          ].map(([q, n, b]) => (
            <article key={n} className="card p-6">
              <p className="body-copy" style={{ fontStyle: 'italic' }}>{q}</p>
              <p className="label-sm mt-4" style={{ color: '#DC9F85' }}>{n}</p>
              <p className="label-sm">{b}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t px-12 py-12 flex flex-col md:flex-row gap-4 justify-between" style={{ borderColor: '#35211A' }}>
        <p className="label-sm" style={{ color: '#35211A' }}>SECUREIQ © 2026</p>
        <p className="label-sm text-center" style={{ color: '#35211A' }}>BUILT FOR INDIA&apos;S DIGITAL ECONOMY</p>
        <p className="label-sm" style={{ color: '#35211A' }}>CIPHATHON 26&apos;</p>
      </footer>
    </div>
  )
}
