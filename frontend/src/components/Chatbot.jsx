import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send } from 'lucide-react'
import { sendChatMessage } from '../api/secureiq.js'

export default function Chatbot({ scanContext, clerkUserId }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m SecureIQ AI. Ask me anything about your security scan results 🔒' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  const SUGGESTIONS = ['What\'s my biggest risk?', 'How do I fix SPF?', 'Should I be worried?']

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const res = await sendChatMessage(msg, scanContext || {}, clerkUserId)
      setMessages(m => [...m, { role: 'ai', text: res.response }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: 'Sorry, AI is unavailable. Make sure Ollama is running.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all"
        style={{ background: 'var(--blue)', color: 'white', boxShadow: '0 8px 32px rgba(88,166,255,0.4)' }}>
        {open ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 flex flex-col"
            style={{ width: '380px', height: '500px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(88,166,255,0.15)' }}>
                <MessageSquare size={16} style={{ color: 'var(--blue)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>SecureIQ AI</p>
                <p className="text-xs" style={{ color: 'var(--green)' }}>● Local AI · Powered by Ollama</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm`}
                    style={{
                      background: m.role === 'user' ? 'var(--blue)' : 'var(--bg-card-2)',
                      color: m.role === 'user' ? 'white' : 'var(--text-1)',
                    }}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl" style={{ background: 'var(--bg-card-2)' }}>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <motion.div key={i} animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }}
                          className="w-2 h-2 rounded-full" style={{ background: 'var(--text-2)' }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-xs px-3 py-1 rounded-full border transition-all"
                    style={{ background: 'var(--bg-card-2)', color: 'var(--blue)', borderColor: 'rgba(88,166,255,0.3)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
              <input className="input-dark flex-1 py-2 text-sm"
                placeholder="Ask about your security..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()} />
              <button onClick={() => send()} className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'var(--blue)', color: 'white' }}>
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
