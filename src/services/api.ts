// Serviço de API para comunicação com o backend

// Detectar ambiente e configurar URL da API
const getApiBaseUrl = () => {
  // Produção: sempre usar o mesmo domínio (Cloudflare Pages) e evitar localhost
  if (typeof window !== 'undefined' && !/^(localhost|127\.0\.0\.1)/.test(window.location.hostname)) {
    return `${window.location.origin}/api`;
  }

  // Desenvolvimento: usar variável configurada ou fallback para o servidor local
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Fallback para desenvolvimento (Express API local)
  return 'http://localhost:3005/api';
};

const API_BASE_URL = getApiBaseUrl();

// Tipos para as respostas da API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

// Função auxiliar para fazer requisições HTTP com retry logic
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    timeout: 30000, // 30 segundos
    ...options,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[${new Date().toISOString()}] [API_REQUEST] 🔄 Tentativa ${attempt}/${retries}:`, {
        url,
        method: config.method || 'GET',
        baseUrl: API_BASE_URL
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta não é JSON válido');
      }
      
      const data = await response.json();
      
      console.log(`[${new Date().toISOString()}] [API_REQUEST] ✅ Sucesso:`, {
        url,
        method: config.method || 'GET',
        status: response.status
      });
      
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido');
      
      console.error(`[${new Date().toISOString()}] [API_REQUEST] ❌ Tentativa ${attempt}/${retries} falhou:`, {
        url,
        method: config.method || 'GET',
        error: lastError.message,
        attempt,
        willRetry: attempt < retries
      });

      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff exponencial, máximo 5s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  console.error(`[${new Date().toISOString()}] [API_REQUEST] 💥 Todas as tentativas falharam:`, {
    url,
    method: config.method || 'GET',
    finalError: lastError?.message,
    retries
  });
  
  throw lastError || new Error('Falha na requisição da API após múltiplas tentativas');
}

// Serviços de Produtos
export const productsApi = {
  // Listar produtos com filtros e paginação
  async getProducts(params: {
    category?: string;
    features?: string;
    search?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PaginatedResponse<any>>(endpoint);
  },

  // Buscar produto por ID
  async getProductById(id: string) {
    return apiRequest<ApiResponse<any>>(`/products/${id}`);
  },

  // Listar produtos em destaque
  async getFeaturedProducts(limit: number = 4) {
    return apiRequest<ApiResponse<any[]>>(`/products/featured/list?limit=${limit}`);
  },

  // Buscar produtos em destaque da tabela produtos_destaque
  async getHighlightedProducts(limit: number = 6) {
    return apiRequest<ApiResponse<any[]>>(`/products/highlighted?limit=${limit}`);
  },

  // Listar categorias
  async getCategories() {
    return apiRequest<ApiResponse<any[]>>('/products/categories/list');
  },
};

// Serviços de Orçamentos
export const quotesApi = {
  // Criar nova solicitação de orçamento
  async createQuote(quoteData: {
    customerData: {
      name: string;
      phone: string;
      email: string;
      company?: string;
      cnpj?: string;
    };
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      customizations?: Record<string, any>;
      notes?: string;
      ecologicalId?: number;
      color?: string;
      unitPrice?: number;
    }>;
    notes?: string;
  }) {
    return apiRequest<ApiResponse<any>>('/quotes/v2', {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  },

  // Listar orçamentos
  async getQuotes(params: {
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/quotes${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PaginatedResponse<any>>(endpoint);
  },

  // Buscar orçamento por ID
  async getQuoteById(id: string) {
    return apiRequest<ApiResponse<any>>(`/quotes/${id}`);
  },

  // Atualizar status do orçamento
  async updateQuoteStatus(id: string, status: string) {
    return apiRequest<ApiResponse<any>>(`/quotes/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Excluir orçamento
  async deleteQuote(id: string) {
    return apiRequest<ApiResponse<any>>(`/quotes/${id}`, {
      method: 'DELETE',
    });
  },

  // Buscar estatísticas do dashboard
  async getDashboardStats() {
    return apiRequest<ApiResponse<any>>('/quotes/stats/dashboard');
  },
};

// Exportar API como padrão
export default {
  products: productsApi,
  quotes: quotesApi,
};