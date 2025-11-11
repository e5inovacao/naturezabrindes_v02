// Cloudflare Pages Function - API Implementation
import { createClient } from '@supabase/supabase-js';

// CORS headers - Configuração robusta para produção
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false',
  'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
};

// Handle CORS preflight requests
function handleCORS(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  return null;
}

// Create Supabase client
function createSupabaseClient(env: any) {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseKey = serviceRoleKey || anonKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Please configure SUPABASE_URL and SUPABASE_* keys (fallback to VITE_*).');
  }

  console.log(`[${new Date().toISOString()}] [CLOUDFLARE_API] 🔑 Inicializando Supabase`, {
    hasUrl: !!supabaseUrl,
    usingServiceRole: !!serviceRoleKey,
    usingAnon: !!anonKey && !serviceRoleKey
  });

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// API Response helper
function apiResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Error response helper
function errorResponse(message: string, status = 500) {
  const errorData = {
    success: false,
    error: message,
    status,
    timestamp: new Date().toISOString(),
    service: 'cloudflare-api'
  };
  
  console.error(`[${new Date().toISOString()}] [CLOUDFLARE_API] ❌ Erro retornado:`, errorData);
  
  return apiResponse(errorData, status);
}

// Products API handlers
async function handleProducts(request: Request, supabase: any, pathSegments: string[]) {
  const url = new URL(request.url);
  const method = request.method;

  try {
    if (method === 'GET') {
      // Handle different product endpoints
      if (pathSegments.length === 0) {
        // GET /api/products - List products with filters
        const category = url.searchParams.get('category');
        const features = url.searchParams.get('features');
        const search = url.searchParams.get('search');
        const featured = url.searchParams.get('featured');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const sort = url.searchParams.get('sort') || 'name';

        // Lista de produtos com filtros usando tabela principal `products`
        let query = supabase.from('products').select('*', { count: 'exact' });

        // Apply filters
        if (category) {
          // No schema `products`, usamos `category_id`
          query = query.eq('category_id', category);
        }
        if (features) {
          // `features` é um array; usar contains quando possível
          try {
            const parts = features.split(',').map(p => p.trim()).filter(Boolean);
            if (parts.length > 0) {
              query = query.contains('features', parts.length === 1 ? [parts[0]] : parts);
            }
          } catch {
            // fallback silencioso sem filtro
          }
        }
        if (search) {
          query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        if (featured === 'true') {
          query = query.eq('featured', true);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        // Apply sorting
        query = query.order(sort);

        try {
          const { data, error, count } = await query;

          if (error) throw error;

          return apiResponse({
            success: true,
            data: {
              items: data || [],
              pagination: {
                currentPage: page,
                totalPages: Math.ceil((count || 0) / limit),
                totalItems: count || 0,
                itemsPerPage: limit,
                hasNextPage: page * limit < (count || 0),
                hasPrevPage: page > 1,
              },
            },
          });
        } catch (primaryError) {
          console.warn(`[${new Date().toISOString()}] [CLOUDFLARE_API] ⚠️ Fallback de produtos acionado`, {
            error: primaryError instanceof Error ? primaryError.message : primaryError,
          });

          // Fallback: usar tabela ecologic_products_site com mapeamento simples
          let ecoQuery = supabase.from('ecologic_products_site').select('*', { count: 'exact' });

          if (category) {
            ecoQuery = ecoQuery.eq('categoria', category);
          }
          if (search) {
            ecoQuery = ecoQuery.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`);
          }

          const ecoFrom = (page - 1) * limit;
          const ecoTo = ecoFrom + limit - 1;
          ecoQuery = ecoQuery.range(ecoFrom, ecoTo).order('titulo', { ascending: true });

          const { data: ecoData, error: ecoError, count: ecoCount } = await ecoQuery;

          if (ecoError) {
            console.error(`[${new Date().toISOString()}] [CLOUDFLARE_API] ❌ Fallback falhou`, {
              error: ecoError.message,
              details: (ecoError as any)?.details,
              hint: (ecoError as any)?.hint,
            });
            throw ecoError;
          }

          // Mapear para estrutura mínima esperada pelo frontend
          const mapped = (ecoData || []).map((p: any) => ({
            id: String(p.id ?? p.codigo ?? `${p.tipo || 'eco'}-${p.codigo || Math.random()}`),
            name: p.titulo || p.nome || 'Produto',
            description: p.descricao || '',
            images: [p.img_0, p.IMAGEM].filter(Boolean),
            category: p.categoria || 'ecologicos',
            sustainabilityFeatures: [],
            specifications: {},
            features: [],
            certifications: [],
            inStock: true,
            featured: false,
          }));

          return apiResponse({
            success: true,
            data: {
              items: mapped,
              pagination: {
                currentPage: page,
                totalPages: Math.ceil((ecoCount || (mapped?.length || 0)) / limit),
                totalItems: ecoCount || (mapped?.length || 0),
                itemsPerPage: limit,
                hasNextPage: page * limit < (ecoCount || (mapped?.length || 0)),
                hasPrevPage: page > 1,
              },
            },
          });
        }
      } else if (pathSegments[0] === 'featured' && pathSegments[1] === 'list') {
        // GET /api/products/featured/list
        const limit = parseInt(url.searchParams.get('limit') || '4');
        
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('featured', true)
            .limit(limit);

          if (error) throw error;

          return apiResponse({
            success: true,
            data: data || [],
          });
        } catch (primaryError) {
          console.warn(`[${new Date().toISOString()}] [CLOUDFLARE_API] ⚠️ Fallback highlighted acionado`, {
            error: primaryError instanceof Error ? primaryError.message : primaryError,
          });

          const { data: ecoData, error: ecoError } = await supabase
            .from('ecologic_products_site')
            .select('*')
            .limit(limit);

          if (ecoError) throw ecoError;

          const mapped = (ecoData || []).map((p: any) => ({
            id: String(p.id ?? p.codigo ?? `${p.tipo || 'eco'}-${p.codigo || Math.random()}`),
            name: p.titulo || p.nome || 'Produto',
            description: p.descricao || '',
            images: [p.img_0, p.IMAGEM].filter(Boolean),
            category: p.categoria || 'ecologicos',
            featured: true,
          }));

          return apiResponse({ success: true, data: mapped });
        }
      } else if (pathSegments[0] === 'highlighted') {
        // GET /api/products/highlighted
        const limit = parseInt(url.searchParams.get('limit') || '6');
        
        // Fallback: usar produtos com `featured=true` como "highlighted"
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(limit);

        if (error) throw error;

        return apiResponse({
          success: true,
          data: data || [],
        });
      } else if (pathSegments[0] === 'categories' && pathSegments[1] === 'list') {
        // GET /api/products/categories/list
        // Extrair categorias distintas a partir de `category_id`
        try {
          const { data, error } = await supabase
            .from('products')
            .select('category_id')
            .not('category_id', 'is', null);

          if (error) throw error;

          const categories = [...new Set((data || []).map((item: any) => item.category_id))];

          return apiResponse({ success: true, data: categories });
        } catch (primaryError) {
          console.warn(`[${new Date().toISOString()}] [CLOUDFLARE_API] ⚠️ Fallback categorias acionado`, {
            error: primaryError instanceof Error ? primaryError.message : primaryError,
          });
          const { data: ecoData, error: ecoError } = await supabase
            .from('ecologic_products_site')
            .select('categoria')
            .not('categoria', 'is', null);
          if (ecoError) throw ecoError;
          const categories = [...new Set((ecoData || []).map((item: any) => item.categoria))];
          return apiResponse({ success: true, data: categories });
        }
      } else if (pathSegments.length === 1) {
        // GET /api/products/:id
        const productId = pathSegments[0];
        
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          if (error) throw error;

          return apiResponse({ success: true, data });
        } catch (primaryError) {
          console.warn(`[${new Date().toISOString()}] [CLOUDFLARE_API] ⚠️ Fallback produto por ID acionado`, {
            error: primaryError instanceof Error ? primaryError.message : primaryError,
          });
          const { data: ecoData, error: ecoError } = await supabase
            .from('ecologic_products_site')
            .select('*')
            .eq('id', productId)
            .maybeSingle();
          if (ecoError) throw ecoError;
          const mapped = ecoData
            ? {
                id: String(ecoData.id ?? ecoData.codigo ?? `${ecoData.tipo || 'eco'}-${ecoData.codigo || Math.random()}`),
                name: ecoData.titulo || ecoData.nome || 'Produto',
                description: ecoData.descricao || '',
                images: [ecoData.img_0, ecoData.IMAGEM].filter(Boolean),
                category: ecoData.categoria || 'ecologicos',
              }
            : null;
          return apiResponse({ success: true, data: mapped });
        }
      }
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Products API error:', error instanceof Error ? { message: error.message, stack: error.stack } : error);
    return errorResponse('Internal server error');
  }
}

// Quotes API handlers
async function handleQuotes(request: Request, supabase: any, pathSegments: string[]) {
  const method = request.method;

  try {
    if (method === 'POST' && pathSegments.length === 0) {
      // POST /api/quotes - Create new quote
      const body = await request.json();
      
      const { data, error } = await supabase
        .from('orcamentos')
        .insert([{
          dados_cliente: body.customerData,
          itens: body.items,
          observacoes: body.notes,
          status: 'pendente',
          data_criacao: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      return apiResponse({
        success: true,
        data: data,
      });
    } else if (method === 'GET') {
      if (pathSegments.length === 0) {
        // GET /api/quotes - List quotes
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        let query = supabase.from('orcamentos').select('*', { count: 'exact' });

        if (status) {
          query = query.eq('status', status);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to).order('data_criacao', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        return apiResponse({
          success: true,
          data: {
            items: data || [],
            pagination: {
              currentPage: page,
              totalPages: Math.ceil((count || 0) / limit),
              totalItems: count || 0,
              itemsPerPage: limit,
              hasNextPage: page * limit < (count || 0),
              hasPrevPage: page > 1,
            },
          },
        });
      } else if (pathSegments[0] === 'stats' && pathSegments[1] === 'dashboard') {
        // GET /api/quotes/stats/dashboard
        const { data, error } = await supabase
          .from('orcamentos')
          .select('status');

        if (error) throw error;

        const stats = {
          total: data?.length || 0,
          pendente: data?.filter(q => q.status === 'pendente').length || 0,
          aprovado: data?.filter(q => q.status === 'aprovado').length || 0,
          rejeitado: data?.filter(q => q.status === 'rejeitado').length || 0,
        };

        return apiResponse({
          success: true,
          data: stats,
        });
      } else if (pathSegments.length === 1) {
        // GET /api/quotes/:id
        const quoteId = pathSegments[0];
        
        const { data, error } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (error) throw error;

        return apiResponse({
          success: true,
          data: data,
        });
      }
    }

    return errorResponse('Endpoint not found', 404);
  } catch (error) {
    console.error('Quotes API error:', error);
    return errorResponse('Internal server error');
  }
}

// Health check
function handleHealth() {
  return apiResponse({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
}

// Main request handler
export async function onRequest(context: any) {
  const { request, env } = context;
  const startTime = Date.now();
  
  try {
    // Log da requisição
    console.log(`[${new Date().toISOString()}] [CLOUDFLARE_API] 📥 Nova requisição:`, {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('User-Agent'),
      origin: request.headers.get('Origin'),
      referer: request.headers.get('Referer')
    });

    // Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) {
      console.log(`[${new Date().toISOString()}] [CLOUDFLARE_API] ✅ CORS preflight respondido`);
      return corsResponse;
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.replace('/api/', '').split('/').filter(Boolean);

    // Verificar variáveis de ambiente com suporte a SUPABASE_*
    const hasUrl = !!(env.SUPABASE_URL || env.VITE_SUPABASE_URL);
    const hasKey = !!(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY);
    if (!hasUrl || !hasKey) {
      console.error(`[${new Date().toISOString()}] [CLOUDFLARE_API] ❌ Variáveis de ambiente faltando:`, {
        hasSupabaseUrl: hasUrl,
        hasSupabaseKey: hasKey,
        envNamesPresent: Object.keys(env || {})
      });
      return errorResponse('Configuração do servidor incompleta', 500);
    }

    // Create Supabase client
    const supabase = createSupabaseClient(env);

    let response;
    
    // Route to appropriate handler
    if (pathSegments.length === 0 || pathSegments[0] === 'health') {
      response = handleHealth();
    } else if (pathSegments[0] === 'products') {
      response = await handleProducts(request, supabase, pathSegments.slice(1));
    } else if (pathSegments[0] === 'quotes') {
      response = await handleQuotes(request, supabase, pathSegments.slice(1));
    } else if (pathSegments[0] === 'proxy') {
      response = await handleProxy(request, pathSegments.slice(1));
    } else {
      console.warn(`[${new Date().toISOString()}] [CLOUDFLARE_API] ⚠️ Endpoint não encontrado:`, {
        path: url.pathname,
        segments: pathSegments
      });
      response = errorResponse('Endpoint not found', 404);
    }

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [CLOUDFLARE_API] ✅ Requisição processada:`, {
      method: request.method,
      path: url.pathname,
      duration: `${duration}ms`,
      status: response.status || 200
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [CLOUDFLARE_API] 💥 Erro crítico:`, {
      method: request.method,
      url: request.url,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return errorResponse('Internal server error', 500);
   }
 }

// Proxy handler for images - resolve CORS issues
async function handleProxy(request: Request, pathSegments: string[]) {
  const url = new URL(request.url);
  
  if (pathSegments[0] === 'image') {
    return await handleImageProxy(request, url);
  } else if (pathSegments[0] === 'test') {
    return await handleProxyTest(request, url);
  } else {
    return errorResponse('Proxy endpoint not found', 404);
  }
}

// Handle image proxy requests
async function handleImageProxy(request: Request, url: URL) {
  try {
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      return errorResponse('URL da imagem é obrigatória', 400);
    }

    // Validar se é uma URL válida
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch (error) {
      return errorResponse('URL inválida', 400);
    }

    // Verificar se é HTTPS ou HTTP
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return errorResponse('Protocolo não suportado. Use HTTP ou HTTPS', 400);
    }

    console.log(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] 🖼️ Fazendo proxy de imagem:`, {
      originalUrl: imageUrl,
      hostname: parsedUrl.hostname,
      protocol: parsedUrl.protocol
    });

    // Fazer requisição para a imagem
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': parsedUrl.origin
      }
    });

    if (!imageResponse.ok) {
      console.error(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] ❌ Erro ao buscar imagem:`, {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        url: imageUrl
      });
      return errorResponse(`Imagem não encontrada (${imageResponse.status})`, imageResponse.status);
    }

    // Verificar se é uma imagem
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] ❌ Não é uma imagem:`, {
        contentType,
        url: imageUrl
      });
      return errorResponse('URL não aponta para uma imagem válida', 400);
    }

    console.log(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] ✅ Imagem encontrada:`, {
      contentType,
      size: imageResponse.headers.get('content-length'),
      url: imageUrl
    });

    // Criar resposta com headers CORS apropriados
    const proxyResponse = new Response(imageResponse.body, {
      status: imageResponse.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
        'X-Content-Type-Options': 'nosniff',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Referrer-Policy': 'no-referrer-when-downgrade',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Proxy-Cache': 'MISS',
        'X-Proxy-Source': 'cloudflare-functions',
        ...corsHeaders,
      },
    });

    return proxyResponse;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] 💥 Erro crítico no proxy:`, {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    return errorResponse('Erro ao fazer proxy da imagem', 500);
  }
}

// Handle proxy test requests
async function handleProxyTest(request: Request, url: URL) {
  try {
    const imageUrl = url.searchParams.get('url');
    
    if (!imageUrl) {
      return apiResponse({
        success: false,
        error: 'URL da imagem é obrigatória'
      }, 400);
    }

    // Validar URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch (error) {
      return apiResponse({
        success: false,
        valid: false,
        error: 'URL inválida',
        url: imageUrl
      });
    }

    console.log(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] 🧪 Testando URL:`, {
      url: imageUrl,
      hostname: parsedUrl.hostname
    });

    // Fazer requisição HEAD para testar
    const testResponse = await fetch(imageUrl, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentType = testResponse.headers.get('content-type');
    const contentLength = testResponse.headers.get('content-length');
    
    const result = {
      success: true,
      valid: testResponse.ok && contentType?.startsWith('image/'),
      status: testResponse.status,
      contentType,
      contentLength,
      url: imageUrl,
      hostname: parsedUrl.hostname
    };

    console.log(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] 📊 Resultado do teste:`, result);

    return apiResponse(result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [CLOUDFLARE_PROXY] ❌ Erro no teste:`, error);
    return apiResponse({
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      url: url.searchParams.get('url')
    });
  }
}