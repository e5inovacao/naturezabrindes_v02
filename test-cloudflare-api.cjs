// Teste de endpoints de produção da Cloudflare Pages Function
// Em Node 18+ fetch é global; evitamos dependência de node-fetch

const API_BASE = process.env.API_BASE || 'https://naturezabrindes.com.br/api';

async function check(path) {
  const url = API_BASE + path;
  const start = Date.now();
  try {
    const resp = await fetch(url, { method: 'GET' });
    const ms = Date.now() - start;
    const ct = resp.headers.get('content-type') || '';
    let body;
    if (ct.includes('application/json')) body = await resp.json();
    else body = await resp.text();
    return { name: path, status: resp.status, ok: resp.ok, ms, body };
  } catch (e) {
    return { name: path, status: 0, ok: false, ms: Date.now() - start, error: e.message };
  }
}

(async () => {
  const endpoints = [
    '/health',
    '/products?limit=12',
    '/products/featured/list?limit=6',
    '/products/highlighted?limit=6',
    '/products/categories/list',
  ];

  console.log('API_BASE:', API_BASE);

  const results = [];
  for (const p of endpoints) {
    const r = await check(p);
    results.push(r);
    if (r.ok) {
      console.log(`✅ ${p} -> ${r.status} (${r.ms}ms)`);
    } else {
      console.log(`❌ ${p} -> ${r.status} (${r.ms}ms)`, r.error ? `error: ${r.error}` : '');
    }
  }

  // Detalhe das respostas com erro
  for (const r of results.filter(x => !x.ok)) {
    console.log(`\n--- Detalhes ${r.name} ---`);
    if (r.error) console.log('error:', r.error);
    const bodyStr = typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2);
    console.log(bodyStr || '(sem corpo)');
  }
})();