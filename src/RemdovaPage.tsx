import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Phone, Mail, MapPin, Menu, X, Clock, Shield, Star,
  Droplets, Wind, Flame, AlertTriangle, Wrench, CheckCircle,
  ArrowRight, ChevronDown, Award, Users, ThumbsUp,
  Facebook, Instagram, Twitter, Youtube, Linkedin, Info, Zap,
} from 'lucide-react'
import BookingModal from './components/BookingModal'

// ── Images (Unsplash CDN) ─────────────────────────────────────────────────────
const IMG = {
  hero:       'https://plus.unsplash.com/premium_photo-1751728435152-2017b8349c96?auto=format&fit=crop&w=1800&q=85',
  waterDmg:   'https://plus.unsplash.com/premium_photo-1751678866419-6a02eebba957?auto=format&fit=crop&w=700&q=80',
  moldRoom:   'https://images.pexels.com/photos/18302377/pexels-photo-18302377.jpeg?auto=compress&cs=tinysrgb&w=700&h=400&fit=crop',
  fireDmg:    'https://images.unsplash.com/photo-1593091285708-8dc58f9ff4b5?auto=format&fit=crop&w=700&q=80',
  biohazard:  'https://plus.unsplash.com/premium_photo-1663090722153-120cf71c908d?auto=format&fit=crop&w=700&q=80',
  structural: 'https://plus.unsplash.com/premium_photo-1661958174732-9374d24f827c?auto=format&fit=crop&w=700&q=80',
  insurance:  'https://plus.unsplash.com/premium_photo-1661776260388-f5d1b14ce8a2?auto=format&fit=crop&w=700&q=80',
  team:       'https://plus.unsplash.com/premium_photo-1683133229999-3c3fd3d4cd36?auto=format&fit=crop&w=900&q=80',
  oregon:     'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
}

// ── Config ────────────────────────────────────────────────────────────────────
const PHONE      = '(555) 555-5555'
const PHONE_HREF = 'tel:+15555555555'
const EMAIL      = 'info@remdova.com'

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Services',     href: '#services' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'About',        href: '#about' },
  { label: 'Areas',        href: '#areas' },
  { label: 'Contact',      href: '#contact' },
]

// ── Rotating emergency types ──────────────────────────────────────────────────
const EMERGENCY_TYPES = [
  'Water Damage',
  'Fire Damage',
  'Mold Remediation',
  'Asbestos Removal',
  'Biohazard Cleanup',
  'Structural Repair',
]

// ── Animation helpers ─────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.09, ease: 'easeOut' as const },
  }),
}
const fadeIn = {
  hidden:  { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.55, delay: i * 0.08 },
  }),
}

// ── Services data ─────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: Droplets,
    title: 'Water Damage',
    desc: 'Rapid extraction, drying, and dehumidification to stop structural damage before it spreads. We work directly with your insurance.',
    img: IMG.waterDmg,
    color: '#2563eb',
  },
  {
    icon: Wind,
    title: 'Mold Mitigation',
    desc: 'Certified mold inspection, containment, and safe removal using EPA-approved protocols to restore healthy indoor air quality.',
    img: IMG.moldRoom,
    color: '#16a34a',
  },
  {
    icon: Flame,
    title: 'Fire & Smoke Damage',
    desc: 'Full-spectrum fire damage restoration: smoke odor removal, soot cleanup, and structural repairs from a single crew.',
    img: IMG.fireDmg,
    color: '#ea580c',
  },
  {
    icon: AlertTriangle,
    title: 'Asbestos & Biohazard',
    desc: 'Licensed asbestos abatement and biohazard remediation handled with full safety protocols and proper disposal.',
    img: IMG.biohazard,
    color: '#7c3aed',
  },
  {
    icon: Wrench,
    title: 'Structural Repairs',
    desc: 'Post-remediation rebuild and structural repair, from framing to finish. One contractor, start to finish.',
    img: IMG.structural,
    color: '#0891b2',
  },
  {
    icon: Shield,
    title: 'Insurance Coordination',
    desc: "We've worked with every major carrier. We document everything, communicate directly with adjusters, and fight for your full claim.",
    img: IMG.insurance,
    color: '#b45309',
  },
]

