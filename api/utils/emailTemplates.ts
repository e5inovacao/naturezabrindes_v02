export interface ConfirmationTemplateData {
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientCompany?: string
  subject?: string
  message?: string
  observations?: string
}

export function generateConfirmationEmailHTML(data: ConfirmationTemplateData): string {
  const currentYear = new Date().getFullYear()
  const rawMsg = (data.message || '').trim()
  const rawObs = (data.observations || '').trim()
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let productsHtml = ''
  if (rawMsg) {
    const cleaned = rawMsg.replace(/^Produtos\s+solicitados\s*:?/i, '')
    const lines = cleaned
      .split(/\n+/)
      .map(s => s.trim())
      .filter(li => li.length > 0 && !/^Produtos\s+(solicitados|selecionados)$/i.test(li))
    if (lines.length) {
      productsHtml = `
        <ul style="margin:0 0 0 20px;padding:0;list-style:disc;color:#4a5568;font-size:15px">
          ${lines.map(li => `<li style="margin:6px 0">${li}</li>`).join('')}
        </ul>`
    }
  }
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmação de Solicitação - Natureza Brindes</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; padding: 20px; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #2CB20B; padding: 36px 24px; text-align: center; color: white; border-radius: 12px 12px 0 0; }
    .brand { font-size: 28px; font-weight: 700; letter-spacing: -0.4px; }
    .tagline { font-size: 16px; opacity: 0.95; font-weight: 300; }
    .main-content { padding: 40px 30px; }
    .title { color: #2d3748; font-size: 24px; font-weight: 600; text-align: center; margin-bottom: 30px; letter-spacing: 0.5px; }
    .greeting { font-size: 18px; margin-bottom: 25px; color: #4a5568; }
    .message { font-size: 16px; line-height: 1.7; color: #4a5568; margin-bottom: 30px; }
    .data-section { background-color: #f7fafc; border-left: 4px solid #2CB20B; padding: 25px; border-radius: 8px; margin: 30px 0; }
    .data-title { color: #2CB20B; font-size: 18px; font-weight: 600; margin-bottom: 20px; }
    .data-item { display: flex; margin-bottom: 12px; font-size: 15px; }
    .data-label { font-weight: 600; color: #2d3748; min-width: 120px; margin-right: 10px; }
    .data-value { color: #4a5568; flex: 1; }
    .contact-section { background-color: #2CB20B; color: white; padding: 30px; text-align: center; margin-top: 40px; }
    .contact-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; }
    .footer { background-color: #2d3748; color: #a0aec0; padding: 25px 30px; text-align: center; font-size: 13px; }
    .footer-brand { color: #ffffff; font-weight: 600; margin-bottom: 5px; }
    @media only screen and (max-width: 480px) {
      .header { padding: 24px 16px; }
      .brand { font-size: 24px !important; }
      .tagline { font-size: 14px !important; }
    }
  </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="header">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0;margin:0;">
              <img src="https://dntlbhmljceaefycdsbc.supabase.co/storage/v1/object/sign/Natureza%20Brindes/img/logo_branca_fundo_verde.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80NzlhNDY1NC01Y2Q2LTQ1ZjItYmVmZi1hMGU1NTBjZTUxYWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJOYXR1cmV6YSBCcmluZGVzL2ltZy9sb2dvX2JyYW5jYV9mdW5kb192ZXJkZS5wbmciLCJpYXQiOjE3NjMyOTgwMTgsImV4cCI6MjA3ODY1ODAxOH0.YIH4VPYpzB6pDhzWb_VAqolVqEkgfC97JgAdhkzAJ-U" alt="Natureza Brindes" width="140" style="display:block;margin:0 auto 10px auto;height:auto;" />
              <div class="brand" style="margin:0 auto 6px auto;text-align:center;">Natureza Brindes</div>
              <div class="tagline" style="text-align:center;margin:0 auto;">A natureza na sua marca</div>
            </td>
          </tr>
        </table>
      </div>
      <div class="main-content">
        <h1 class="title">RECEBEMOS SUA SOLICITAÇÃO DE ORÇAMENTO</h1>
        <div class="greeting">Olá <strong>${data.clientName}</strong>, agradecemos seu contato.</div>
        <div class="message">
          <p>Em breve retornaremos com a melhor proposta.</p>
          ${productsHtml ? `
          <div style="margin-top:16px;padding:14px;border-left:4px solid #2CB20B;background:#f7fafc;border-radius:8px">
            <div style="font-size:16px;font-weight:700;color:#2d3748;margin-bottom:8px">Produtos selecionados</div>
            ${productsHtml}
            ${rawObs ? `<div style="margin-top:10px;color:#374151"><strong>Observações:</strong> ${esc(rawObs)}</div>` : ''}
          </div>
          ` : ''}
        </div>
        <div class="data-section">
          <div class="data-title">Seus dados:</div>
          <div class="data-item"><span class="data-label">Empresa:</span><span class="data-value">${data.clientCompany || ''}</span></div>
          <div class="data-item"><span class="data-label">Nome:</span><span class="data-value">${data.clientName}</span></div>
          <div class="data-item"><span class="data-label">Telefone:</span><span class="data-value">${data.clientPhone || ''}</span></div>
          <div class="data-item"><span class="data-label">E-mail:</span><span class="data-value">${data.clientEmail}</span></div>
          
        </div>
      </div>
      <div class="contact-section">
        <div class="contact-title">Natureza Brindes</div>
        <div class="contact-info">
          WhatsApp: (27) 99999-9999 | E-mail: natureza.brindes@naturezabrindes.com.br<br />
          Serra – ES
        </div>
      </div>
      <div class="footer">
        <div class="footer-brand">COPYRIGHT © ${currentYear} Natureza Brindes</div>
        <div>Desenvolvimento E5 Inovação</div>
      </div>
    </div>
  </body>
</html>
`
}