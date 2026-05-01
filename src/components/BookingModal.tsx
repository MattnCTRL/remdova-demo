import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, AlertTriangle, Loader2, ArrowLeft, ArrowRight, Phone, Zap,
  Droplets, Flame, Wind, Wrench, AlertOctagon, HelpCircle, Shield,
  CheckCircle, Clock, MapPin, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

type Props = { open: boolean; onClose: () => void }

// ── Answer shape ─────────────────────────────────────────────────────────────
// All fields optional — the wizard fills in only what's relevant for the
// branch the user takes. The API does its own required-field validation
// against the subset the request actually needs.
type Answers = {
  damageType?:        'water'|'fire'|'mold'|'asbestos'|'biohazard'|'structural'|'other'
  waterFlowing?:      'yes'|'no'
  fireActive?:        'yes'|'no'
  startedWhen?:       'just'|'today'|'recent'|'days'
  scope?:             'room'|'multi'|'whole'|'unsure'
  propertyType?:      'home'|'rental'|'commercial'
  damageDesc?:        string
  address?:           string
  city?:              string
  zip?:               string
  insurance?:         'yes'|'no'|'unsure'
  insuranceCarrier?:  string
  policyHolder?:      string
  name?:              string
  phone?:             string
  email?:             string
}

// ── Step engine ──────────────────────────────────────────────────────────────
type ChoiceOption = {
  value: string
  label: string
  subtitle?: string
  icon?: LucideIcon
  emphasis?: 'urgent' | 'normal'
}

type ChoiceStep = {
  id: string
  type: 'choice'
  field: keyof Answers
  question: string
  subtitle?: string
  options: ChoiceOption[]
  if?: (a: Answers) => boolean
}

type InputStep = {
  id: string
  type: 'text' | 'textarea'
  field: keyof Answers
  question: string
  subtitle?: string
  placeholder?: string
  inputType?: string
  required?: boolean
  if?: (a: Answers) => boolean
}

type AddressStep = {
  id: string
  type: 'address'
  question: string
  subtitle?: string
  if?: (a: Answers) => boolean
}

type WarningStep = {
  id: string
  type: 'warning'
  question: string
  subtitle?: string
  cta?: string
  if?: (a: Answers) => boolean
}

type SummaryStep = {
  id: string
  type: 'summary'
  question: string
  subtitle?: string
  if?: (a: Answers) => boolean
}

type Step = ChoiceStep | InputStep | AddressStep | WarningStep | SummaryStep

