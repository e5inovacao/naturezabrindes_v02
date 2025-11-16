import express, { Request, Response } from 'express';
import { Product, PaginatedResponse, ApiResponse, ProductCategory, SustainabilityFeature } from '../../shared/types.js';
import { supabaseAdmin } from '../../supabase/server.ts';

const router = express.Router();

// Função para normalizar texto removendo acentos
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}



// Função auxiliar para gerar IDs consistentes para produtos ecológicos
function generateConsistentEcologicId(data: any): string {
  // Usar o código do produto se disponível, senão usar o ID da base de dados
  const baseId = data.codigo || data.id?.toString() || 'unknown';
  return `ecologic-${baseId}`;
}

// Função auxiliar para mapear produtos da tabela ecologic_products_site para o tipo Product
function mapEcologicToProduct(data: any): Product & {
  isEcological?: boolean;
  isExternal?: boolean;
  externalSource?: string;
  supplier?: string;
  supplierCode?: string;
  reference?: string;
  ecologicDatabaseId?: number;
  allImages?: string[];
} {
  // Coletar todas as imagens disponíveis dos campos img_0, img_1, img_2
  const images = [];
  if (data.img_0) images.push(data.img_0);
  if (data.img_1) images.push(data.img_1);
  if (data.img_2) images.push(data.img_2);

  // Processar variações de cores e suas imagens
  const colorVariations = [];
  if (data.variacoes && Array.isArray(data.variacoes)) {
    data.variacoes.forEach((variacao: any) => {
      if (variacao.cor && variacao.link_image) {
        colorVariations.push({
          color: variacao.cor,
          image: variacao.link_image
        });
        // Adicionar imagem da variação às imagens gerais se não estiver presente
        if (!images.includes(variacao.link_image)) {
          images.push(variacao.link_image);
        }
      }
    });
  }

  // Processar categorias com mapeamento inteligente
  let category: ProductCategory = 'ecologicos';
  
  // Primeiro, verificar categoria explícita (as categorias são hierárquicas separadas por |)
  if (data.categoria) {
    const categoryStr = data.categoria.toString().toLowerCase();
    
    // Mapear categorias hierárquicas para os tipos válidos
    if (categoryStr.includes('canetas') || categoryStr.includes('escritório') || 
        categoryStr.includes('escritorio') || categoryStr.includes('blocos') ||
        categoryStr.includes('cadernos') || categoryStr.includes('anotações')) {
      category = 'papelaria';
    } else if (categoryStr.includes('bolsas') || categoryStr.includes('mochilas') ||
               categoryStr.includes('sacolas') || categoryStr.includes('nécessaire')) {
      category = 'acessorios';
    } else if (categoryStr.includes('canecas') || categoryStr.includes('garrafas') ||
               categoryStr.includes('copos') || categoryStr.includes('xícaras')) {
      category = 'casa-escritorio';
    } else if (categoryStr.includes('malas') || categoryStr.includes('maletas')) {
      category = 'textil';
    } else if (categoryStr.includes('chaveiros') || categoryStr.includes('diversos')) {
      category = 'acessorios';
    } else {
      category = 'ecologicos';
    }
  }
  
  // Mapeamento inteligente baseado no título e descrição para 'Escritório e Papelaria'
  const title = (data.titulo || '').toLowerCase();
  const description = (data.descricao || '').toLowerCase();
  const combinedText = `${title} ${description}`;
  
  // Palavras-chave para Escritório e Papelaria
  const officeKeywords = [
    'caneta', 'canetas', 'pen', 'pens',
    'bloco', 'blocos', 'notepad', 'notepads',
    'caderno', 'cadernos', 'notebook', 'notebooks',
    'agenda', 'agendas', 'planner', 'planners',
    'lápis', 'lapis', 'pencil', 'pencils',
    'adesivo', 'adesivos', 'sticker', 'stickers',
    'papel', 'papeis', 'paper',
    'escritório', 'escritorio', 'office',
    'papelaria', 'stationery',
    'marca-texto', 'marcador', 'highlighter',
    'régua', 'ruler',
    'borracha', 'eraser',
    'grampeador', 'stapler',
    'clips', 'clipe',
    'post-it', 'sticky notes'
  ];
  
  // Se não foi categorizado como papelaria mas contém palavras-chave, reclassificar
  if (category !== 'papelaria' && category !== 'casa-escritorio') {
    const hasOfficeKeyword = officeKeywords.some(keyword => 
      combinedText.includes(keyword)
    );
    
    if (hasOfficeKeyword) {
      category = 'papelaria'; // Reclassificar como papelaria
      console.log(`[DEBUG] Produto reclassificado como papelaria: ${title}`);
    }
  }

  // Processar preço
  let price = 0;
  if (data.preco) {
    price = typeof data.preco === 'number' ? data.preco : parseFloat(data.preco) || 0;
  }

  // Verificar se está em estoque
  const inStock = data.status !== 'indisponivel' && data.status !== 'esgotado';

  // Verificar se está em promoção
  const featured = data.promocao === true || data.promocao === 'true' || data.promocao === 1;

  return {
    id: generateConsistentEcologicId(data),
    name: data.titulo || 'Produto Ecológico',
    description: data.descricao || 'Produto sem descrição disponível',
    category: category,
    images: images,
    sustainabilityFeatures: ['sustentavel'] as SustainabilityFeature[],
    customizationOptions: [], // Não há campo específico para variações na nova estrutura
    price: price,
    inStock: inStock,
    featured: featured,
    // Propriedades específicas para produtos ecológicos
    isEcological: true,
    isExternal: false,
    externalSource: 'Supabase',
    supplier: 'Ecologic',
    supplierCode: data.codigo || null,
    reference: data.codigo || null,
    ecologicDatabaseId: data.id,
    allImages: images,
    // Dimensões físicas
    dimensions: {
      height: data.altura ? parseFloat(data.altura) : undefined,
      width: data.largura ? parseFloat(data.largura) : undefined,
      length: data.comprimento ? parseFloat(data.comprimento) : undefined,
      weight: data.peso ? parseFloat(data.peso) : undefined
    },
    // Cor principal
    primaryColor: data.cor_web_principal || undefined,
    // Variações de cores com suas imagens
    colorVariations: colorVariations
  };
}





