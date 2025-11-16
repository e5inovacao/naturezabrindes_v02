const http = require('http')
const https = require('https')
const { URL } = require('url')

function nodeFetch(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(u, { method: opts.method || 'GET', headers: opts.headers || {} }, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => resolve({ status: res.statusCode, text: async () => data }))
    })
    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

async function main() {
  const payload = {
    customerData: {
      name: 'Teste Local',
      email: 'eduardosouzedev@gmail.com',
      phone: '(27) 99999-9999',
      company: 'Teste Co.'
    },
    items: [
      { id: 'test-1', name: 'Produto Teste', quantity: 2, unitPrice: 10 }
    ],
    notes: 'Teste de envio de e-mail via backend Express.'
  }

  const url = 'http://localhost:3005/api/quotes'
  console.log('POST', url)
  const resp = await nodeFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  console.log('Status:', resp.status)
  const text = await resp.text()
  console.log('Body:', text)
}

main().catch(err => { console.error('Error:', err); process.exit(1) })