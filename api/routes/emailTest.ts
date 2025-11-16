import express, { Request, Response } from 'express'
import { supabaseAdmin } from '../../supabase/server.ts'
import nodemailer from 'nodemailer'

const router = express.Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { to, name = 'Teste', subject, htmlContent } = req.body || {}
    if (!to) return res.status(400).json({ success: false, error: 'Parâmetro to é obrigatório' })

    const host = process.env.SMTP_HOST || 'smtp.zoho.com'
    const port = Number(process.env.SMTP_PORT || 587)
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    if (!user || !pass) return res.status(500).json({ success: false, error: 'Credenciais SMTP ausentes' })

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      authMethod: 'PLAIN',
      tls: { minVersion: 'TLSv1.2', servername: host }
    })

    let outboxId: number | null = null
    try {
      const ins = await supabaseAdmin
        .from('email_outbox')
        .insert({ recipient: to, subject: subject || 'Teste de Envio - Natureza Brindes', template: 'test', payload: { to, name }, status: 'queued' })
        .select('id')
        .single()
      outboxId = ins.data?.id || null
    } catch {}

    const info = await transporter.sendMail({
      from: `Natureza Brindes <${user}>`,
      to: `${name} <${to}>`,
      subject: subject || 'Teste de Envio - Natureza Brindes',
      html: htmlContent || '<div style="font-family:Arial,sans-serif"><h2>Teste de envio</h2><p>Este é um teste de envio do backend.</p></div>'
    })

    try {
      if (outboxId) {
        await supabaseAdmin
          .from('email_outbox')
          .update({ status: 'sent', provider_response: { messageId: (info as any)?.messageId, response: (info as any)?.response }, updated_at: new Date().toISOString() })
          .eq('id', outboxId)
      }
    } catch {}

    return res.status(200).json({ success: true, provider_response: (info as any)?.response, messageId: (info as any)?.messageId })
  } catch (e) {
    try {
      await supabaseAdmin
        .from('email_outbox')
        .insert({ recipient: 'diagnostic', subject: 'smtp_error', template: 'test', payload: { error: e instanceof Error ? { message: e.message, name: e.name, stack: e.stack } : String(e) }, status: 'error' })
    } catch {}
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' })
  }
})

router.get('/preview', async (_req: Request, res: Response) => {
  try {
    const { generateConfirmationEmailHTML } = await import('../utils/emailTemplates.ts')
    const html = generateConfirmationEmailHTML({
      clientName: 'Eduardo Souza',
      clientEmail: 'eduardo@example.com',
      clientPhone: '(22) 22222-2222',
      clientCompany: 'E5 Inovação',
      subject: 'Solicitação de Orçamento',
      message: '- Sacola em juta (240 g/m²) e bolso em 100% algodão (140 gm²): (Qtd: 20) e (Qtd: 40)\n- Garrafa em aço inox 90% reciclado, parede simples 570 mL: (Qtd: 20) e (Qtd: 50) - Cor: Cromado'
    })
    res.status(200).type('text/html').send(html)
  } catch (e) {
    res.status(500).json({ success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' })
  }
})

export default router