// GET /api/products/highlighted - Buscar produtos em destaque da tabela produtos_destaque
router.get('/highlighted', async (req: Request, res: Response) => {
  try {
    const { limit = '6' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    console.log(`[DEBUG] Buscando produtos em destaque com limite: ${limitNum}`);
    
    // Buscar produtos em destaque com JOIN para obter dados completos
    const { data: highlightedData, error } = await supabaseAdmin
      .from('produtos_destaque')
      .select(`
        *,
        ecologic_products_site!produtos_destaque_id_produto_fkey(*)
      `)
      .eq('ecologic_products_site.status_active', true)
      .limit(limitNum);

    if (error) {
      console.error(`[${new Date().toISOString()}] [PRODUCTS] Erro ao buscar produtos em destaque:`, error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar produtos em destaque'
      });
    }

    console.log(`[DEBUG] Produtos em destaque encontrados: ${highlightedData?.length || 0}`);
    
    // Mapear produtos em destaque
    const highlightedProducts = highlightedData?.map(item => {
      const productData = item.ecologic_products_site;
      if (productData) {
        return mapEcologicToProduct(productData);
      }
      return null;
    }).filter(Boolean) || [];

    console.log(`[DEBUG] Produtos mapeados: ${highlightedProducts.length}`);

    res.json({
      success: true,
      data: highlightedProducts
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [PRODUCTS] Erro ao buscar produtos em destaque:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/products - Listar todos os produtos com paginação
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, sort, category, page = '1', limit = '50' } = req.query;
    
    // Converter parâmetros de paginação para números
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(2000, parseInt(limit as string, 10) || 100)); // Máximo 2000 itens por página, padrão 100
    
    console.log('[DEBUG] Parâmetros recebidos:', { search, sort, category, page: pageNum, limit: limitNum });
    
    // Buscar produtos da tabela ecologic_products_site
    console.log('[DEBUG] Iniciando consulta à tabela ecologic_products_site...');
    const { data: ecologicProducts, error } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*')
      .eq('status_active', true);
    
    console.log('[DEBUG] Consulta concluída. Dados:', {
      hasData: !!ecologicProducts,
      dataLength: ecologicProducts?.length || 0,
      hasError: !!error,
      errorDetails: error
    });
    
    if (error) {
      console.error('[ERROR] Erro ao buscar produtos ecológicos do Supabase:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        debug: { supabaseError: error }
      });
    }
    
    console.log(`[DEBUG] Produtos ecológicos encontrados: ${ecologicProducts?.length || 0}`);
    
    // Log dos primeiros produtos para debug
    if (ecologicProducts && ecologicProducts.length > 0) {
      console.log('[DEBUG] Primeiro produto encontrado:', JSON.stringify(ecologicProducts[0], null, 2));
    }
    
    // Mapear produtos ecológicos
    const mappedProducts = ecologicProducts?.map(mapEcologicToProduct) || [];
    
    console.log(`[DEBUG] Total de produtos mapeados: ${mappedProducts.length}`);
    console.log(`[DEBUG] Primeiros 3 IDs gerados: ${mappedProducts.slice(0, 3).map(p => p.id).join(', ')}`);
    
    if (mappedProducts.length === 0) {
      console.log('[DEBUG] Nenhum produto encontrado no banco de dados');
      return res.json({ 
        success: true,
        data: []
      });
    }
    
    // Aplicar filtros
    let filteredProducts = mappedProducts;
    
    // Filtro por busca com algoritmo melhorado
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      console.log(`[DEBUG] Aplicando filtro de busca: "${searchTerm}"`);
      
      // Dividir o termo de busca em palavras para busca mais flexível
      const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
      
      // Mapear produtos com pontuação de relevância
      const productsWithScore = filteredProducts.map(product => {
        const productName = normalizeText(product.name);
        const normalizedSearchTerm = normalizeText(searchTerm);
        const normalizedSearchWords = searchWords.map(word => normalizeText(word));
        
        let score = 0;
        
        // Pontuação alta para correspondência exata no nome (100 pontos)
        if (productName.includes(normalizedSearchTerm)) {
          score += 100;
        }
        
        // Pontuação para palavras individuais no nome (20 pontos por palavra)
        normalizedSearchWords.forEach(word => {
          if (productName.includes(word)) {
            score += 20;
          }
        });
        
        // Pontuação alta para correspondência exata em supplierCode ou reference (150 pontos)
        if (product.supplierCode && product.supplierCode.toString() === searchTerm) {
          score += 150;
        }
        if (product.reference && product.reference.toString() === searchTerm) {
          score += 150;
        }
        
        // Pontuação para correspondência parcial em supplierCode ou reference (80 pontos)
        if (product.supplierCode && product.supplierCode.toString().includes(searchTerm)) {
          score += 80;
        }
        if (product.reference && product.reference.toString().includes(searchTerm)) {
          score += 80;
        }
        
        // Bonus para correspondência no início do nome (50 pontos)
        if (productName.startsWith(normalizedSearchTerm)) {
          score += 50;
        }
        
        // Penalidade para produtos com termos irrelevantes quando busca por categoria específica
        if (searchTerm === 'bolsa' || searchTerm === 'bolsas') {
          // Penalizar produtos que claramente não são bolsas
          const irrelevantTerms = ['caneta', 'lápis', 'agenda', 'caderno', 'bloco', 'adesivo', 'alicate', 'ferramenta'];
          const hasIrrelevantTerm = irrelevantTerms.some(term => 
            productName.includes(term)
          );
          if (hasIrrelevantTerm) {
            score -= 30; // Penalidade significativa
          }
          
          // Bonus para produtos que são claramente bolsas
          const relevantTerms = ['bolsa', 'sacola', 'mochila', 'necessaire', 'ecobag', 'bag'];
          const hasRelevantTerm = relevantTerms.some(term => 
            productName.includes(term)
          );
          if (hasRelevantTerm) {
            score += 30; // Bonus para relevância
          }
        }
        
        return { product, score };
      });
      
      // Filtrar apenas produtos com pontuação > 0 e ordenar por relevância
      filteredProducts = productsWithScore
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);
      
      console.log(`[DEBUG] Produtos após filtro de busca: ${filteredProducts.length}`);
    } else {
      console.log(`[DEBUG] Sem filtro de busca aplicado - mantendo todos os produtos: ${filteredProducts.length}`);
    }
    
    // Filtro por categoria
    if (category && typeof category === 'string' && category.trim() && category.trim().toLowerCase() !== 'all') {
      const categoryTerm = category.trim().toLowerCase();
      console.log(`[DEBUG] Aplicando filtro de categoria: "${categoryTerm}"`);
      
      filteredProducts = filteredProducts.filter(product => {
        // Filtros específicos para categorias especiais
        if (categoryTerm === 'canetas') {
          // Para canetas, buscar por produtos que contenham 'caneta' no nome ou descrição
          const productName = normalizeText(product.name);
          const productDescription = normalizeText(product.description || '');
          const searchTerm = normalizeText('caneta');
          return productName.includes(searchTerm) || productDescription.includes(searchTerm);
        } else if (categoryTerm === 'canecas') {
          // Para canecas, buscar por produtos que contenham 'caneca' no nome ou descrição
          const productName = normalizeText(product.name);
          const productDescription = normalizeText(product.description || '');
          const searchTerm = normalizeText('caneca');
          return productName.includes(searchTerm) || productDescription.includes(searchTerm);
        } else {
          // Filtro genérico por categoria
          return product.category.toLowerCase().includes(categoryTerm);
        }
      });
      
      console.log(`[DEBUG] Produtos após filtro de categoria: ${filteredProducts.length}`);
    } else {
      console.log(`[DEBUG] Sem filtro de categoria aplicado - retornando todos os produtos: ${filteredProducts.length}`);
    }
    
    // Aplicar ordenação
    switch (sort) {
      case 'name_asc':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'category_asc':
        filteredProducts.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'category_desc':
        filteredProducts.sort((a, b) => b.category.localeCompare(a.category));
        break;
      default:
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Calcular paginação
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    console.log(`[DEBUG] Paginação: página ${pageNum} de ${totalPages}, ${paginatedProducts.length} produtos de ${totalItems} total`);
    
    // Retornar produtos paginados com metadados
    const response: ApiResponse<PaginatedResponse<Product>> = {
      success: true,
      data: {
        items: paginatedProducts,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [PRODUCTS] Erro ao buscar produtos:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});



// Rota para buscar um produto específico por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Buscando produto com ID: ${id}`);
    
    // Buscar produtos da tabela ecologic_products_site
    const { data: ecologicProducts, error: ecologicFetchError } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*');
    
    if (ecologicFetchError) {
      console.error('[ERROR] Erro ao buscar produtos ecológicos do Supabase:', ecologicFetchError);
      return res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor' 
      });
    }
    
    // Mapear produtos ecológicos
    const mappedProducts = ecologicProducts?.map(mapEcologicToProduct) || [];
    
    if (mappedProducts.length === 0) {
      console.log('[DEBUG] Nenhum produto encontrado no banco de dados');
      return res.status(404).json({ 
        success: false,
        error: 'Nenhum produto encontrado',
        debug: {
          searchedId: id,
          totalProducts: 0
        }
      });
    }
    
    console.log(`[DEBUG] Total de produtos encontrados no banco: ${mappedProducts.length}`);
    console.log(`[DEBUG] Primeiros 3 IDs gerados: ${mappedProducts.slice(0, 3).map(p => p.id).join(', ')}`);
    
    // Estratégia 1: Busca exata por ID
    let product = mappedProducts.find(p => p.id === id);
    console.log(`[DEBUG] Estratégia 1 (busca exata): ${product ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    
    // Estratégia 2: Se não encontrou, tentar buscar por código
    if (!product) {
      console.log('[DEBUG] Tentando estratégia 2 (busca alternativa)');
      
      // Extrair possíveis valores do ID para busca alternativa
      const idParts = id.replace('ecologic_', '').split('_');
      
      product = mappedProducts.find(p => {
        // Buscar nos produtos ecológicos
        const ecologicData = ecologicProducts?.find(raw => generateConsistentEcologicId(raw) === p.id);
        if (ecologicData) {
          const matches = idParts.some(part => 
            (ecologicData.codigo && ecologicData.codigo.toString().includes(part)) ||
            (ecologicData.titulo && ecologicData.titulo.toLowerCase().includes(part.toLowerCase()))
          );
          
          if (matches) {
            console.log(`[DEBUG] Produto ecológico encontrado na estratégia 2 - Código: ${ecologicData.codigo}, Título: ${ecologicData.titulo}`);
          }
          
          return matches;
        }
        
        return false;
      });
      console.log(`[DEBUG] Estratégia 2: ${product ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    }
    
    // Estratégia 3: Busca por similaridade de nome
    if (!product && id.length > 3) {
      console.log('[DEBUG] Tentando estratégia 3 (busca por similaridade)');
      const searchTerm = id.replace('ecologic_', '').replace(/_/g, ' ').toLowerCase();
      console.log(`[DEBUG] Termo de busca normalizado: ${searchTerm}`);
      
      product = mappedProducts.find(p => {
        const productName = p.name.toLowerCase();
        const matches = productName.includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm));
        
        if (matches) {
          console.log(`[DEBUG] Produto encontrado na estratégia 3 - Nome: ${p.name}`);
        }
        
        return matches;
      });
      console.log(`[DEBUG] Estratégia 3: ${product ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    }
    
    if (!product) {
      console.log(`[DEBUG] Produto não encontrado após todas as estratégias. ID buscado: ${id}`);
      console.log(`[DEBUG] IDs disponíveis (primeiros 10): ${mappedProducts.slice(0, 10).map(p => p.id).join(', ')}`);
      
      return res.status(404).json({ 
        success: false,
        error: 'Produto não encontrado',
        debug: {
          searchedId: id,
          totalProducts: mappedProducts.length,
          sampleIds: mappedProducts.slice(0, 5).map(p => p.id)
        }
      });
    }
    
    console.log(`[DEBUG] Produto encontrado com sucesso: ${product.name} (ID: ${product.id})`);
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('[ERROR] Erro na rota de produto por ID:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/products/featured - Buscar produtos em destaque (primeiros da lista)
router.get('/featured/list', async (req: Request, res: Response) => {
  try {
    const { limit = '4' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    // Buscar produtos da tabela ecologic_products_site
    const { data: productsData, error } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('*')
      .limit(limitNum);

    if (error) {
      console.error(`[${new Date().toISOString()}] [PRODUCTS] Erro ao buscar produtos em destaque:`, error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar produtos em destaque'
      });
    }

    const featuredProducts = productsData?.map(mapEcologicToProduct) || [];

    res.json({
      success: true,
      data: featuredProducts
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [PRODUCTS] Erro ao buscar produtos em destaque:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});



// GET /api/products/categories - Listar categorias disponíveis
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    // Buscar categorias únicas da tabela ecologic_products_site
    const { data: productsData, error } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('categoria');

    if (error) {
      console.error(`[${new Date().toISOString()}] [PRODUCTS] Erro ao buscar categorias:`, error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar categorias'
      });
    }

    // Extrair categorias únicas
    const allCategories = new Set<string>();
    
    productsData?.forEach(product => {
      if (product.categoria) {
        // A coluna categoria é uma string simples
        if (typeof product.categoria === 'string') {
          allCategories.add(product.categoria.trim());
        }
      }
    });
    
    const categories = Array.from(allCategories).map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, '_'),
      name: cat
    }));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [PRODUCTS] Erro ao buscar categorias:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;


// Função de pontuação (ajustada para busca apenas por name, com keywords expandidas)
const calculateScore = (product: Product, searchTerms: string[], category?: ProductCategory) => {
  let score = 0;
  
  // Pontuação por name (apenas título, com normalização)
  const nameNormalized = normalizeText(product.name);
  searchTerms.forEach(term => {
    const termNormalized = normalizeText(term);
    if (nameNormalized.includes(termNormalized)) {
      score += 3; // Peso alto para match no título
    }
  });
  
  // Expansão de keywords para categorias (sem usar description)
  const categoryKeywords: { [key: string]: string[] } = {
    'casa-escritorio': ['copo', 'copos', 'garrafa', 'garrafas', 'squeeze', 'squeezes', 'termica', 'reutilizavel'], // Expandido para copos e garrafas
    'tecnologia': ['pen-drive', 'carregador', 'suporte', 'solar', 'bluetooth', 'usb'], // Expandido para tecnologia
    // ... outras categorias ...
  };
  
  if (category && categoryKeywords[category]) {
    categoryKeywords[category].forEach(keyword => {
      if (nameNormalized.includes(normalizeText(keyword))) {
        score += 2; // Peso para keywords de categoria no título
      }
    });
  }
  
  // Log para depuração
  if (category === 'casa-escritorio') {
    console.log(`[API] Pontuação para produto em casa-escritorio: ${product.name} - Score: ${score}`);
  }
  
  return score;
};

// PUT /api/products/:code/deactivate - Desativar produto (status_active=false)
router.put('/:code/deactivate', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const numeric = /^\d+$/.test(code) ? parseInt(code, 10) : null;

    // Tentar por codigo
    const { data: byCodigo } = await supabaseAdmin
      .from('ecologic_products_site')
      .select('id, codigo')
      .eq('codigo', code)
      .limit(1);

    let targetId: number | null = null;
    if (Array.isArray(byCodigo) && byCodigo.length > 0) {
      targetId = byCodigo[0].id as number;
    }

    // Se não achou pelo codigo e for numérico, tentar por id
    if (!targetId && numeric !== null) {
      const { data: byId } = await supabaseAdmin
        .from('ecologic_products_site')
        .select('id')
        .eq('id', numeric)
        .limit(1);
      if (Array.isArray(byId) && byId.length > 0) {
        targetId = byId[0].id as number;
      }
    }

    if (!targetId) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('ecologic_products_site')
      .update({ status_active: false })
      .eq('id', targetId);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Erro ao desativar produto' });
    }

    res.json({ success: true, data: { id: targetId, status_active: false } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});