const STEPS: Step[] = [
  // ── 1. Damage type ─────────────────────────────────────────────────────────
  {
    id: 'damage',
    type: 'choice',
    field: 'damageType',
    question: 'What kind of emergency are you dealing with?',
    subtitle: "Don't worry if it's complicated — just pick the closest fit.",
    options: [
      { value: 'water',      label: 'Water damage',       subtitle: 'Burst pipe, flood, leak',         icon: Droplets    },
      { value: 'fire',       label: 'Fire or smoke',      subtitle: 'Recent fire, smoke residue',      icon: Flame       },
      { value: 'mold',       label: 'Mold',               subtitle: 'Visible mold or musty smell',     icon: Wind        },
      { value: 'biohazard',  label: 'Biohazard',          subtitle: 'Sewage, trauma, hazardous',       icon: AlertOctagon },
      { value: 'asbestos',   label: 'Asbestos',           subtitle: 'Suspected or confirmed',          icon: Shield      },
      { value: 'structural', label: 'Structural damage',  subtitle: 'Impact, settling, collapse',      icon: Wrench      },
      { value: 'other',      label: "Something else",     subtitle: "I'm not sure / mixed",            icon: HelpCircle  },
    ],
  },

  // ── 2a. Water active? ──────────────────────────────────────────────────────
  {
    id: 'water-flowing',
    type: 'choice',
    field: 'waterFlowing',
    if: a => a.damageType === 'water',
    question: 'Is the water still actively flowing?',
    subtitle: "If you can, shut off the main water valve. If you can't find it, we'll help on the phone.",
    options: [
      { value: 'yes', label: 'Still flowing',   subtitle: 'Need help right now',  emphasis: 'urgent' },
      { value: 'no',  label: "It's stopped",     subtitle: 'Source contained for now' },
    ],
  },

  // ── 2b. Fire active? ───────────────────────────────────────────────────────
  {
    id: 'fire-active',
    type: 'choice',
    field: 'fireActive',
    if: a => a.damageType === 'fire',
    question: 'Is the fire still burning?',
    options: [
      { value: 'yes', label: 'Yes — still active', emphasis: 'urgent' },
      { value: 'no',  label: "No — it's been put out" },
    ],
  },

  // ── 2c. Fire 911 warning ───────────────────────────────────────────────────
  {
    id: 'fire-911',
    type: 'warning',
    if: a => a.fireActive === 'yes',
    question: 'Call 911 first.',
    subtitle: "If a fire is actively burning, get out and call 911. Once the fire department clears the scene and it's safe, come back here and we'll handle the cleanup and restoration.",
    cta: "Got it — continue anyway",
  },

  // ── 3. When ────────────────────────────────────────────────────────────────
  {
    id: 'when',
    type: 'choice',
    field: 'startedWhen',
    question: 'When did this start?',
    subtitle: "Helps us know how urgent this is and what we'll need on arrival.",
    options: [
      { value: 'just',   label: 'Just now',         subtitle: 'Within the last hour',  emphasis: 'urgent' },
      { value: 'today',  label: 'Earlier today',    subtitle: '1–12 hours ago' },
      { value: 'recent', label: 'In the last day',  subtitle: '12–48 hours ago' },
      { value: 'days',   label: 'Days ago',         subtitle: 'I just realized it' },
    ],
  },

  // ── 4. Scope ───────────────────────────────────────────────────────────────
  {
    id: 'scope',
    type: 'choice',
    field: 'scope',
    question: 'How much of the property is affected?',
    options: [
      { value: 'room',   label: 'Single room',     subtitle: 'Contained to one space' },
      { value: 'multi',  label: 'Multiple rooms',  subtitle: 'Or one room + flooring' },
      { value: 'whole',  label: 'Whole property',  subtitle: 'Large area or structural' },
      { value: 'unsure', label: "I'm not sure",     subtitle: "We'll figure it out on-site" },
    ],
  },

  // ── 5. Property type ───────────────────────────────────────────────────────
  {
    id: 'property-type',
    type: 'choice',
    field: 'propertyType',
    question: 'Whose property is this?',
    options: [
      { value: 'home',       label: 'My home' },
      { value: 'rental',     label: 'A rental property I own' },
      { value: 'commercial', label: 'A business / commercial space' },
    ],
  },

  // ── 6. Description ─────────────────────────────────────────────────────────
  {
    id: 'desc',
    type: 'textarea',
    field: 'damageDesc',
    required: true,
    question: 'In your own words — what happened?',
    subtitle: "Don't worry about getting it perfect. Anything that helps us understand. We'll get the rest on-site.",
    placeholder: 'Burst pipe under the kitchen sink. Water on the floor, may have spread under cabinets…',
  },

  // ── 7. Address ─────────────────────────────────────────────────────────────
  {
    id: 'address',
    type: 'address',
    question: 'Where should we head?',
    subtitle: "We'll dispatch the moment your $95 booking is confirmed. The address goes to your technician's GPS — nothing more.",
  },

  // ── 8. Insurance ───────────────────────────────────────────────────────────
  {
    id: 'insurance',
    type: 'choice',
    field: 'insurance',
    question: 'Filing this through insurance?',
    subtitle: "Either way is fine. This just lets us prep the right paperwork before we arrive.",
    options: [
      { value: 'yes',    label: 'Yes',    subtitle: "I have a claim or plan to file one" },
      { value: 'no',     label: 'No',     subtitle: "I'm paying out of pocket" },
      { value: 'unsure', label: 'Not sure yet', subtitle: "Let's figure it out together" },
    ],
  },

  // ── 8b. Carrier ────────────────────────────────────────────────────────────
  {
    id: 'carrier',
    type: 'text',
    field: 'insuranceCarrier',
    if: a => a.insurance === 'yes',
    question: 'Which insurance carrier?',
    subtitle: "Optional — helpful if you know it. State Farm, Allstate, USAA, etc.",
    placeholder: 'State Farm',
  },

  // ── 9. Name ────────────────────────────────────────────────────────────────
  {
    id: 'name',
    type: 'text',
    field: 'name',
    required: true,
    question: "What's your name?",
    placeholder: 'Jane Doe',
  },

  // ── 10. Phone ──────────────────────────────────────────────────────────────
  {
    id: 'phone',
    type: 'text',
    field: 'phone',
    required: true,
    question: 'Best phone to reach you?',
    subtitle: "We'll call when we're about 10 minutes out so you know we're close.",
    placeholder: '(503) 555-0123',
    inputType: 'tel',
  },

  // ── 11. Email ──────────────────────────────────────────────────────────────
  {
    id: 'email',
    type: 'text',
    field: 'email',
    required: true,
    question: 'And your email?',
    subtitle: "Stripe sends your receipt here. We'll also email next-step info.",
    placeholder: 'jane@example.com',
    inputType: 'email',
  },

  // ── 12. Summary ────────────────────────────────────────────────────────────
  {
    id: 'summary',
    type: 'summary',
    question: "Ready to dispatch?",
    subtitle: "Continue to Stripe to pay the $95 booking fee. We'll start moving as soon as it clears.",
  },
]

