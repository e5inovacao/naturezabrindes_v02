import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Filter, Grid, List, Star, Leaf, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SearchComponent from '../components/SearchComponent';
import SEOHead from '../components/SEOHead';
import { Product, ProductCategory, SustainabilityFeature } from '../../shared/types';
import { PRODUCT_CATEGORIES, SUSTAINABILITY_FEATURES } from '../constants';
import { productsApi } from '../services/api';

// Importar função para obter URL da API (mesma lógica de services/api.ts)
const getApiBaseUrl = () => {
  // Produção: usar domínio atual (Cloudflare Pages)
  if (typeof window !== 'undefined' && !/^(localhost|127\.0\.0\.1)/.test(window.location.hostname)) {
    return `${window.location.origin}/api`;
  }

  // Desenvolvimento: VITE_API_URL se definida, senão fallback
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return 'http://localhost:3005/api';
};

// Função para normalizar texto removendo acentos
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '') // Mantém hífens
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
    .trim();
}

// Função auxiliar para verificar se uma palavra-chave corresponde ao texto
function matchesKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  
  // Verifica correspondência exata
  if (normalizedText.includes(normalizedKeyword)) {
    return true;
  }
  
  // Verifica correspondência de palavras individuais
  const textWords = normalizedText.split(' ');
  const keywordWords = normalizedKeyword.split(' ');
  
  // Se a palavra-chave tem múltiplas palavras, todas devem estar presentes
  if (keywordWords.length > 1) {
    return keywordWords.every(word => textWords.some(textWord => textWord.includes(word)));
  }
  
  // Para palavras únicas, verifica se alguma palavra do texto contém a palavra-chave
  return textWords.some(word => word.includes(normalizedKeyword));
}

interface CatalogState {
  products: Product[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
}

// Dados mockados removidos - agora usando API

type SortOption = 'name' | 'featured' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
type ViewMode = 'grid' | 'list';

// Definição das categorias hierárquicas
interface CategoryItem {
  id: string;
  name: string;
  subcategories: string[];
}

// Categorias simples para filtro horizontal
const SIMPLE_CATEGORIES = [
  'Agenda',
  'Blocos e Cadernetas',
  'Bolsas',
  'Bolsas Térmicas',
  'Canecas',
  'Canetas',
  'Canivetes',
  'Canudos',
  'Chaveiros',
  'Copos',
  'Cozinha',
  'Eletrônicos',
  'Escritório',
  'Estojos',
  'Kit Banho',
  'Kit Executivo',
  'Kit Manicure',
  'Lápis',
  'Leques',
  'Linha PET',
  'Moda',
  'Nécessaires',
  'Porta-Cartão e Carteira',
  'Sacochilas',
  'Sacolas',
  'Squeezes e Garrafas',
  'Tapetes'
];

export default function Catalog() {
  console.log(`[${new Date().toISOString()}] [CATALOG] 🚀 Componente inicializado:`, {
    componentLoaded: true,
    timestamp: new Date().toISOString()
  });
  
  // Scroll para o topo quando o componente for montado
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Função para obter URL válida da imagem com fallback robusto
  const getValidImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return getPlaceholderImage();
    }
    
    // Se a URL já é um data URL ou placeholder, retorna como está
    if (imageUrl.startsWith('data:') || imageUrl.includes('placeholder')) {
      return imageUrl;
    }
    
