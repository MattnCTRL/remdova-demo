import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, AlertTriangle, Loader2, ShieldCheck, Phone, MapPin, Clock,
} from 'lucide-react'

type Props = { open: boolean; onClose: () => void }

type FormState = {
  name: string
  phone: string
  email: string
  address: string
  city: string
  zip: string
  damageType: string
  damageDesc: string
  insurance: string
  policyHolder: string
}

const INITIAL: FormState = {
  name: '', phone: '', email: '',
  address: '', city: '', zip: '',
  damageType: 'water', damageDesc: '',
  insurance: 'unsure', policyHolder: '',
}

const DAMAGE_TYPES: { value: string; label: string }[] = [
  { value: 'water',      label: 'Water damage' },
  { value: 'mold',       label: 'Mold' },
  { value: 'fire',       label: 'Fire / smoke' },
  { value: 'asbestos',   label: 'Asbestos' },
  { value: 'biohazard',  label: 'Biohazard' },
  { value: 'structural', label: 'Structural' },
  { value: 'other',      label: 'Other / not sure' },
]

// Renders the $95 emergency-dispatch booking modal. Collects intake, then POSTs
// to /api/checkout which creates a Stripe Checkout session and returns a URL we
// redirect to. On success Stripe redirects back to /?booked=1.
export default function BookingModal({ open, onClose }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset on close so re-opening starts fresh.
  useEffect(() => { if (!open) { setError(null); setBusy(false) } }, [open])

  // ESC closes the modal.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function submit() {
    setError(null)
    if (!form.name.trim())     { setError('Please enter your full name.'); return }
    if (!form.phone.trim())    { setError('Please enter a phone number.'); return }
    if (!form.email.trim())    { setError('Please enter your email.'); return }
    if (!form.address.trim())  { setError('Please enter the property address.'); return }
    if (!form.damageDesc.trim()) { setError('Tell us briefly what happened.'); return }

    setBusy(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? 'Could not start checkout. Please call us directly.')
      }
      window.location.href = data.url
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please call us directly.')
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(8,12,22,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '40px 16px', overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580,
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              padding: '24px 28px', position: 'relative',
            }}>
              <button onClick={onClose} aria-label="Close"
                style={{
                  position: 'absolute', top: 14, right: 14, width: 32, height: 32,
                  borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <X size={16} />
              </button>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                $95 Emergency Dispatch
              </div>
              <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                Book emergency restoration
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', margin: '6px 0 0', lineHeight: 1.5 }}>
                The $95 fee locks in our 60-minute Portland-metro response and is applied to your final project cost.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px 8px' }}>
              {/* What you get */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                background: '#fafaf7', border: '1px solid #ececec',
                borderRadius: 12, padding: '14px 16px', marginBottom: 22,
              }}>
                {[
                  { icon: Clock,       text: '60-min metro arrival' },
                  { icon: ShieldCheck, text: 'Applied to project' },
                  { icon: MapPin,      text: 'Local technician' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontSize: '0.74rem', fontWeight: 600 }}>
                    <Icon size={13} color="#ea580c" />
                    {text}
                  </div>
                ))}
              </div>

              {/* Contact */}
              <Section title="Your contact info">
                <Row>
                  <Field label="Full name" value={form.name} onChange={v => set('name', v)} placeholder="Jane Doe" />
                  <Field label="Phone"     value={form.phone} onChange={v => set('phone', v)} placeholder="(503) 555-0123" type="tel" />
                </Row>
                <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="jane@example.com" type="email" />
              </Section>

              {/* Property */}
              <Section title="Property address">
                <Field label="Street address" value={form.address} onChange={v => set('address', v)} placeholder="123 Main St" />
                <Row>
                  <Field label="City" value={form.city} onChange={v => set('city', v)} placeholder="Lake Oswego" />
                  <Field label="ZIP"  value={form.zip}  onChange={v => set('zip', v)}  placeholder="97034" />
                </Row>
              </Section>

              {/* Damage */}
              <Section title="What's the situation?">
                <Select label="Damage type" value={form.damageType} onChange={v => set('damageType', v)} options={DAMAGE_TYPES} />
                <Textarea label="Briefly describe what happened"
                  value={form.damageDesc}
                  onChange={v => set('damageDesc', v)}
                  placeholder="Burst pipe under kitchen sink, water on the floor, ~30 min ago..."
                />
              </Section>

              {/* Insurance */}
              <Section title="Insurance">
                <Select label="Filing an insurance claim?" value={form.insurance} onChange={v => set('insurance', v)} options={[
                  { value: 'yes',    label: 'Yes — I have a claim or plan to file one' },
                  { value: 'no',     label: 'No — paying out of pocket' },
                  { value: 'unsure', label: 'Not sure yet' },
                ]} />
                {form.insurance === 'yes' && (
                  <Field label="Policy holder name (if different)" value={form.policyHolder} onChange={v => set('policyHolder', v)} placeholder="(optional)" />
                )}
              </Section>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#b91c1c', padding: '10px 14px', borderRadius: 10,
                  fontSize: '0.86rem', lineHeight: 1.5, marginBottom: 14,
                }}>
                  <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 28px 24px', borderTop: '1px solid #f1f1f1',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                style={{
                  width: '100%', padding: '14px 18px',
                  background: busy ? '#fdba74' : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
                }}
              >
                {busy
                  ? <><Loader2 size={16} className="spin" /> Starting checkout…</>
                  : <>Continue to secure $95 checkout →</>}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af', fontSize: '0.78rem' }}>
                <Phone size={11} />
                Or call us directly: <a href="tel:+15555555555" style={{ color: '#ea580c', fontWeight: 700 }}>(555) 555-5555</a>
              </div>
            </div>

            <style>{`
              .spin { animation: spin 1s linear infinite; }
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Form bits ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  border: '1.5px solid #e5e7eb', borderRadius: 10,
  fontSize: '0.92rem', outline: 'none',
  color: '#111827', background: '#f9fafb',
  fontFamily: 'inherit',
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</label>
      <textarea
        value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