// ── Service areas ─────────────────────────────────────────────────────────────
const AREAS = [
  'Lake Oswego', 'Beaverton', 'Portland', 'Hillsboro',
  'Tualatin', 'Tigard', 'West Linn', 'Wilsonville',
  'Sherwood', 'Newberg', 'McMinnville', 'Gresham',
]

// Match a raw city string against the service area list (case-insensitive).
// Returns the canonical spelling from AREAS, or null if not served.
function matchServiceArea(city: string): string | null {
  const normalized = city.trim().toLowerCase()
  return AREAS.find(a => a.toLowerCase() === normalized) ?? null
}

// Resolve the visitor's city via IP geolocation.
// On Vercel, swap this for: new Headers(request.headers).get('x-vercel-ip-city')
async function resolveCity(): Promise<string | null> {
  try {
    const res = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = await res.json() as { city?: string }
    return data.city ?? null
  } catch {
    return null
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '10+', label: 'Years Experience' },
  { value: '60-Min', label: 'Portland Metro Response' },
  { value: '100%', label: 'Licensed & Insured' },
]

// ── Why Us ────────────────────────────────────────────────────────────────────
const WHY = [
  {
    icon: Clock,
    title: '60-Minute Response',
    desc: 'When disaster strikes, every minute counts. Our crews are on-site in under an hour anywhere in the Portland metro.',
  },
  {
    icon: Award,
    title: '10 Years of Expertise',
    desc: 'A decade of hands-on restoration experience in the Pacific Northwest. We know Oregon homes inside and out.',
  },
  {
    icon: Users,
    title: 'Local, Not a Call Center',
    desc: 'You get a real local team, not a franchise dispatch. The same faces from first call to final walkthrough.',
  },
  {
    icon: ThumbsUp,
    title: 'Insurance-Approved Process',
    desc: 'We document everything from the start. Our process is designed to maximize your claim, not minimize our work.',
  },
]

// ── How it works ──────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Book Emergency Service',
    desc: 'Pay the $95 emergency response fee online. This locks in our 60-minute Portland-metro response and covers initial dispatch.',
  },
  {
    n: '02',
    title: 'Quick Online Intake',
    desc: 'While our crew is en route, you fill out a 90-second intake form: name, address, contact, insurance details. We arrive ready to work.',
  },
  {
    n: '03',
    title: '60-Minute On-Site Response',
    desc: 'A real local technician arrives within the hour. We assess the damage and start initial mitigation immediately — shop vac, fans, dehumidifiers — to stop the loss from spreading.',
  },
  {
    n: '04',
    title: 'Transparent Quote Before We Build',
    desc: 'After mitigation, we walk you through next steps on iPad, give you a written estimate, and only proceed with restoration once you approve. No surprise invoices.',
  },
]

// ── Pricing ───────────────────────────────────────────────────────────────────
const PRICING = [
  {
    icon: Droplets,
    title: 'Water Damage',
    sub: 'Extraction, drying & dehumidification',
    range: '$1,500 - $12,000+',
    tiers: ['Minor (1 room, caught early): $1,500 - $4,000', 'Moderate (multi-room): $4,000 - $9,000', 'Severe (structural involvement): $9,000+'],
    color: '#2563eb',
  },
  {
    icon: Wind,
    title: 'Mold Remediation',
    sub: 'Containment, removal & air testing',
    range: '$1,200 - $8,000+',
    tiers: ['Small area (<10 sq ft): $1,200 - $2,500', 'Medium (10-100 sq ft): $2,500 - $5,500', 'Extensive (structural): $5,500+'],
    color: '#16a34a',
  },
  {
    icon: Flame,
    title: 'Fire & Smoke Damage',
    sub: 'Soot removal, odor treatment & repair',
    range: '$3,500 - $25,000+',
    tiers: ['Single room cleanup: $3,500 - $8,000', 'Multi-room / floor: $8,000 - $18,000', 'Whole structure: $18,000+'],
    color: '#ea580c',
  },
  {
    icon: AlertTriangle,
    title: 'Asbestos Removal',
    sub: 'Licensed abatement & disposal',
    range: '$1,500 - $10,000+',
    tiers: ['Testing & inspection: $300 - $800', 'Small abatement job: $1,500 - $4,000', 'Full abatement project: $4,000+'],
    color: '#7c3aed',
  },
  {
    icon: AlertTriangle,
    title: 'Biohazard Cleanup',
    sub: 'Full PPE, disinfection & disposal',
    range: '$2,500 - $12,000+',
    tiers: ['Contained scene: $2,500 - $5,000', 'Multi-room / trauma: $5,000 - $9,000', 'Extensive remediation: $9,000+'],
    color: '#dc2626',
  },
  {
    icon: Wrench,
    title: 'Structural Repair',
    sub: 'Post-remediation rebuild',
    range: '$2,000 - $30,000+',
    tiers: ['Drywall / flooring only: $2,000 - $6,000', 'Framing & finishes: $6,000 - $15,000', 'Full structural rebuild: $15,000+'],
    color: '#0891b2',
  },
]

