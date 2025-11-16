interface EmailData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  productName?: string;
  productRef?: string;
  subject?: string;
  message?: string;
}

interface BackendEmailRequest {
  to: string;
  name: string;
  subject: string;
  htmlContent: string;
}

export const sendQuoteConfirmationEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Validar dados obrigatórios antes de enviar
    if (!emailData.clientEmail || !emailData.clientName) {
      console.error('Erro: clientEmail e clientName são obrigatórios');
      return false;
    }
    
    // Garantir que o nome não seja vazio após trim
    const clientName = emailData.clientName.trim();
    const clientEmail = emailData.clientEmail.trim();
    
    if (!clientName || !clientEmail) {
      console.error('Erro: clientEmail e clientName não podem ser vazios após trim');
      return false;
    }
    
    const emailTemplate = generateQuoteEmailTemplate(emailData);

    const emailRequest: BackendEmailRequest = {
      to: clientEmail,
      name: clientName,
      subject: 'Confirmação de Solicitação de Orçamento - Natureza Brindes',
      htmlContent: emailTemplate
    };

    const response = await fetch('/api/email/test', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailRequest)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao enviar email:', errorData);
      return false;
    }

    console.log('Email de confirmação de orçamento enviado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro no serviço de email:', error);
    return false;
  }
};

export const sendConfirmationEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Validar dados obrigatórios antes de enviar
    if (!emailData.clientEmail || !emailData.clientName) {
      console.error('Erro: clientEmail e clientName são obrigatórios');
      return false;
    }
    
    // Garantir que o nome não seja vazio após trim
    const clientName = emailData.clientName.trim();
    const clientEmail = emailData.clientEmail.trim();
    
    if (!clientName || !clientEmail) {
      console.error('Erro: clientEmail e clientName não podem ser vazios após trim');
      return false;
    }
    
    const emailTemplate = generateEmailTemplate(emailData);

    const emailRequest: BackendEmailRequest = {
      to: clientEmail,
      name: clientName,
      subject: 'RECEBEMOS SUA SOLICITAÇÃO DE ORÇAMENTO - Natureza Brindes',
      htmlContent: emailTemplate
    };

    const response = await fetch('/api/email/test', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailRequest)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao enviar email:', errorData);
      return false;
    }

    console.log('Email enviado com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro no serviço de email:', error);
    return false;
  }
};

