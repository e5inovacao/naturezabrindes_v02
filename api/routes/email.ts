import express, { Request, Response } from 'express'

const router = express.Router()

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

function buildEmailRequest(payload: any) {
  const senderEmail = 'naturezabrindes@naturezabrindes.com.br'
  const senderName = 'Natureza Brindes'
  const subject = payload.subject || 'Confirmação de Solicitação de Orçamento - Natureza Brindes'
  const htmlContent = payload.htmlContent || '<p>Recebemos sua solicitação.</p>'
  const to = Array.isArray(payload.to)
    ? payload.to
    : [{ email: payload.clientEmail, name: payload.clientName }]

  return {
    sender: { name: senderName, email: senderEmail },
    to,
    subject,
    htmlContent,
  }
}

router.post('/quote-confirmation', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'BREVO_API_KEY not configured' })
    }

    const emailRequest = buildEmailRequest(req.body)

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(emailRequest),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      return res.status(response.status).json({ success: false, error: errorData })
    }

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal email error' })
  }
})

router.post('/confirmation', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'BREVO_API_KEY not configured' })
    }

    const emailRequest = buildEmailRequest(req.body)

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(emailRequest),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      return res.status(response.status).json({ success: false, error: errorData })
    }

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal email error' })
  }
})

export default router