    // Verificar se é uma URL válida
    try {
      const url = new URL(imageUrl);
      
      // Lista de domínios que podem ter problemas de CORS
      const corsProblematicDomains = [
        'www.spotgifts.com.br',
        'spotgifts.com.br',
        'cdn.xbzbrindes.com.br', 
        'www.cdn.xbzbrindes.com.br',
        'images.unsplash.com'
      ];
      
      // Se o domínio pode ter problemas de CORS, usar o proxy
      if (corsProblematicDomains.includes(url.hostname)) {
        console.log(`[${new Date().toISOString()}] [CATALOG] 🔗 Usando proxy:`, {
          domain: url.hostname,
          action: 'proxy_image'
        });
        const API_BASE_URL = getApiBaseUrl();
        return `${API_BASE_URL}/proxy/image?url=${encodeURIComponent(imageUrl)}`;
      }
      
      return imageUrl;
    } catch (error) {
      console.warn(`[${new Date().toISOString()}] [CATALOG] ⚠️ URL inválida detectada:`, {
          invalidUrl: imageUrl,
          action: 'using_placeholder'
        });
      return getPlaceholderImage();
    }
  };

  // Função para gerar placeholder SVG melhorado
  const getPlaceholderImage = (): string => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2Y4ZjlmYTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlNWU3ZWI7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYmcpIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI0MCIgZmlsbD0iIzljYTNhZiIgb3BhY2l0eT0iMC4zIi8+PHBhdGggZD0iTTE3MCAyMDBMMjAwIDE3MEwyMzAgMjAwVjI1MEgxNzBWMjAwWiIgZmlsbD0iIzljYTNhZiIgb3BhY2l0eT0iMC4yIi8+PHRleHQgeD0iMjAwIiB5PSIzMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzQ4MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2VtIG7Do28gZGlzcG9uw612ZWw8L3RleHQ+PC9zdmc+';
  };

  // Função para lidar com erro de imagem de forma mais robusta
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, product: any) => {
    const target = e.target as HTMLImageElement;
    const currentSrc = target.src;
    const placeholder = getPlaceholderImage();
    
    // Evitar loop infinito de erro
    if (currentSrc !== placeholder && !currentSrc.includes('fallback-final')) {
      console.warn(`[${new Date().toISOString()}] [CATALOG] ⚠️ Erro ao carregar imagem:`, {
          productName: product.name,
          imageSrc: currentSrc,
          action: 'replacing_with_placeholder'
        });
      target.src = placeholder;
    } else if (currentSrc === placeholder) {
      // Se até o placeholder falhar, usar uma imagem de fallback final mais simples
      console.warn(`[${new Date().toISOString()}] [CATALOG] ⚠️ Placeholder falhou:`, {
          productName: product.name,
          action: 'using_final_fallback'
        });
      const fallbackFinal = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIiBzdHJva2U9IiNlNWU3ZWIiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Yjc0ODEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlbTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5uw6NvIGRpc3BvbsOtdmVsPC90ZXh0Pjwvc3ZnPic';
      target.src = fallbackFinal;
      target.setAttribute('data-fallback', 'final');
      target.onerror = null; // Prevenir loop infinito
    }
  };
  

  
  // Estado para dados da API
  const [catalogState, setCatalogState] = useState<CatalogState>({
    products: [],
    loading: true,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });
  
  // Estado para controle de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // Aumentado de 50 para 100 para exibir mais produtos
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [isShowingAllProducts, setIsShowingAllProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');



  // Sincronizar com URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlSort = searchParams.get('sort');
    const urlCategory = searchParams.get('categoria');
    
    let hasChanges = false;
    
    if (urlSearch && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
      hasChanges = true;
    }
    
    if (urlSort && urlSort !== sortBy) {
      setSortBy(urlSort as SortOption);
      hasChanges = true;
    }
    
    if (urlCategory && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
      hasChanges = true;
      console.log('[CATALOG] Categoria definida pela URL:', urlCategory);
    }
    
    if (hasChanges) {
      console.log(`[${new Date().toISOString()}] [CATALOG] 🔄 URL params sincronizados:`, {
      action: 'sync_url_params',
      timestamp: new Date().toISOString()
    });
    }
  }, [searchParams]);

  // Atualizar URL quando filtros mudam
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (searchTerm) newParams.set('search', searchTerm);
    if (sortBy !== 'featured') newParams.set('sort', sortBy);
    if (selectedCategory) newParams.set('categoria', selectedCategory);
    
    // Só atualizar se os parâmetros realmente mudaram
    const currentParams = searchParams.toString();
    const newParamsString = newParams.toString();
    
    if (currentParams !== newParamsString) {
      setSearchParams(newParams, { replace: true });
    }
  }, [searchTerm, sortBy, selectedCategory, setSearchParams, searchParams]);

  // Função para buscar todos os produtos de todas as páginas
  const loadAllProducts = async () => {
    try {
      console.log('[Catalog] Carregando TODOS os produtos de todas as páginas...');
      setCatalogState(prev => ({ ...prev, loading: true, error: null }));
      
      let allProducts: Product[] = [];
      let currentPageLoad = 1;
      let totalPages = 1;
      
      // Buscar primeira página para obter informações de paginação
      const firstPageParams: any = {
        sort: sortBy === 'featured' ? 'featured' : 'name',
        page: 1,
        limit: 100 // Usar limite maior para reduzir número de requisições
      };
      
      if (searchTerm) {
        firstPageParams.search = searchTerm;
      }
      
      const firstResponse = await productsApi.getProducts(firstPageParams);
      
      if (firstResponse.success && firstResponse.data) {
        allProducts = firstResponse.data.items || [];
        totalPages = firstResponse.data.pagination.totalPages;
        console.log(`[Catalog] Primeira página carregada: ${allProducts.length} produtos, ${totalPages} páginas totais`);
        
        // Buscar páginas restantes
        for (let page = 2; page <= totalPages; page++) {
          const pageParams = {
            ...firstPageParams,
            page
          };
          
          const pageResponse = await productsApi.getProducts(pageParams);
          
          if (pageResponse.success && pageResponse.data) {
            allProducts = allProducts.concat(pageResponse.data.items || []);
            console.log(`[Catalog] Página ${page} carregada: +${pageResponse.data.items?.length || 0} produtos (total: ${allProducts.length})`);
          }
        }
        
        console.log(`[Catalog] TODOS os produtos carregados: ${allProducts.length} produtos de ${totalPages} páginas`);
        
        setCatalogState(prev => ({
          ...prev,
          products: allProducts,
          loading: false,
          error: null,
          currentPage: 1,
          totalPages: Math.ceil(allProducts.length / itemsPerPage),
          totalProducts: allProducts.length
        }));
        setIsPageChanging(false);
      } else {
        throw new Error('Erro ao carregar primeira página');
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [CATALOG] ❌ Erro ao carregar todos os produtos:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        });
      
      let errorMessage = 'Erro ao carregar produtos. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Erro de conexão com o servidor. Verifique sua conexão com a internet e tente novamente.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Erro interno do servidor. Nossa equipe foi notificada.';
        }
      }
      
      setCatalogState(prev => ({
        ...prev,
        products: [],
        loading: false,
        error: errorMessage,
        totalPages: 1,
        totalProducts: 0
      }));
      setIsPageChanging(false);
    }
  };

  // Carregar produtos da API
  useEffect(() => {
    // Se há categoria selecionada, carregar todos os produtos para filtrar corretamente
    if (selectedCategory) {
      console.log('[Catalog] Categoria selecionada, carregando todos os produtos:', selectedCategory);
      loadAllProducts();
    } else {
      // Caso contrário, usar paginação normal
      const loadProducts = async () => {
        try {
          setCatalogState(prev => ({ ...prev, loading: true, error: null }));
          
          const params: any = {
            sort: sortBy === 'featured' ? 'featured' : 'name',
            page: currentPage,
            limit: itemsPerPage
          };
          
          if (searchTerm) {
            params.search = searchTerm;
            
            // Log específico para busca por "92823"
            if (searchTerm === '92823') {
              console.log(`[${new Date().toISOString()}] [CATALOG] 🔍 BUSCA POR 92823 DETECTADA:`, {
                searchTerm,
                params,
                action: 'api_call_with_search'
              });
            }
          }
          
          console.log('[Catalog] Parâmetros da API (paginação normal):', params);
          
          const response = await productsApi.getProducts(params);
          
          // Log específico para resposta da busca por "92823"
          if (searchTerm === '92823') {
            console.log(`[${new Date().toISOString()}] [CATALOG] 📡 RESPOSTA DA API PARA 92823:`, {
              success: response.success,
              totalItems: response.data?.pagination?.totalItems || 0,
              itemsCount: response.data?.items?.length || 0,
              items: response.data?.items || [],
              action: 'api_response_for_92823'
            });
          }
          
          if (response.success && response.data) {
            const { items, pagination } = response.data;
            
            setCatalogState(prev => ({
              ...prev,
              products: items || [],
              loading: false,
              error: null,
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages,
              totalProducts: pagination.totalItems
            }));
            setIsPageChanging(false);
          } else {
            throw new Error('Erro ao carregar produtos');
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] [CATALOG] ❌ Erro ao carregar produtos por categoria:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        });
          
          let errorMessage = 'Erro ao carregar produtos. Tente novamente.';
          
          if (error instanceof Error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
              errorMessage = 'Erro de conexão com o servidor. Verifique sua conexão com a internet e tente novamente.';
            } else if (error.message.includes('404')) {
              errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
            } else if (error.message.includes('500')) {
              errorMessage = 'Erro interno do servidor. Nossa equipe foi notificada.';
            }
          }
          
          setCatalogState(prev => ({
            ...prev,
            products: [],
            loading: false,
            error: errorMessage,
            totalPages: 1,
            totalProducts: 0
          }));
          setIsPageChanging(false);
        }
      };
      
      loadProducts();
    }
  }, [sortBy, searchTerm, currentPage, selectedCategory]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...catalogState.products];
    
    console.log('[Catalog] Produtos originais:', filtered.length);
    console.log('[Catalog] Termo de busca:', searchTerm);
    console.log('[Catalog] Categoria selecionada:', selectedCategory);
    
    // Log específico para busca por "92823"
    if (searchTerm === '92823') {
      console.log(`[${new Date().toISOString()}] [CATALOG] 🔍 PROCESSANDO FILTROS PARA 92823:`, {
        originalProductsCount: filtered.length,
        searchTerm,
        selectedCategory,
        action: 'filtering_start'
      });
      
      // Verificar se o produto 92823 está na lista original
      const product92823 = filtered.find(p => p.supplierCode === '92823' || p.reference === '92823');
      console.log(`[${new Date().toISOString()}] [CATALOG] 🎯 PRODUTO 92823 NA LISTA ORIGINAL:`, {
        found: !!product92823,
        product: product92823 || null,
        action: 'check_original_list'
      });
    }
    
    // Aplicar filtro de categoria se selecionada - APENAS pelo título do produto
    if (selectedCategory) {
      if (selectedCategory.toLowerCase() === 'agenda') {
        // Filtro específico para Agenda - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase().trim();
          return productName.includes('agenda') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'blocos e cadernetas') {
        // Filtro específico para Blocos e Cadernetas - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return (productName.includes('bloco') || 
                 productName.includes('caderno') || 
                 productName.includes('caderneta')) && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'bolsas') {
        // Filtro específico para Bolsas - apenas no título, excluir bolsas térmicas e produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return productName.includes('bolsa') && !productName.includes('termica') && !productName.includes('thermal') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'bolsas térmicas') {
        // Filtro refinado para Bolsas Térmicas
        filtered = filtered.filter(product => {
          const nameNorm = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const hasThermal = nameNorm.includes('termica') || nameNorm.includes('thermal');
          const hasBagWord = nameNorm.includes('bolsa') || nameNorm.includes('cooler') || nameNorm.includes('lancheira') || nameNorm.includes('bag');
          const excluded = ['garrafa', 'squeeze', 'copo', 'caneca'].some(t => nameNorm.includes(t));
          return hasThermal && hasBagWord && !excluded;
        });
      } else if (selectedCategory.toLowerCase() === 'canecas') {
        // Filtro específico para Canecas - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('caneca') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'canetas') {
        // Filtro específico para Canetas - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('caneta') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'canudos') {
        // Filtro específico para Canudos - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('canudo') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'canivetes') {
        // Filtro específico para Canivetes - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('canivete') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'chaveiros') {
        // Filtro específico para Chaveiros - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('chaveiro') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'copos') {
        // Filtro específico para Copos - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('copo') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'leques') {
        // Filtro específico para Leques - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('leque') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'linha pet') {
        // Filtro específico para Linha PET - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const petTerms = ['tigela para pet retrátil', 'tigela pet', 'pet´s', 'bebedouro pet', 'pet`s'];
          const hasPetTerm = petTerms.some(term => productName.includes(term));
          return hasPetTerm && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'nécessaires') {
        // Filtro específico para Nécessaires - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const necessaireTerms = ['nécessaire', 'necessaire'];
          const hasNecessaireTerm = necessaireTerms.some(term => productName.includes(term));
          return hasNecessaireTerm && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'porta-cartão e carteira') {
        // Filtro específico para Porta-Cartão e Carteira - buscar termos específicos no título (com normalização)
        filtered = filtered.filter(product => {
          const nameN = product.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const terms = [
            'porta-cartao',
            'porta cartao',
            'carteira',
            'documento',
            'identidade',
            'porta documento',
            'porta identidade'
          ];
          const hasTerm = terms.some(t => nameN.includes(t));
          return hasTerm; // Não excluir 'porta' para este filtro específico
        });
      } else if (selectedCategory.toLowerCase() === 'sacochilas') {
        // Filtro específico para Sacochilas - buscar termo específico no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('sacochila') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'sacolas') {
        // Filtro específico para Sacolas - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const sacolaTerms = ['sacola', 'ecobag'];
          const hasSacolaTerm = sacolaTerms.some(term => productName.includes(term));
          return hasSacolaTerm && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'squeezes e garrafas') {
        // Filtro específico para Squeezes e Garrafas - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const squeezeTerms = ['squeeze', 'garrafa'];
          const hasSqueezeTerm = squeezeTerms.some(term => productName.includes(term));
          // Excluir produtos com 'porta', 'abridor de garrafa' e 'garrafa bebedouro'
          const excludeTerms = ['porta', 'abridor de garrafa', 'garrafa bebedouro'];
          const hasExcludeTerm = excludeTerms.some(term => productName.includes(term));
          return hasSqueezeTerm && !hasExcludeTerm;
        });
      } else if (selectedCategory.toLowerCase() === 'tapetes') {
        // Filtro específico para Tapetes - buscar termo específico no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes('tapete') && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'cozinha') {
        // Filtro específico para Cozinha - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const cozinhaTerms = ['tábua', 'tabua', 'abridor', 'panela', 'marmita', 'tempero', 'talher'];
          const hasCozinhaTerm = cozinhaTerms.some(term => productName.includes(term));
          // Excluir produtos com 'porta', 'suporte' e 'kit tabua'
          const excludeTerms = ['porta', 'suporte', 'kit tabua'];
          const hasExcludeTerm = excludeTerms.some(term => productName.includes(term));
          return hasCozinhaTerm && !hasExcludeTerm;
        });
      } else if (selectedCategory.toLowerCase() === 'eletrônicos') {
        // Filtro específico para Eletrônicos - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const eletronicoTerms = ['relogio', 'pen', 'som', 'carregador'];
          const hasEletronicoTerm = eletronicoTerms.some(term => productName.includes(term));
          return hasEletronicoTerm && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'escritório') {
        // Filtro específico para Escritório - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const escritorioTerms = ['agenda', 'pasta', 'envelope'];
          const hasEscritorioTerm = escritorioTerms.some(term => productName.includes(term));
          return hasEscritorioTerm && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'estojos') {
        // Filtro específico para Estojos - buscar termos específicos no título
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const estojoTerms = ['estojo', 'embalagem em kraft'];
          const hasEstojoTerm = estojoTerms.some(term => productName.includes(term));
          return hasEstojoTerm && !productName.includes('porta');
        });
      } else if (selectedCategory.toLowerCase() === 'moda') {
        // Filtro específico para Moda - apenas no título, excluir produtos com 'porta'
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          const modaTerms = ['viseira', 'chapéu', 'camisa', 'camiseta', 'roupa'];
          const hasModaTerm = modaTerms.some(term => productName.includes(term));
          return hasModaTerm && !productName.includes('porta');
        })
      } else {
        // Filtro genérico por categoria - apenas no título, excluir produtos com 'porta'
        const categoryLower = selectedCategory.toLowerCase();
        filtered = filtered.filter(product => {
          const productName = product.name.toLowerCase();
          return productName.includes(categoryLower) && !productName.includes('porta');
        });
      }
      console.log('[Catalog] Produtos após filtro de categoria:', filtered.length);
    }
    
    // Aplicar ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });
    
    // Log final específico para busca por "92823"
    if (searchTerm === '92823') {
      console.log(`[${new Date().toISOString()}] [CATALOG] 🏁 RESULTADO FINAL PARA 92823:`, {
        finalProductsCount: filtered.length,
        products: filtered,
        action: 'filtering_complete'
      });
    }
    
    return filtered;
  }, [catalogState.products, searchTerm, sortBy, selectedCategory]);



  // Funções de navegação removidas - sem paginação

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
    setIsPageChanging(false);
  }, [searchTerm, sortBy]);
  
  // Calcular paginação para produtos filtrados - limitado a 100 produtos por página
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);
  
  // Calcular total de páginas para produtos filtrados
  const totalPagesCalculated = useMemo(() => {
    return Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  }, [filteredAndSortedProducts.length, itemsPerPage]);
  
  // Atualizar catalogState com valores calculados
  const finalCatalogState = useMemo(() => {
    return {
      ...catalogState,
      totalPages: totalPagesCalculated,
      totalProducts: filteredAndSortedProducts.length
    };
  }, [catalogState, totalPagesCalculated, filteredAndSortedProducts.length]);
  
  // Funções de navegação de página
  const handlePageChange = async (page: number) => {
    if (page === currentPage || isPageChanging) return;
    
    setIsPageChanging(true);
    setCurrentPage(page);
    
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1 && !isPageChanging) {
      handlePageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < catalogState.totalPages && !isPageChanging) {
      handlePageChange(currentPage + 1);
    }
  };

  // Função para exibir todos os produtos (limpar filtros)
  const handleShowAllProducts = useCallback(() => {
    console.log('[Catalog] Mostrando todos os produtos');
    
    // Limpar todos os filtros
    setSearchTerm('');
    setSortBy('featured');
    setCurrentPage(1);
    setSelectedCategory('');
    
    // Limpar parâmetros da URL
    setSearchParams({}, { replace: true });
    
    // Scroll to top para melhor UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`[${new Date().toISOString()}] [CATALOG] 🧹 Filtros limpos:`, {
      action: 'clear_filters',
      showingAllProducts: true
    });
  }, [setSearchParams]);

  // Função para filtrar produtos por categoria
  const handleCategoryFilter = useCallback((category: string) => {
    console.log('[Catalog] Filtrando por categoria:', category);
    
    // Definir categoria selecionada
    setSelectedCategory(category);
    setCurrentPage(1);
    
    // Atualizar URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('categoria', category);
    newUrl.searchParams.set('pagina', '1');
    window.history.pushState({}, '', newUrl.toString());
    
    // Scroll to top para melhor UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`[${new Date().toISOString()}] [CATALOG] 🔍 Filtrando produtos:`, {
      category,
      action: 'filter_by_category'
    });
  }, []);

  const catalogStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Catálogo de Brindes Sustentáveis",
    "description": "Catálogo completo de brindes ecológicos e sustentáveis para empresas",
    "url": "https://naturezabrindes.com.br/catalogo",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": catalogState.totalProducts,
      "itemListElement": filteredAndSortedProducts.slice(0, 10).map((product, index) => ({
        "@type": "Product",
        "position": index + 1,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "offers": {
          "@type": "Offer",
          "availability": "https://schema.org/InStock",
          "priceCurrency": "BRL"
        }
      }))
    }
  };

  // Gerar título dinâmico baseado nos filtros
  const generateTitle = () => {
    let title = "Catálogo de Brindes Sustentáveis";
    if (searchTerm) {
      title = `${searchTerm} - Brindes Sustentáveis`;
    }
    return `${title} | Natureza Brindes`;
  };

  // Gerar descrição dinâmica
  const generateDescription = () => {
    let description = "Explore nosso catálogo completo de brindes sustentáveis e ecológicos. Mais de 500 produtos personalizados para empresas que valorizam a sustentabilidade.";
    if (searchTerm) {
      description = `Resultados da busca por "${searchTerm}" em nosso catálogo de brindes sustentáveis e ecológicos.`;
    }
    return description;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={generateTitle()}
        description={generateDescription()}
        keywords="catálogo brindes sustentáveis, produtos ecológicos, brindes personalizados, sustentabilidade empresarial, brindes corporativos ecológicos"
        url="/catalogo"
        type="website"
        structuredData={catalogStructuredData}
      />
      {/* Header do Catálogo */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Produtos</h1>
          <p className="text-gray-600">Descubra nossa linha completa de brindes sustentáveis</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Seção de Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Categorias
            </label>
            
            {/* Filtros em layout horizontal */}
            <div className="flex flex-wrap gap-2">
              {/* Botão "Todas as Categorias" */}
              <button
                onClick={handleShowAllProducts}
                disabled={catalogState.loading}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  !selectedCategory ? 'text-white border-[#2CB20B] hover:opacity-90' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={!selectedCategory ? { backgroundColor: '#2CB20B' } : {}}
              >
                Todas as Categorias
              </button>
              
              {/* Botão "Agenda" */}
              <button
                onClick={() => handleCategoryFilter('Agenda')}
                disabled={catalogState.loading}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedCategory?.toLowerCase() === 'agenda' ? 'text-white border-[#2CB20B] hover:opacity-90' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={selectedCategory?.toLowerCase() === 'agenda' ? { backgroundColor: '#2CB20B' } : {}}
              >Agenda</button>
              
              {/* Botão "Blocos e Cadernetas" */}
              <button
                onClick={() => handleCategoryFilter('Blocos e Cadernetas')}
                disabled={catalogState.loading}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedCategory?.toLowerCase() === 'blocos e cadernetas' ? 'text-white border-[#2CB20B] hover:opacity-90' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={selectedCategory?.toLowerCase() === 'blocos e cadernetas' ? { backgroundColor: '#2CB20B' } : {}}
              >Blocos e Cadernetas</button>
              
              {/* Botão "Bolsas" */}
              <button
                onClick={() => handleCategoryFilter('Bolsas')}
                disabled={catalogState.loading}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedCategory?.toLowerCase() === 'bolsas' ? 'text-white border-[#2CB20B] hover:opacity-90' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={selectedCategory?.toLowerCase() === 'bolsas' ? { backgroundColor: '#2CB20B' } : {}}
              >Bolsas</button>
              
              {/* Botão "Bolsas Térmicas" */}
              <button
                onClick={() => handleCategoryFilter('Bolsas Térmicas')}
                disabled={catalogState.loading}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedCategory?.toLowerCase() === 'bolsas térmicas' ? 'text-white border-[#2CB20B] hover:opacity-90' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={selectedCategory?.toLowerCase() === 'bolsas térmicas' ? { backgroundColor: '#2CB20B' } : {}}
              >Bolsas Térmicas</button>
              
              {/* Botão "Canecas" */}
              <button
                onClick={() => handleCategoryFilter('Canecas')}
                disabled={catalogState.loading}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedCategory?.toLowerCase() === 'canecas' ? 'text-white border-[#2CB20B] hover:opacity-90' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={selectedCategory?.toLowerCase() === 'canecas' ? { backgroundColor: '#2CB20B' } : {}}
              >Canecas</button>
              
              {/* Outras categorias como botões funcionais */}
              {SIMPLE_CATEGORIES.filter(category => 
                !['Agenda', 'Blocos e Cadernetas', 'Bolsas', 'Bolsas Térmicas', 'Canecas'].includes(category)
              ).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  disabled={catalogState.loading}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    selectedCategory?.toLowerCase() === category.toLowerCase() ? 'text-white border-[#2CB20B] hover:opacity-90' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  style={selectedCategory?.toLowerCase() === category.toLowerCase() ? { backgroundColor: '#2CB20B' } : {}}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Área Principal */}
          <div className="flex-1">
            {/* Barra de Controles */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 relative">
              {/* Loading overlay para mudanças de página */}
              {isPageChanging && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-sm text-gray-600">Carregando página...</p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  
                  <div className="flex-1 max-w-md">
                    <SearchComponent
                      onSearchChange={setSearchTerm}
                      placeholder="Buscar produtos..."
                      showSuggestions={false}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Ordenação */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Ordenar por:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="featured">Destaques</option>
                      <option value="name">Nome A-Z</option>
                    </select>
                  </div>

                  {/* Modo de Visualização */}
                  <div className="flex border border-gray-300 rounded overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid/Lista de Produtos */}
            {catalogState.loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando produtos...</p>
                </div>
              </div>
            ) : catalogState.error ? (
              <div className="text-center py-12">
                <p className="text-red-600 text-lg mb-2">{catalogState.error}</p>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros ou termos de busca</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {paginatedProducts.map((product, index) => (
                  <Link 
                    key={`${product.id}-${index}`} 
                    to={`/produto/${product.id}`}
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <Card padding="none" className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      viewMode === 'list' ? 'flex flex-row' : 'flex flex-col h-[480px] md:h-[594px]'
                    } ${
                      product.isEcological ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-white' : ''
                    }`}>
                      <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                        <div className={`bg-gray-100 rounded-lg overflow-hidden relative ${
                          viewMode === 'list' ? 'aspect-square' : 'aspect-square'
                        }`}>
                          <img
                            src={getValidImageUrl(product.images?.[0])}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => handleImageError(e, product)}
                            loading="lazy"
                            onLoad={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src.includes('placeholder') || target.getAttribute('data-fallback')) {
                                console.debug(`Placeholder carregado para produto: ${product.name}`);
                              }
                            }}
                          />
                          

                        </div>
                      </div>
                      
                      <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'ml-4' : ''}`}>
                        <Card.Content className="p-3 md:p-6 flex-1 flex flex-col">
                          {/* Título do produto */}
                          <div className="mb-3">
                            <h3 className="text-lg font-bold group-hover:opacity-90 transition-colors leading-tight line-clamp-2" style={{color: '#2CB20B'}}>
                              {product.name.length > 50 ? `${product.name.substring(0, 50)}...` : product.name}
                            </h3>
                          </div>
                          
                          {/* Botão de ação - posicionado abaixo do título */}
                          <div className="mb-4">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="w-full font-medium"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/produto/${product.id}`;
                                window.scrollTo(0, 0);
                              }}
                            >
                              Solicitar Orçamento
                            </Button>
                          </div>
                          
                          {/* Badges de sustentabilidade */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {product.sustainabilityFeatures.slice(0, 2).map(featureId => {
                              const feature = SUSTAINABILITY_FEATURES.find(f => f.id === featureId);
                              return feature ? (
                                <Badge key={featureId} variant="success" size="sm">
                                  {feature.name}
                                </Badge>
                              ) : null;
                            })}
                            {product.sustainabilityFeatures.length > 2 && (
                              <Badge variant="secondary" size="sm">
                                +{product.sustainabilityFeatures.length - 2}
                              </Badge>
                            )}
                          </div>
                        </Card.Content>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Controles de Paginação */}
            {finalCatalogState.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Informações da página */}
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, finalCatalogState.totalProducts)} de {finalCatalogState.totalProducts} produtos
                  </div>
                  
                  {/* Controles de navegação */}
                  <div className="flex items-center gap-2">
                    {/* Botão Anterior */}
                    <Button
                       variant="outline"
                       size="sm"
                       onClick={handlePreviousPage}
                       disabled={currentPage === 1 || catalogState.loading || isPageChanging}
                       className="flex items-center gap-2"
                     >
                       <ChevronLeft className="w-4 h-4" />
                       Anterior
                     </Button>
                    
                    {/* Números das páginas */}
                    <div className="flex items-center gap-1">
                      {/* Primeira página */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={1 === currentPage ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(1)}
                             disabled={catalogState.loading || isPageChanging}
                             className="w-10 h-10 p-0"
                          >
                            1
                          </Button>
                          <span className="px-2 text-gray-500">...</span>
                        </>
                      )}
                      
                      {/* Páginas próximas à atual */}
                      {Array.from({ length: Math.min(5, finalCatalogState.totalPages) }, (_, i) => {
                        let pageNum;
                        if (finalCatalogState.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= finalCatalogState.totalPages - 2) {
                          pageNum = finalCatalogState.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum < 1 || pageNum > finalCatalogState.totalPages) return null;
                        if (finalCatalogState.totalPages > 5 && currentPage > 3 && pageNum === 1) return null;
                        if (finalCatalogState.totalPages > 5 && currentPage < finalCatalogState.totalPages - 2 && pageNum === finalCatalogState.totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                             disabled={catalogState.loading || isPageChanging}
                             className="w-10 h-10 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {/* Última página */}
                      {currentPage < finalCatalogState.totalPages - 2 && finalCatalogState.totalPages > 5 && (
                        <>
                          {currentPage < finalCatalogState.totalPages - 3 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <Button
                            variant={finalCatalogState.totalPages === currentPage ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(finalCatalogState.totalPages)}
                             disabled={catalogState.loading || isPageChanging}
                             className="w-10 h-10 p-0"
                          >
                            {finalCatalogState.totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Botão Próxima */}
                    <Button
                       variant="outline"
                       size="sm"
                       onClick={handleNextPage}
                       disabled={currentPage === finalCatalogState.totalPages || catalogState.loading || isPageChanging}
                       className="flex items-center gap-2"
                     >
                       Próxima
                       <ChevronRight className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