// Find the indices of all visible steps for the current answer set.
function visibleStepIndices(answers: Answers): number[] {
  return STEPS.map((s, i) => (s.if ? (s.if(answers) ? i : -1) : i)).filter(i => i >= 0)
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BookingModal({ open, onClose }: Props) {
  const [answers, setAnswers]   = useState<Answers>({})
  const [stepIdx, setStepIdx]   = useState(0)        // index into visibleStepIndices()
  const [direction, setDirection] = useState<1 | -1>(1)
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Recompute the visible step list every render — answer changes naturally
  // expand/collapse the list (e.g. answering 'fire' adds the fire-active step).
  const visible = useMemo(() => visibleStepIndices(answers), [answers])
  const safeIdx = Math.min(stepIdx, Math.max(0, visible.length - 1))
  const step    = STEPS[visible[safeIdx]]
  const total   = visible.length

  // Reset state when the modal closes/opens.
  useEffect(() => {
    if (!open) {
      // Don't blow away answers immediately — let the close animation finish.
      const t = setTimeout(() => {
        setAnswers({})
        setStepIdx(0)
        setError(null)
        setBusy(false)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // ESC closes the modal; lock body scroll while open.
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

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers(a => ({ ...a, [key]: value }))
  }

  function goNext() {
    setError(null)
    setDirection(1)
    setStepIdx(i => Math.min(i + 1, total - 1))
  }

  function goBack() {
    setError(null)
    setDirection(-1)
    setStepIdx(i => Math.max(0, i - 1))
  }

  function handleChoice(option: ChoiceOption) {
    if (step.type !== 'choice') return
    set(step.field, option.value as any)
    // Auto-advance after a short pause so the user sees their selection register.
    setTimeout(goNext, 160)
  }

  function canAdvanceFromInput(): boolean {
    if (step.type === 'text' || step.type === 'textarea') {
      const value = (answers[step.field] as string | undefined)?.trim() ?? ''
      if (step.required && !value) return false
      if (step.field === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) return false
      return true
    }
    if (step.type === 'address') {
      return !!(answers.address?.trim())
    }
    return true
  }

  async function submit() {
    setError(null)
    if (!answers.name?.trim() || !answers.phone?.trim() || !answers.email?.trim()
      || !answers.address?.trim() || !answers.damageType || !answers.damageDesc?.trim()) {
      setError("Looks like a field is missing. Use Back to fill it in.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
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
            background: 'rgba(8,12,22,0.78)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 22, width: '100%', maxWidth: 580,
              boxShadow: '0 30px 100px rgba(0,0,0,0.5)', overflow: 'hidden',
              fontFamily: "'Inter', sans-serif",
              display: 'flex', flexDirection: 'column',
              maxHeight: 'calc(100vh - 48px)',
            }}
          >
            {/* Top bar: progress + close */}
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f1f1', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Zap size={13} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase' }}>$95 Emergency Dispatch</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
                      Step {Math.min(safeIdx + 1, total)} of {total}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} aria-label="Close"
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: '#f3f4f6', border: 'none',
                    color: '#6b7280', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <X size={15} />
                </button>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: '#f3f4f6', borderRadius: 100, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${((safeIdx + 1) / total) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #f97316, #ea580c)' }}
                />
              </div>
            </div>

            {/* Step body */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ padding: '28px 28px 24px' }}
                >
                  <StepRenderer
                    step={step}
                    answers={answers}
                    set={set}
                    onChoice={handleChoice}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                margin: '0 22px 12px',
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#b91c1c', padding: '10px 14px', borderRadius: 10,
                fontSize: '0.86rem', lineHeight: 1.5,
              }}>
                <AlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Footer nav */}
            <div style={{
              padding: '14px 22px 20px', borderTop: '1px solid #f1f1f1',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <button
                onClick={goBack}
                disabled={safeIdx === 0 || busy}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#f3f4f6', border: 'none',
                  color: safeIdx === 0 ? '#d1d5db' : '#374151',
                  padding: '11px 14px', borderRadius: 10,
                  fontWeight: 700, fontSize: '0.82rem',
                  cursor: safeIdx === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <ArrowLeft size={13} /> Back
              </button>

              {/* Primary advance button — varies by step type */}
              {step.type === 'summary' ? (
                <button
                  onClick={submit}
                  disabled={busy}
                  style={primaryBtnStyle(busy)}
                >
                  {busy
                    ? <><Loader2 size={15} className="spin" /> Starting checkout…</>
                    : <>Pay $95 & dispatch <ArrowRight size={15} /></>}
                </button>
              ) : step.type === 'choice' ? (
                <div style={{ flex: 1, textAlign: 'right', color: '#9ca3af', fontSize: '0.78rem' }}>
                  Tap to choose
                </div>
              ) : step.type === 'warning' ? (
                <button onClick={goNext} style={primaryBtnStyle(false)}>
                  {step.cta ?? 'Continue'} <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canAdvanceFromInput()}
                  style={primaryBtnStyle(false, !canAdvanceFromInput())}
                >
                  Continue <ArrowRight size={15} />
                </button>
              )}
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

// ── Step renderers ───────────────────────────────────────────────────────────

function StepRenderer({ step, answers, set, onChoice }: {
  step: Step
  answers: Answers
  set: <K extends keyof Answers>(key: K, value: Answers[K]) => void
  onChoice: (opt: ChoiceOption) => void
}) {
  return (
    <>
      <h2 style={{
        fontSize: '1.4rem', fontWeight: 900, color: '#0a0e1a',
        letterSpacing: '-0.02em', lineHeight: 1.25, margin: '0 0 8px',
      }}>{step.question}</h2>
      {step.subtitle && (
        <p style={{ fontSize: '0.92rem', color: '#6b7280', lineHeight: 1.6, margin: '0 0 22px' }}>
          {step.subtitle}
        </p>
      )}

      {step.type === 'choice'   && <ChoiceBody step={step}   selected={answers[step.field] as string | undefined} onPick={onChoice} />}
      {step.type === 'text'     && <TextBody   step={step}   value={(answers[step.field] as string | undefined) ?? ''} onChange={v => set(step.field, v as any)} />}
      {step.type === 'textarea' && <TextareaBody step={step} value={(answers[step.field] as string | undefined) ?? ''} onChange={v => set(step.field, v as any)} />}
      {step.type === 'address'  && <AddressBody answers={answers} set={set} />}
      {step.type === 'warning'  && <WarningBody />}
      {step.type === 'summary'  && <SummaryBody answers={answers} />}
    </>
  )
}

function ChoiceBody({ step, selected, onPick }: {
  step: ChoiceStep; selected: string | undefined; onPick: (opt: ChoiceOption) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {step.options.map(opt => {
        const isSelected = selected === opt.value
        const isUrgent   = opt.emphasis === 'urgent'
        const Icon       = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPick(opt)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12,
              background: isSelected ? '#fff7ed' : '#fafaf7',
              border: `1.5px solid ${isSelected ? '#f97316' : '#ececec'}`,
              cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all 0.18s ease',
              boxShadow: isSelected ? '0 4px 16px rgba(249,115,22,0.18)' : 'none',
            }}
            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#fdba74' }}
            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#ececec' }}
          >
            {Icon && (
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: isSelected ? '#fed7aa' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #ececec',
              }}>
                <Icon size={17} color={isUrgent ? '#dc2626' : '#ea580c'} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isUrgent ? '#dc2626' : '#0a0e1a' }}>
                {opt.label}
              </div>
              {opt.subtitle && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
                  {opt.subtitle}
                </div>
              )}
            </div>
            {isSelected && <CheckCircle size={16} color="#f97316" />}
          </button>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 16px',
  border: '1.5px solid #e5e7eb', borderRadius: 12,
  fontSize: '1rem', outline: 'none',
  color: '#111827', background: '#fafaf7',
  fontFamily: 'inherit',
}

function TextBody({ step, value, onChange }: { step: InputStep; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [step.id])
  return (
    <input
      ref={ref}
      type={step.inputType ?? 'text'}
      value={value}
      placeholder={step.placeholder}
      onChange={e => onChange(e.target.value)}
      style={inputStyle}
      onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
    />
  )
}

function TextareaBody({ step, value, onChange }: { step: InputStep; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [step.id])
  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={step.placeholder}
      onChange={e => onChange(e.target.value)}
      rows={4}
      style={{ ...inputStyle, resize: 'vertical' }}
      onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
    />
  )
}