const generateQuoteEmailTemplate = (emailData: EmailData): string => {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
      <table align="center" width="600" style="background:#fff;border-radius:8px;margin:20px auto;">
        <!-- Cabeçalho com logo -->
        <tr>
          <td align="center" style="background:#ffffff;border-bottom:2px solid #e5e7eb;padding:30px 20px;">
            <img src="https://dntlbhmljceaefycdsbc.supabase.co/storage/v1/object/sign/Natureza%20Brindes/img/Frame-2.webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80NzlhNDY1NC01Y2Q2LTQ1ZjItYmVmZi1hMGU1NTBjZTUxYWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJOYXR1cmV6YSBCcmluZGVzL2ltZy9GcmFtZS0yLndlYnAiLCJpYXQiOjE3NjE1MjMxMzYsImV4cCI6MjA3Njg4MzEzNn0.jax-ty2xbkD5ql0vBZUy0dc7MCZjuuW6NwJrYKPucoM" width="120" height="auto" alt="Natureza Brindes" style="display:block;margin-bottom:10px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#16a34a;margin-top:8px;">
              Natureza Brindes
            </div>
          </td>
        </tr>
        
        <!-- Título e saudação -->
        <tr>
          <td align="center" style="padding:24px;">
            <h1 style="font-size:18px;color:#111827;margin:0;font-weight:bold;">RECEBEMOS SUA SOLICITAÇÃO DE ORÇAMENTO</h1>
            <p style="color:#374151;font-size:14px;margin:16px 0 0 0;">
              Olá <b>${emailData.clientName}</b>, agradecemos seu contato.<br>
              Em breve retornaremos com a melhor proposta.
            </p>
          </td>
        </tr>
        
        <!-- Seus dados -->
        <tr>
          <td style="padding:0 32px;">
            <h3 style="color:#16a34a;font-size:16px;margin:20px 0 10px 0;">Seus dados</h3>
            <p style="color:#444;font-size:14px;line-height:1.6;margin:0;">
              <b>Nome:</b> ${emailData.clientName}<br>
              <b>E-mail:</b> ${emailData.clientEmail}<br>
              <b>Telefone:</b> ${emailData.clientPhone || 'Não informado'}<br>
              <b>Empresa:</b> ${emailData.clientCompany || 'Não informado'}
            </p>
          </td>
        </tr>
        
        <!-- Produtos solicitados -->
        ${emailData.productName || emailData.message ? `
        <tr>
          <td style="padding:0 32px;">
            <h3 style="color:#16a34a;font-size:16px;margin:20px 0 10px 0;">Produtos solicitados</h3>
            <p style="color:#444;font-size:14px;line-height:1.6;margin:0;">
              ${emailData.productName ? `<b>Produto:</b> ${emailData.productName}<br>` : ''}
              ${emailData.productRef ? `<b>Referência:</b> ${emailData.productRef}<br>` : ''}
              ${emailData.message ? `<b>Mensagem:</b> ${emailData.message}<br>` : ''}
            </p>
            ${emailData.subject ? `<p style="font-size:13px;color:#374151;margin:10px 0 0 0;"><i>Observações:</i> ${emailData.subject}</p>` : ''}
          </td>
        </tr>
        ` : ''}
        
        <!-- Próximos passos -->
        <tr>
          <td style="padding:0 32px;">
            <h3 style="color:#16a34a;font-size:16px;margin:20px 0 10px 0;">Próximos passos</h3>
            <ul style="color:#374151;font-size:13px;margin:0;padding-left:20px;">
              <li>Nosso time analisará sua solicitação.</li>
              <li>Retornaremos em até <b>24h úteis</b>.</li>
              <li>Enviaremos proposta detalhada com preços e prazos.</li>
            </ul>
          </td>
        </tr>
        
        <!-- Contatos -->
        <tr>
          <td style="padding:16px 32px;font-size:12px;color:#6b7280;">
            <b>Natureza Brindes</b><br>
            WhatsApp: (27) 99999-9999 | E-mail: naturezabrindes@naturezabrindes.com.br<br>
            Serra – ES
          </td>
        </tr>
        
        <!-- Rodapé -->
        <tr>
          <td align="center" style="background:#F9FAFB;padding:10px;font-size:11px;color:#6b7280;">
            © ${currentYear} Natureza Brindes – Sua marca para todo mundo ver.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const generateEmailTemplate = (emailData: EmailData): string => {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
      <table align="center" width="600" style="background:#fff;border-radius:8px;margin:20px auto;">
        <!-- Cabeçalho com logo -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-bottom:2px solid #e5e7eb;">
          <tr>
            <td align="center" style="padding:30px 24px;">
              <!-- Logo com URL HTTPS pública (PNG/JPG para máxima compatibilidade) -->
              <a href="https://naturezabrindes.com.br" target="_blank" style="text-decoration:none;display:inline-block;">
                <img src="https://dntlbhmljceaefycdsbc.supabase.co/storage/v1/object/sign/Natureza%20Brindes/img/Frame-2.webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80NzlhNDY1NC01Y2Q2LTQ1ZjItYmVmZi1hMGU1NTBjZTUxYWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJOYXR1cmV6YSBCcmluZGVzL2ltZy9GcmFtZS0yLndlYnAiLCJpYXQiOjE3NjE1MjMxMzYsImV4cCI6MjA3Njg4MzEzNn0.jax-ty2xbkD5ql0vBZUy0dc7MCZjuuW6NwJrYKPucoM" width="120" height="auto" alt="Natureza Brindes" 
                     style="display:block;border:0;outline:none;text-decoration:none;width:120px;margin-bottom:10px;">
              </a>
              <!-- Fallback textual (aparece quando a imagem é bloqueada) -->
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#16a34a;margin-top:8px;">
                Natureza Brindes
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Título e saudação -->
        <tr>
          <td align="center" style="padding:24px;">
            <h1 style="font-size:18px;color:#111827;margin:0;font-weight:bold;">RECEBEMOS SUA SOLICITAÇÃO DE ORÇAMENTO</h1>
            <p style="color:#374151;font-size:14px;margin:16px 0 0 0;">
              Olá <b>${emailData.clientName}</b>, agradecemos seu contato.<br>
              Em breve retornaremos com a melhor proposta.
            </p>
          </td>
        </tr>
        
        <!-- Seus dados -->
        <tr>
          <td style="padding:0 32px;">
            <h3 style="color:#16a34a;font-size:16px;margin:20px 0 10px 0;">Seus dados</h3>
            <p style="color:#444;font-size:14px;line-height:1.6;margin:0;">
              <b>Nome:</b> ${emailData.clientName}<br>
              <b>E-mail:</b> ${emailData.clientEmail}<br>
              <b>Telefone:</b> ${emailData.clientPhone || 'Não informado'}<br>
              <b>Empresa:</b> ${emailData.clientCompany || 'Não informado'}
            </p>
          </td>
        </tr>
        
        <!-- Próximos passos -->
        <tr>
          <td style="padding:0 32px;">
            <h3 style="color:#16a34a;font-size:16px;margin:20px 0 10px 0;">Próximos passos</h3>
            <ul style="color:#374151;font-size:13px;margin:0;padding-left:20px;">
              <li>Nosso time analisará sua solicitação.</li>
              <li>Retornaremos em até <b>24h úteis</b>.</li>
              <li>Enviaremos proposta detalhada com preços e prazos.</li>
            </ul>
          </td>
        </tr>
        
        <!-- Contatos -->
        <tr>
          <td style="padding:16px 32px;font-size:12px;color:#6b7280;">
            <b>Natureza Brindes</b><br>
            WhatsApp: (27) 99999-9999 | E-mail: naturezabrindes@naturezabrindes.com.br<br>
            Serra – ES
          </td>
        </tr>
        
        <!-- Rodapé -->
        <tr>
          <td align="center" style="background:#F9FAFB;padding:10px;font-size:11px;color:#6b7280;">
            © ${currentYear} Natureza Brindes – Sua marca para todo mundo ver.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