// ── Logo mark ────────────────────────────────────────────────────────────────
function DropletIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.22)} viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 1C9 1 1 8.5 1 13.5C1 18.09 4.58 22 9 22C13.42 22 17 18.09 17 13.5C17 8.5 9 1 9 1Z" fill="white" fillOpacity="0.95"/>
      <path d="M5.5 15C5.5 15 5 17.5 7.5 18.5" stroke="rgba(249,115,22,0.45)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

const WORDMARK_STYLE: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: '-0.03em',
  background: 'linear-gradient(90deg, #ffffff 20%, #fdba74 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RemdovaPage() {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [scrolled, setScrolled]         = useState(false)
  const [emergencyIdx, setEmergencyIdx] = useState(0)
  const [visitorCity, setVisitorCity]   = useState<string | null>(null)
  const [bookingOpen, setBookingOpen]   = useState(false)
  const [showBooked, setShowBooked]     = useState(false)

  // Stripe redirects back to /?booked=1 on successful checkout. Show a
  // confirmation banner and clean the param so it doesn't persist on reload.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('booked') === '1') {
      setShowBooked(true)
      params.delete('booked')
      const cleaned = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash
      window.history.replaceState({}, '', cleaned)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setEmergencyIdx(i => (i + 1) % EMERGENCY_TYPES.length)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    resolveCity().then(city => {
      if (city) setVisitorCity(matchServiceArea(city))
    })
  }, [])

  const heroRef  = useRef<HTMLElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY       = useTransform(heroProgress, [0, 1], ['0%', '25%'])
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    document.body.style.background = '#f9f7f4'
    document.body.style.color = '#111827'
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])


  return (
    <div style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", color: '#111827', background: '#f9f7f4', overflowX: 'hidden' }}>
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />

      <AnimatePresence>
        {showBooked && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)',
              zIndex: 150, maxWidth: 560, width: 'calc(100% - 32px)',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              borderRadius: 14, padding: '16px 20px', color: '#fff',
              boxShadow: '0 16px 48px rgba(22,163,74,0.4)',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}
          >
            <div style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 2 }}>You're booked. We're rolling.</div>
              <div style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
                Check your email for confirmation. A technician will be in touch within 60 minutes for the Portland metro.
              </div>
            </div>
            <button onClick={() => setShowBooked(false)} aria-label="Dismiss"
              style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer', padding: 4, flexShrink: 0,
              }}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; }
        a:hover { opacity: 0.82; }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-burger { display: none; background: none; border: none; cursor: pointer; padding: 6px; line-height: 0; }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          70%  { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        .pulse-ring::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: 50%;
          background: #f97316;
          animation: pulse-ring 1.8s ease-out infinite;
        }
        @keyframes kenburns {
          0%   { transform: scale(1.06) translate(0,0); }
          100% { transform: scale(1.13) translate(-2%,-1%); }
        }
        .kb { animation: kenburns 18s ease-in-out infinite alternate; }
        .svc-card:hover .svc-img img { transform: scale(1.06); }
        .svc-img img { transition: transform 0.55s ease; }
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-burger { display: block !important; }
          .hero-title { font-size: clamp(2.2rem, 8vw, 3.8rem) !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .why-grid { grid-template-columns: 1fr 1fr !important; }
          .areas-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .content-section { padding-top: 64px !important; padding-bottom: 64px !important; }
          .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .reviews-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .footer-nav { justify-content: flex-start !important; }
          .footer-contact-col { text-align: left !important; }
          .footer-contact-col a { justify-content: flex-start !important; }
          .about-badge { position: static !important; display: inline-block; margin-top: 16px; }
          .hero-pill { flex-wrap: wrap !important; }
        }
        @media (max-width: 480px) {
          .why-grid { grid-template-columns: 1fr !important; }
          .areas-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Nav ── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? 'rgba(10,14,26,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
          transition: 'background 0.35s ease, border-color 0.35s ease',
          padding: '0 5%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 68,
        }}
      >
        {/* Logo */}
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DropletIcon size={17} />
          </div>
          <span style={{ ...WORDMARK_STYLE, fontSize: '1.2rem' }}>Remdova</span>
        </a>

        {/* Desktop links */}
        <div className="nav-links" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 500 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.85)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f97316')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            >{label}</a>
          ))}
          <a href={PHONE_HREF} style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff', padding: '9px 20px', borderRadius: 8,
            fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Phone size={14} />
            {PHONE}
          </a>
        </div>

        {/* Burger */}
        <button className="nav-burger" onClick={() => setMenuOpen(v => !v)} style={{ color: '#fff' }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99,
              background: 'rgba(10,14,26,0.98)', backdropFilter: 'blur(12px)',
              padding: '20px 5% 28px', display: 'flex', flexDirection: 'column', gap: 18,
            }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <a key={label} href={href}
                onClick={() => setMenuOpen(false)}
                style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14 }}
              >{label}</a>
            ))}
            <a href={PHONE_HREF} style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff', padding: '13px 20px', borderRadius: 10,
              fontWeight: 700, textAlign: 'center', fontSize: '1rem',
            }}>Call Now: {PHONE}</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section id="top" ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Base BG */}
        <motion.div style={{ y: heroY, position: 'absolute', inset: '-8% 0', zIndex: 0 }}>
          <div className="kb" style={{ width: '100%', height: '100%', backgroundImage: `url(${IMG.hero})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        </motion.div>
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,14,26,0.88) 55%, rgba(10,14,26,0.4) 100%)', zIndex: 1 }} />

        <motion.div style={{ opacity: heroOpacity, position: 'relative', zIndex: 2, padding: '120px 5% 80px', maxWidth: 780 }}>
          {/* Geo statement */}
          <AnimatePresence>
            {visitorCity && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}
              >
                <MapPin size={15} color="#4ade80" strokeWidth={2.5} />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
                  Your <span style={{ color: '#fff', fontWeight: 700 }}>{visitorCity}</span> experts in restoration services
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 24/7 CTA */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0} style={{ marginBottom: 28 }}>
            <a href={PHONE_HREF} className="hero-pill" style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.35)',
              borderRadius: 12, padding: '13px 20px',
              textDecoration: 'none',
            }}>
              <span style={{ position: 'relative', display: 'inline-block', width: 9, height: 9, flexShrink: 0 }} className="pulse-ring">
                <span style={{ display: 'block', width: 9, height: 9, borderRadius: '50%', background: '#f97316' }} />
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem', fontWeight: 500 }}>
                Emergency? We respond in under 60 minutes.
              </span>
              <span style={{ color: '#f97316', fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 5 }}>
                Call Now <ArrowRight size={15} strokeWidth={2.5} />
              </span>
            </a>
          </motion.div>

          <motion.h1
            className="hero-title"
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            style={{ fontSize: 'clamp(2.8rem, 5vw, 4.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: 24 }}
          >
            When disaster strikes,<br />
            <span style={{ display: 'inline-block', position: 'relative' }}>
              we restore
            </span>{' '}
            <span style={{ display: 'inline-block', position: 'relative', minWidth: '2ch', verticalAlign: 'bottom', overflow: 'hidden' }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={emergencyIdx}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.42, ease: 'easeInOut' }}
                  style={{ display: 'inline-block', color: '#f97316', whiteSpace: 'nowrap' }}
                >
                  {EMERGENCY_TYPES[emergencyIdx]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}
          >
            {visitorCity ? `${visitorCity}'s` : "Oregon's"} trusted emergency restoration team. Water damage, mold, fire, asbestos, and structural repair. Handled fast, handled right. One crew. No runaround.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}
          >
            <button onClick={() => setBookingOpen(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff', padding: '16px 32px', borderRadius: 12,
              fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em',
              boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Zap size={18} />
              Book Emergency Service · $95
            </button>
            <a href={PHONE_HREF} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '2px solid rgba(255,255,255,0.3)', color: '#fff',
              padding: '14px 26px', borderRadius: 12, fontWeight: 600, fontSize: '1rem',
            }}>
              <Phone size={16} /> Or call us
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 48 }}
          >
            {['Licensed & Insured', 'Insurance Approved', 'IICRC Certified', 'Oregon Family-Owned'].map(badge => (
              <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 500 }}>
                <CheckCircle size={14} color="#4ade80" />
                {badge}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 2, color: 'rgba(255,255,255,0.4)' }}
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* ── Emergency Strip ── */}
      <div style={{
        background: 'linear-gradient(90deg, #ea580c, #f97316)',
        padding: '18px 5%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: '10px 32px',
      }}>
        {[
          { icon: Clock, text: '60-Min Portland Metro Response' },
          { icon: Phone, text: PHONE },
          { icon: MapPin, text: 'Portland Metro Area' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
            <Icon size={16} />
            {text}
          </div>
        ))}
        <a href={PHONE_HREF} style={{
          background: '#fff', color: '#ea580c', padding: '8px 22px', borderRadius: 8,
          fontWeight: 800, fontSize: '0.88rem',
        }}>Call Now</a>
      </div>

      {/* ── Stats ── */}
      <section style={{ background: '#0a0e1a', padding: '72px 5%' }}>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 720, margin: '0 auto' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.value}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              style={{ textAlign: 'center', padding: '32px 20px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}
            >
              <div style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, color: '#f97316', letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', fontWeight: 500, marginTop: 6 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="content-section" style={{ padding: '100px 5%', background: '#f9f7f4' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            What We Do
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#0a0e1a', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Full-Spectrum Restoration Services
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            From the moment disaster hits to the final walkthrough, we handle every stage so you don't have to coordinate between contractors.
          </p>
        </motion.div>

        <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1160, margin: '0 auto' }}>
          {SERVICES.map((svc, i) => (
            <motion.div key={svc.title}
              className="svc-card"
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 3}
              style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', cursor: 'default' }}
            >
              <div className="svc-img" style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                <img src={svc.img} alt={svc.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(10,14,26,0.6) 0%, transparent 60%)` }} />
                <div style={{
                  position: 'absolute', bottom: 14, left: 14,
                  background: svc.color, borderRadius: 8, padding: '7px 9px', display: 'flex',
                }}>
                  <svc.icon size={17} color="#fff" />
                </div>
              </div>
              <div style={{ padding: '22px 24px 26px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0a0e1a', marginBottom: 10 }}>{svc.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.92rem', lineHeight: 1.65 }}>{svc.desc}</p>
                <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: svc.color, fontWeight: 700, fontSize: '0.85rem', marginTop: 16 }}>
                  Learn more <ArrowRight size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="content-section" style={{ padding: '100px 5%', background: '#0a0e1a' }}>
        <div className="about-grid" style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              About Remdova
            </div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3vw, 2.7rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 24, lineHeight: 1.15 }}>
              10 years of restoration expertise, built for Oregon.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.8, marginBottom: 20 }}>
              We're not a national franchise or a call-center dispatch. Remdova was founded by a restoration professional with over a decade of hands-on experience rebuilding Oregon homes and businesses, and we operate with a simple principle: do it right the first time.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.8, marginBottom: 36 }}>
              When you call us, you get the same local team from first inspection to final cleanup. No subcontractor roulette, no surprise invoices, no runaround with your insurance company.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {['IICRC Certified', 'Oregon Licensed', 'Fully Insured', 'EPA Approved'].map(b => (
                <span key={b} style={{
                  background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
                  color: '#fb923c', padding: '6px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600,
                }}>{b}</span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            style={{ position: 'relative' }}
          >
            <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3' }}>
              <img src={IMG.team} alt="Remdova restoration team" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,14,26,0.25)', borderRadius: 20 }} />
            </div>
            {/* Floating badge */}
            <div className="about-badge" style={{
              position: 'absolute', bottom: -20, left: -20,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              borderRadius: 16, padding: '20px 26px',
              boxShadow: '0 12px 40px rgba(249,115,22,0.35)',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>10+</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Years in Oregon</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="content-section" style={{ padding: '100px 5%', background: '#fff' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Why Remdova
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#0a0e1a', letterSpacing: '-0.03em' }}>
            The Remdova Difference
          </h2>
        </motion.div>

        <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, maxWidth: 1160, margin: '0 auto' }}>
          {WHY.map((item, i) => (
            <motion.div key={item.title}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              style={{ textAlign: 'center', padding: '32px 20px' }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: 16, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <item.icon size={26} color="#f97316" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0a0e1a', marginBottom: 10 }}>{item.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.7 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="content-section" style={{ padding: '100px 5%', background: '#f9f7f4' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            How It Works
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#0a0e1a', letterSpacing: '-0.03em', marginBottom: 16 }}>
            From emergency to estimate, in four steps.
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
            We've designed our intake to get a real technician to your door fast — and to make sure you know exactly what to expect before any major work begins.
          </p>
        </motion.div>

        <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1160, margin: '0 auto' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.n}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              style={{
                background: '#fff', borderRadius: 16, padding: '28px 24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)', position: 'relative',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{
                position: 'absolute', top: -14, left: 22,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff', fontWeight: 900, fontSize: '0.78rem',
                padding: '5px 12px', borderRadius: 100, letterSpacing: '0.05em',
              }}>{step.n}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0a0e1a', marginTop: 14, marginBottom: 10, letterSpacing: '-0.01em' }}>{step.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.7 }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="content-section" style={{ padding: '100px 5%', background: '#0a0e1a' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 16 }}
        >
          <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Transparent Pricing
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>
            What to Expect
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Every job is different, but we believe you deserve a ballpark before anyone shows up. These are typical starting ranges (not quotes) based on real Oregon restoration jobs.
          </p>
        </motion.div>

        {/* Emergency response callout */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ maxWidth: 1160, margin: '40px auto 32px', background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 16, padding: '28px 32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ color: '#f97316', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Emergency Response Fee</div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', marginBottom: 8 }}>$95 flat</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem', lineHeight: 1.65, margin: 0 }}>
              Locks in our 60-minute Portland-metro response, covers dispatch, and is applied to your full project cost. Pay online to dispatch — we're rolling within minutes.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220 }}>
            {['$95 applied to your final project cost', '60-minute Portland metro arrival', 'Full estimate provided before any major work'].map(pt => (
              <div key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'rgba(255,255,255,0.75)', fontSize: '0.86rem' }}>
                <CheckCircle size={14} color="#4ade80" style={{ marginTop: 2, flexShrink: 0 }} />
                {pt}
              </div>
            ))}
            <button onClick={() => setBookingOpen(true)} style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff', padding: '11px 18px', borderRadius: 10,
              fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              <Zap size={14} /> Book emergency service
            </button>
          </div>
        </motion.div>

        {/* Service price cards */}
        <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1160, margin: '0 auto 40px' }}>
          {PRICING.map((svc, i) => (
            <motion.div key={svc.title}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 3}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '26px 24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${svc.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svc.icon size={18} color={svc.color} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{svc.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{svc.sub}</div>
                </div>
              </div>
              <div style={{ color: '#f97316', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em', marginBottom: 14 }}>{svc.range}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {svc.tiers.map(t => (
                  <div key={t} style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid rgba(255,255,255,0.1)` }}>{t}</div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px' }}
        >
          <Info size={15} color="rgba(255,255,255,0.35)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', lineHeight: 1.65, margin: 0 }}>
            All ranges are estimates based on typical Oregon jobs and are not a quote or guarantee. Final costs depend on the extent of damage, materials, access, and insurance coverage. We provide a written estimate before any work begins. Insurance claims may cover part or all of the cost. We work directly with your adjuster.
          </p>
        </motion.div>
      </section>

      {/* ── Service Areas ── */}
      <section id="areas" className="content-section" style={{ padding: '100px 5%', background: '#f9f7f4', position: 'relative', overflow: 'hidden' }}>
        {/* BG Oregon landscape */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${IMG.oregon})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1160, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <div style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Coverage Area
            </div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#0a0e1a', letterSpacing: '-0.03em', marginBottom: 16 }}>
              Serving Portland Metro & Beyond
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: 540, margin: '0 auto' }}>
              <span style={{ color: '#0a0e1a', fontWeight: 700 }}>60-minute response guarantee</span> across the Portland metro. Same-day service in the greater Willamette Valley — exact response times depend on distance.
            </p>
          </motion.div>

          <div className="areas-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {AREAS.map((area, i) => (
              <motion.div key={area}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i % 4}
                style={{
                  background: '#fff', borderRadius: 12, padding: '16px 18px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb',
                }}
              >
                <MapPin size={16} color="#f97316" />
                <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#111827' }}>{area}</span>
              </motion.div>
            ))}
          </div>

          {/* Greater Willamette Valley: extended coverage, no 60-min guarantee */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{
              background: '#fff', borderRadius: 12, padding: '18px 22px', marginBottom: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MapPin size={16} color="#9ca3af" />
              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#374151' }}>Greater Willamette Valley</span>
            </div>
            <span style={{
              background: '#f3f4f6', color: '#6b7280', fontSize: '0.78rem', fontWeight: 600,
              padding: '4px 12px', borderRadius: 100,
            }}>Extended service area, response times vary</span>
          </motion.div>

          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.88rem' }}
          >
            Not on the list? Call us. We likely cover your area. <a href={PHONE_HREF} style={{ color: '#f97316', fontWeight: 700 }}>{PHONE}</a>
          </motion.p>
        </div>
      </section>

      {/* ── First Reviews Coming In ── */}
      <section className="content-section" style={{ padding: '100px 5%', background: '#0a0e1a' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{ color: '#f97316', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Just Getting Started
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Be one of our first 5-star reviews
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Remdova is a brand-new local company — we won't fake reviews to look bigger than we are. We'd rather earn yours. We're actively serving our first customers in the Portland metro and posting verified Google reviews as they come in.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{
            maxWidth: 720, margin: '0 auto',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '36px 32px', textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', gap: 6, marginBottom: 18, justifyContent: 'center' }}>
            {Array(5).fill(null).map((_, j) => <Star key={j} size={20} color="#f97316" fill="#f97316" />)}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.75, margin: '0 0 24px' }}>
            We're committing to the same standard our consultant taught us: <span style={{ color: '#fff', fontWeight: 600 }}>set clear expectations, then meet them every time.</span> If we earn your trust on a job, we'd appreciate a real Google review. If we don't, tell us why and we'll make it right.
          </p>
          <a href={PHONE_HREF} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff', padding: '12px 24px', borderRadius: 10,
            fontWeight: 800, fontSize: '0.92rem',
          }}>
            <Phone size={14} /> Call us to book the first job
          </a>
        </motion.div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="content-section" style={{ padding: '100px 5%', background: '#f9f7f4' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <div style={{ color: '#ea580c', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Get In Touch
            </div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#0a0e1a', letterSpacing: '-0.03em', marginBottom: 12 }}>
              Emergency? Don't wait. Call now.
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>Free assessment. No obligation. We'll come to you.</p>
          </motion.div>

          <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            {/* Contact info */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <a href={PHONE_HREF} style={{
                display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                borderRadius: 16, padding: '24px 28px',
                boxShadow: '0 8px 32px rgba(249,115,22,0.3)',
              }}>
                <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Phone size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>Emergency Line</div>
                  <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{PHONE}</div>
                </div>
              </a>

              {[
                { icon: Mail, label: 'Email', value: EMAIL, href: `mailto:${EMAIL}` },
                { icon: MapPin, label: 'Service Area', value: 'Portland Metro, Oregon', href: '#areas' },
                { icon: Clock, label: 'Response time', value: '60-min in Portland metro · Same-day Willamette Valley', href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                  <div style={{ width: 44, height: 44, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                    <Icon size={18} color="#f97316" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    {href
                      ? <a href={href} style={{ color: '#111827', fontWeight: 600, fontSize: '0.95rem' }}>{value}</a>
                      : <span style={{ color: '#111827', fontWeight: 600, fontSize: '0.95rem' }}>{value}</span>
                    }
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Form */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}>
              <form
                onSubmit={e => { e.preventDefault(); alert('Thanks! We\'ll be in touch within the hour.') }}
                style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0a0e1a', marginBottom: 24 }}>Send Us a Message</h3>
                {[
                  { id: 'name', label: 'Full Name', placeholder: 'John Smith', type: 'text' },
                  { id: 'phone', label: 'Phone Number', placeholder: '(555) 555-5555', type: 'tel' },
                  { id: 'email', label: 'Email Address', placeholder: 'you@email.com', type: 'email' },
                ].map(f => (
                  <div key={f.id} style={{ marginBottom: 18 }}>
                    <label htmlFor={f.id} style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                    <input id={f.id} type={f.type} placeholder={f.placeholder} required style={{
                      width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10,
                      fontSize: '0.92rem', outline: 'none', color: '#111827', background: '#f9fafb',
                      transition: 'border-color 0.2s',
                    }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 22 }}>
                  <label htmlFor="message" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Tell Us What Happened</label>
                  <textarea id="message" placeholder="Describe the damage or issue..." rows={4} style={{
                    width: '100%', padding: '11px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10,
                    fontSize: '0.92rem', outline: 'none', color: '#111827', background: '#f9fafb',
                    resize: 'vertical', fontFamily: 'inherit',
                  }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#f97316')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>
                <button type="submit" style={{
                  width: '100%', background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800,
                  fontSize: '1rem', border: 'none', cursor: 'pointer', letterSpacing: '-0.01em',
                }}>
                  Request Free Assessment →
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#060810', padding: '56px 5% 32px', color: 'rgba(255,255,255,0.45)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'start', gap: 40, marginBottom: 40, flexWrap: 'wrap' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DropletIcon size={14} />
                </div>
                <div>
                  <span style={{ ...WORDMARK_STYLE, fontSize: '1.05rem', display: 'block' }}>Remdova</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', display: 'block', marginTop: 1 }}>Restoration</span>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.82rem', lineHeight: 1.65, maxWidth: 200, margin: '0 0 18px' }}>
                Oregon's emergency restoration team. 60-minute Portland metro response.
              </p>
              {/* Social icons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { icon: Facebook,  href: '#', label: 'Facebook' },
                  { icon: Instagram, href: '#', label: 'Instagram' },
                  { icon: Twitter,   href: '#', label: 'Twitter' },
                  { icon: Youtube,   href: '#', label: 'YouTube' },
                  { icon: Linkedin,  href: '#', label: 'LinkedIn' },
                ].map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} aria-label={label} style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.45)', transition: 'background 0.2s, color 0.2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(249,115,22,0.2)'; (e.currentTarget as HTMLAnchorElement).style.color = '#f97316' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.45)' }}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Nav links */}
            <div className="footer-nav" style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', fontSize: '0.85rem', paddingTop: 4 }}>
              {NAV_LINKS.map(({ label, href }) => (
                <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.45)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f97316')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                >{label}</a>
              ))}
            </div>

            {/* Contact */}
            <div className="footer-contact-col" style={{ textAlign: 'right' }}>
              <a href={PHONE_HREF} style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end', marginBottom: 8 }}>
                <Phone size={14} color="#f97316" />{PHONE}
              </a>
              <a href={`mailto:${EMAIL}`} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
                <Mail size={13} />{EMAIL}
              </a>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem' }}>
            <span>© {new Date().getFullYear()} Remdova. All rights reserved.</span>
            <span>Emergency Restoration · Portland Metro · Oregon</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
