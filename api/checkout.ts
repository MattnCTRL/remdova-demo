import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { Resend } from 'resend'

// Creates a Stripe Checkout session for the $95 emergency dispatch fee and
// emails Michael with the intake details immediately so he can start
// dispatching even before payment finalizes. Stripe redirects back to
// /?booked=1 on success and /?cancelled=1 on cancel.

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-09-30.acacia' as any })
  : null

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const NOTIFY_TO = process.env.MICHAEL_EMAIL ?? 'info@remdova.com'

type Intake = {
  name: string; phone: string; email: string
  address: string; city: string; zip: string
  damageType: string; damageDesc: string
  insurance: string; policyHolder?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!stripe) {
    return res.status(500).json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in the Vercel project.',
    })
  }

  const intake = req.body as Intake
  const requiredFields: (keyof Intake)[] = ['name', 'phone', 'email', 'address', 'damageType', 'damageDesc']
  for (const f of requiredFields) {
    if (!intake[f] || !String(intake[f]).trim()) {
      return res.status(400).json({ error: `Missing field: ${f}` })
    }
  }

  const origin = (req.headers.origin as string)
    ?? (req.headers.host ? `https://${req.headers.host}` : 'https://remdova.com')

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: intake.email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: 9500,
          product_data: {
            name: 'Remdova Emergency Dispatch',
            description: '$95 emergency response fee — locks in 60-minute Portland-metro response and is applied to your final project cost.',
          },
        },
      }],
      // Stripe metadata is the cleanest place to keep intake info — we can
      // pull it back via webhook later if/when we need to.
      metadata: {
        name:        intake.name,
        phone:       intake.phone,
        email:       intake.email,
        address:     intake.address,
        city:        intake.city ?? '',
        zip:         intake.zip ?? '',
        damageType:  intake.damageType,
        damageDesc:  intake.damageDesc.slice(0, 480),
        insurance:   intake.insurance,
        policyHolder: intake.policyHolder ?? '',
      },
      success_url: `${origin}/?booked=1`,
      cancel_url:  `${origin}/?cancelled=1`,
    })

    // Fire-and-forget intake email so Michael sees the lead instantly even
    // before Stripe confirms payment. Failures are logged, not surfaced.
    if (resend) {
      sendIntakeEmail(intake, session.id, session.url).catch(err => {
        console.error('[checkout] Resend send failed:', err)
      })
    }

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
    console.error('[checkout] stripe error:', err)
    return res.status(500).json({ error: err?.message ?? 'Checkout failed' })
  }
}

async function sendIntakeEmail(intake: Intake, sessionId: string, sessionUrl: string | null) {
  if (!resend) return
  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 28px;color:#fff;">
            <div style="font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">New Emergency Booking</div>
            <div style="font-size:22px;font-weight:900;letter-spacing:-0.02em;">${escape(intake.name)} — ${escape(intake.damageType)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#1f2937;line-height:1.6;">
              ${row('Phone',   `<a href="tel:${escape(intake.phone)}" style="color:#ea580c;">${escape(intake.phone)}</a>`)}
              ${row('Email',   `<a href="mailto:${escape(intake.email)}" style="color:#ea580c;">${escape(intake.email)}</a>`)}
              ${row('Address', `${escape(intake.address)}${intake.city ? `, ${escape(intake.city)}` : ''}${intake.zip ? ` ${escape(intake.zip)}` : ''}`)}
              ${row('Damage',  escape(intake.damageType))}
              ${row('Notes',   `<span style="white-space:pre-wrap;">${escape(intake.damageDesc)}</span>`)}
              ${row('Insurance', escape(intake.insurance) + (intake.policyHolder ? ` (policy: ${escape(intake.policyHolder)})` : ''))}
              ${row('Stripe Session', `<code style="font-size:11px;color:#6b7280;">${escape(sessionId)}</code>`)}
            </table>
            ${sessionUrl ? `<p style="font-size:12px;color:#9ca3af;margin:18px 0 0;">Customer is being redirected to Stripe Checkout. They have NOT paid yet — payment status will follow once they complete checkout.</p>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from: 'Remdova Bookings <noreply@remdova.com>',
    to: NOTIFY_TO,
    replyTo: intake.email,
    subject: `🚨 New booking: ${intake.name} — ${intake.damageType}`,
    html,
  })
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;width:110px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${value}</td>
  </tr>`
}

function escape(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!))
}