function AddressBody({ answers, set }: {
  answers: Answers
  set: <K extends keyof Answers>(key: K, value: Answers[K]) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={fieldLabelStyle}>Street address</label>
        <input
          ref={ref}
          value={answers.address ?? ''}
          placeholder="123 Main St"
          onChange={e => set('address', e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <div>
          <label style={fieldLabelStyle}>City</label>
          <input
            value={answers.city ?? ''}
            placeholder="Lake Oswego"
            onChange={e => set('city', e.target.value)}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div>
          <label style={fieldLabelStyle}>ZIP</label>
          <input
            value={answers.zip ?? ''}
            placeholder="97034"
            onChange={e => set('zip', e.target.value)}
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>
    </div>
  )
}

function WarningBody() {
  return (
    <div style={{
      background: '#fef2f2', border: '1.5px solid #fecaca',
      borderRadius: 12, padding: '16px 18px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: '0.9rem', color: '#7f1d1d', lineHeight: 1.6 }}>
        Your safety comes first. Tap "Got it" only after you've called 911 and the area is safe to enter.
      </div>
    </div>
  )
}

function SummaryBody({ answers }: { answers: Answers }) {
  const lines: { label: string; value: string }[] = []
  if (answers.damageType)   lines.push({ label: 'Type',     value: damageTypeLabel(answers.damageType) })
  if (answers.startedWhen)  lines.push({ label: 'When',     value: whenLabel(answers.startedWhen) })
  if (answers.scope)        lines.push({ label: 'Scope',    value: scopeLabel(answers.scope) })
  if (answers.address)      lines.push({ label: 'Address',  value: [answers.address, answers.city, answers.zip].filter(Boolean).join(', ') })
  if (answers.insurance)    lines.push({ label: 'Insurance', value: answers.insurance === 'yes' ? `Yes${answers.insuranceCarrier ? ` (${answers.insuranceCarrier})` : ''}` : answers.insurance === 'no' ? 'No' : 'Not sure yet' })
  if (answers.name)         lines.push({ label: 'Name',     value: answers.name })
  if (answers.phone)        lines.push({ label: 'Phone',    value: answers.phone })
  if (answers.email)        lines.push({ label: 'Email',    value: answers.email })

  return (
    <div>
      {/* Highlights row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        background: '#fff7ed', border: '1px solid #fed7aa',
        borderRadius: 12, padding: '14px 16px', marginBottom: 18,
      }}>
        {[
          { icon: Clock,       text: '60-min metro arrival' },
          { icon: ShieldCheck, text: 'Applied to project' },
          { icon: MapPin,      text: 'Local technician' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a3412', fontSize: '0.74rem', fontWeight: 700 }}>
            <Icon size={13} color="#ea580c" />
            {text}
          </div>
        ))}
      </div>

      <div style={{ background: '#fafaf7', borderRadius: 12, border: '1px solid #ececec', overflow: 'hidden' }}>
        {lines.map((l, i) => (
          <div key={l.label} style={{
            display: 'flex', justifyContent: 'space-between', gap: 16,
            padding: '11px 14px',
            borderTop: i === 0 ? 'none' : '1px solid #ececec',
            fontSize: '0.86rem',
          }}>
            <span style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.06em' }}>{l.label}</span>
            <span style={{ color: '#0a0e1a', fontWeight: 600, textAlign: 'right', flex: 1, marginLeft: 12, lineHeight: 1.4 }}>{l.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9ca3af', fontSize: '0.78rem', marginTop: 18 }}>
        <Phone size={11} />
        Or call us directly: <a href="tel:+15555555555" style={{ color: '#ea580c', fontWeight: 700 }}>(555) 555-5555</a>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.74rem', fontWeight: 700,
  color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
}

function primaryBtnStyle(busy: boolean, disabled = false): React.CSSProperties {
  const inactive = busy || disabled
  return {
    flex: 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: inactive ? '#fed7aa' : 'linear-gradient(135deg, #f97316, #ea580c)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 18px',
    fontWeight: 800, fontSize: '0.92rem', letterSpacing: '-0.01em',
    cursor: inactive ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    boxShadow: inactive ? 'none' : '0 6px 18px rgba(249,115,22,0.3)',
  }
}

function damageTypeLabel(v: string): string {
  return ({
    water:'Water damage', fire:'Fire / smoke', mold:'Mold',
    asbestos:'Asbestos', biohazard:'Biohazard', structural:'Structural', other:'Other',
  } as Record<string, string>)[v] ?? v
}
function whenLabel(v: string): string {
  return ({
    just: 'Just happened', today: 'Earlier today',
    recent: 'In the last day', days: 'Days ago',
  } as Record<string, string>)[v] ?? v
}
function scopeLabel(v: string): string {
  return ({
    room: 'Single room', multi: 'Multiple rooms',
    whole: 'Whole property', unsure: 'Unsure',
  } as Record<string, string>)[v] ?? v
}
