import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, MessageCircle, FileText, Heart, Share2, Leaf, Award, Truck, Info, Package, Star, ChevronLeft, ChevronRight, ZoomIn, Phone, X } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SEOHead from '../components/SEOHead';
import { Product } from '../../shared/types';
import { SUSTAINABILITY_FEATURES, COMPANY_INFO } from '../constants/index';
import { productsApi } from '../services/api';
import SuggestedGiftsSection from '../components/SuggestedGiftsSection';
import { useCartStore } from '../store/cartStore';
import { extractEcologicalId } from '../services/quotesService';
import { sendConfirmationEmail } from '../utils/emailService';

interface CustomizationState {
  [optionId: string]: string;
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allProductImages, setAllProductImages] = useState<string[]>([]);
  const [quantity1, setQuantity1] = useState(20); // Quantidade mínima padrão - Opção 1
  const [quantity2, setQuantity2] = useState(''); // Quantidade padrão vazia - Opção 2
  const [quantity3, setQuantity3] = useState(''); // Quantidade padrão vazia - Opção 3
  const [customizations, setCustomizations] = useState<CustomizationState>({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');


  useEffect(() => {
    console.log(`[${new Date().toISOString()}] [PRODUCT_DETAILS] 🔄 Produtos sugeridos atualizados:`, {
      totalSuggested: suggestedProducts.length,
      action: 'suggested_products_updated'
    });
  }, [suggestedProducts]);

  // Função para carregar produtos sugeridos com algoritmo inteligente
  const loadSuggestedProducts = async (currentProduct: Product) => {
    try {
      setLoadingSuggested(true);
      const response = await productsApi.getProducts();
      
      if (response.success && response.data && response.data.items) {
        const allProducts = response.data.items.filter(p => p.id !== currentProduct.id);
        
        // Função para calcular relevância baseada em múltiplos critérios
        const calculateRelevance = (product: Product): number => {
          let score = 0;
          
          // 1. Mesma categoria (peso 40)
          if (product.category === currentProduct.category) {
            score += 40;
          }
          
          // 2. Mesma categoria detalhada se disponível (peso 30)
          if (product.category && currentProduct.category && 
              product.category === currentProduct.category) {
            score += 30;
          }
          
          // 3. Palavras-chave similares no nome (peso 20)
          const currentWords = currentProduct.name.toLowerCase().split(/\s+/);
          const productWords = product.name.toLowerCase().split(/\s+/);
          
          // Palavras-chave importantes para produtos similares
          const importantKeywords = [
            'necessaire', 'nécessaire', 'sacola', 'bolsa', 'mochila', 'estojo',
            'garrafa', 'squeeze', 'copo', 'caneca', 'térmica', 'inox',
            'caderno', 'bloco', 'agenda', 'moleskine', 'notebook',
            'caneta', 'lápis', 'chaveiro', 'porta', 'organizador',
            'bambu', 'madeira', 'ecológico', 'sustentável', 'reciclado',
            'juta', 'algodão', 'lona', 'nylon', 'poliéster'
          ];
          
          let keywordMatches = 0;
          currentWords.forEach(word => {
            if (word.length > 2) { // Ignorar palavras muito pequenas
              if (productWords.some(pw => pw.includes(word) || word.includes(pw))) {
                keywordMatches++;
              }
              // Bonus para palavras-chave importantes
              if (importantKeywords.some(kw => kw.includes(word) || word.includes(kw))) {
                keywordMatches += 2;
              }
            }
          });
          
          score += Math.min(keywordMatches * 5, 20); // Máximo 20 pontos
          
          // 4. Características ecológicas similares (peso 10)
          if (product.isEcological === currentProduct.isEcological) {
            score += 10;
          }
          
          // 5. Faixa de preço similar se disponível (peso 5)
          if (product.price && currentProduct.price) {
            const priceDiff = Math.abs(product.price - currentProduct.price) / currentProduct.price;
            if (priceDiff < 0.5) { // Diferença menor que 50%
              score += 5;
            }
          }
          
          return score;
        };
        
        // Calcular relevância para todos os produtos e ordenar
        const productsWithScore = allProducts.map(product => ({
          product,
          score: calculateRelevance(product)
        }));
        
        // Ordenar por relevância (maior score primeiro)
        productsWithScore.sort((a, b) => b.score - a.score);
        
        // Pegar os 8 produtos mais relevantes
        const suggested = productsWithScore
          .slice(0, 8)
          .map(item => item.product);
        
        console.log(`[${new Date().toISOString()}] [PRODUCT_DETAILS] 🎯 Produtos sugeridos calculados:`, {
          currentProduct: currentProduct.name,
          suggestedCount: suggested.length,
          topScores: productsWithScore.slice(0, 3).map(item => ({
            name: item.product.name,
            score: item.score,
            category: item.product.category
          }))
        });
        
        setSuggestedProducts(suggested);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [PRODUCT_DETAILS] ❌ Erro ao carregar produtos sugeridos:`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoadingSuggested(false);
    }
  };

  // Carregar produto da API
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        console.error(`[${new Date().toISOString()}] [PRODUCT_DETAILS] ❌ ID do produto não fornecido:`, {
      error: 'missing_product_id',
      timestamp: new Date().toISOString()
    });
        setError('ID do produto não fornecido');
        setLoading(false);
        return;
      }

      console.log(`[${new Date().toISOString()}] [PRODUCT_DETAILS] 🔍 Carregando produto:`, {
      productId: id,
      action: 'loading_product'
    });

      try {
        setLoading(true);
        setError(null);
        
        const response = await productsApi.getProductById(id);
        console.log(`[${new Date().toISOString()}] [PRODUCT_DETAILS] 📡 Resposta da API recebida:`, {
          success: response.success,
          hasData: !!response.data,
          productId: id
        });
        
        if (response.success && response.data) {
          console.log(`[${new Date().toISOString()}] [PRODUCT_DETAILS] ✅ Produto carregado com sucesso:`, {
      productName: response.data.name,
      productId: id
    });
          setProduct(response.data);
          
          // Processar todas as imagens disponíveis (incluindo extras e variações)
          const productWithExtras = response.data as any;
          const availableImages = [];
          
          // Adicionar imagens principais
          if (productWithExtras.images && productWithExtras.images.length > 0) {
            availableImages.push(...productWithExtras.images);
          }
          
          // Adicionar imagens extras se disponíveis
          if (productWithExtras.allImages && productWithExtras.allImages.length > 0) {
            // Filtrar imagens duplicadas
            const extraImages = productWithExtras.allImages.filter(
              (img: string) => !availableImages.includes(img)
            );
            availableImages.push(...extraImages);
          }
          
          // Adicionar imagens das variações de cores se disponíveis
          if (productWithExtras.colorVariations && productWithExtras.colorVariations.length > 0) {
            productWithExtras.colorVariations.forEach((variation: any) => {
              if (variation.image && !availableImages.includes(variation.image)) {
                availableImages.push(variation.image);
              }
            });
          }
          
          setAllProductImages(availableImages);
          
          // Carregar produtos sugeridos após carregar o produto principal
          loadSuggestedProducts(response.data);
        } else {
          let errorMessage = 'Produto não encontrado ou não está disponível no momento.';
          let debugInfo = null;
          
          // Verificar se é um erro 404 específico
          if (response.error && response.error.includes('404')) {
            errorMessage = `Produto com ID '${id}' não foi encontrado em nossa base de dados.`;
            // Informações de debug não disponíveis na interface ApiResponse
            debugInfo = null;
          } else if (response.error && response.error.includes('500')) {
            errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
          } else if (response.error && response.error.includes('503')) {
            errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
          }
          
          console.error(`ProductDetails: Erro ao buscar produto ${id}:`, {
            error: response.error || errorMessage,
            debug: debugInfo,
            response
          });
          
          // Log de erro para debug
          console.log('ProductDetails: Erro ao buscar produto:', {
            id,
            error: response.error || errorMessage,
            response
          });
          
          setError(errorMessage);
        }
      } catch (error: any) {
        console.error('ProductDetails: Erro ao carregar produto:', {
          error,
          id,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // Tratamento específico para diferentes tipos de erro
        if (error.response?.status === 404) {
          setError(`Produto com ID '${id}' não foi encontrado em nossa base de dados.`);
        } else if (error.response?.status === 500) {
          setError('Erro interno do servidor. Tente novamente em alguns minutos.');
        } else if (error.response?.status === 503) {
          setError('Serviço temporariamente indisponível. Tente novamente.');
        } else if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        } else if (error.message?.includes('Failed to fetch')) {
          setError('Erro de conexão com o servidor. Verifique se o servidor está rodando.');
        } else {
          setError(`Erro inesperado ao carregar o produto: ${error.message || 'Tente novamente.'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleCustomizationChange = (optionId: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  const handleWhatsAppContact = () => {
    const message = `Olá! Gostaria de falar sobre o produto: ${product?.name}\n\nQuantidade Opção 1: ${quantity1}\nQuantidade Opção 2: ${quantity2}\nQuantidade Opção 3: ${quantity3}`;
    const whatsappUrl = `https://wa.me/${COMPANY_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const { addItem } = useCartStore();

  const handleRequestQuote = () => {
    if (!product) return;
    
    const qty1 = typeof quantity1 === 'number' ? quantity1 : parseInt(quantity1) || 0;
    const qty2 = typeof quantity2 === 'string' ? parseInt(quantity2) || 0 : quantity2;
    const qty3 = typeof quantity3 === 'string' ? parseInt(quantity3) || 0 : quantity3;
    
    // Verificar se pelo menos uma quantidade foi informada
    if (qty1 === 0 && qty2 === 0 && qty3 === 0) {
      alert('Por favor, informe pelo menos uma quantidade para solicitar o orçamento.');
      return;
    }
    
    // Obter a imagem da cor selecionada
    const getSelectedColorImage = () => {
      if (selectedColor && product.colorVariations) {
        const colorVariation = product.colorVariations.find(cv => cv.color === selectedColor);
        return colorVariation?.image || product.images?.[selectedImageIndex] || product.images?.[0] || '';
      }
      return product.images?.[selectedImageIndex] || product.images?.[0] || '';
    };

    const selectedImage = getSelectedColorImage();
    
    // Adicionar produto ao carrinho com as três quantidades em um único item
    addItem({
      id: product.id,
      name: product.name,
      image: selectedImage,
      quantity: qty1, // Quantidade principal
      quantity2: qty2 > 0 ? qty2 : undefined, // Segunda quantidade (opcional)
      quantity3: qty3 > 0 ? qty3 : undefined, // Terceira quantidade (opcional)
      selectedColor: selectedColor,
      ecologicalId: product.isEcological ? (extractEcologicalId(product.id) || undefined) : undefined,
      category: product.category,
      subcategory: product.category
    });
    
    // Redirecionar para o carrinho
    navigate('/carrinho');
  };



  // Gerar dados estruturados para o produto
  const generateProductStructuredData = () => {
    if (!product) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "category": product.category,
      "brand": {
        "@type": "Brand",
        "name": "Natureza Brindes"
      },
      "image": product.images.map(img => `https://naturezabrindes.com.br${img}`),
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        "priceCurrency": "BRL",
        "seller": {
          "@type": "Organization",
          "name": "Natureza Brindes"
        }
      },
      "additionalProperty": product.sustainabilityFeatures.map(feature => ({
        "@type": "PropertyValue",
        "name": "Característica Sustentável",
        "value": feature
      })),
      "isEcological": product.isEcological,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    const isNetworkError = error?.includes('conexão') || error?.includes('Network') || error?.includes('fetch');
    const isServerError = error?.includes('servidor') || error?.includes('500') || error?.includes('503');
    const isNotFoundError = error?.includes('não foi encontrado') || error?.includes('404');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              {isNetworkError ? (
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              ) : isNotFoundError ? (
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {isNetworkError ? 'Problema de Conexão' : 
               isServerError ? 'Serviço Indisponível' :
               isNotFoundError ? 'Produto Não Encontrado' : 
               'Erro Inesperado'}
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {error || 'O produto que você está procurando não existe ou não está mais disponível.'}
            </p>
            
            {id && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-2">ID pesquisado:</p>
                <code className="text-sm font-mono text-gray-700 bg-white px-3 py-2 rounded border">{id}</code>
              </div>
            )}
            
            {/* Dicas de solução baseadas no tipo de erro */}
            {isNetworkError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-blue-900 mb-1">Dicas para resolver:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Verifique sua conexão com a internet</li>
                      <li>• Tente recarregar a página</li>
                      <li>• Aguarde alguns minutos e tente novamente</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {isServerError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="font-medium text-yellow-900 mb-1">Serviço temporariamente indisponível</h4>
                    <p className="text-sm text-yellow-700">
                      Nossos servidores estão passando por manutenção. Tente novamente em alguns minutos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <Button onClick={() => navigate('/catalogo')} className="w-full">
              <Package className="w-4 h-4 mr-2" />
              Voltar ao Catálogo
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="flex-1"
              >
                Tentar Novamente
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const message = `Olá! Estou tendo problemas para acessar o produto com ID: ${id}. Podem me ajudar?`;
                  const whatsappUrl = `https://wa.me/${COMPANY_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Contato
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`${product.name} - Brinde Sustentável | Natureza Brindes`}
        description={`${product.description} Brinde ecológico personalizado para empresas. ${product.sustainabilityFeatures.join(', ')}.`}
        keywords={`${product.name}, brinde sustentável, ${product.category}, produto ecológico, brinde personalizado, ${product.sustainabilityFeatures.join(', ')}`}
        url={`/produto/${product.id}`}
        type="product"
        image={product.images[0] ? `https://naturezabrindes.com.br${product.images[0]}` : undefined}
        structuredData={generateProductStructuredData()}
      />
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/catalogo"
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Catálogo
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
              <img
                src={allProductImages[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isImageZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setIsImageZoomed(!isImageZoomed)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMjYwQzIzMy4xMzcgMjYwIDI2MCAyMzMuMTM3IDI2MCAyMDBDMjYwIDE2Ni44NjMgMjMzLjEzNyAxNDAgMjAwIDE0MEMxNjYuODYzIDE0MCAxNDAgMTY2Ljg2MyAxNDAgMjAwQzE0MCAyMzMuMTM3IDE2Ni44NjMgMjYwIDIwMCAyNjBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                }}
              />
              
              {/* Navegação de imagens */}
              {allProductImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : allProductImages.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex < allProductImages.length - 1 ? selectedImageIndex + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* Indicador de zoom */}
              <div className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>
              
              {/* Contador de imagens */}
              {allProductImages.length > 1 && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-sm rounded">
                  {selectedImageIndex + 1} / {allProductImages.length}
                </div>
              )}
            </div>

            {/* Miniaturas com Navegação Melhorada */}
            {allProductImages.length > 1 && (
              <div className="relative">
                <div className="flex items-center">
                  {/* Seta Esquerda */}
                  <button
                    onClick={() => {
                      const container = document.getElementById('thumbnails-container');
                      if (container) {
                        container.scrollBy({ left: -120, behavior: 'smooth' });
                      }
                    }}
                    className="flex-shrink-0 p-2 mr-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-colors z-10"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  {/* Container de Miniaturas */}
                  <div 
                    id="thumbnails-container"
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {allProductImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-primary shadow-md scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} - Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA2MkM1NS45NDEgNjIgNjIgNTUuOTQxIDYyIDQ4QzYyIDQwLjA1OSA1NS45NDEgMzQgNDggMzRDNDAuMDU5IDM0IDM0IDQwLjA1OSAzNCA0OEMzNCA1NS45NDEgNDAuMDU5IDYyIDQ4IDYyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  
                  {/* Seta Direita */}
                  <button
                    onClick={() => {
                      const container = document.getElementById('thumbnails-container');
                      if (container) {
                        container.scrollBy({ left: 120, behavior: 'smooth' });
                      }
                    }}
                    className="flex-shrink-0 p-2 ml-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-colors z-10"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">Ref: {product.reference || product.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-2 rounded-lg border transition-colors ${
                      isWishlisted
                        ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                {product.featured && (
                  <Badge variant="primary">Produto em Destaque</Badge>
                )}

                {product.category === 'tecnologia' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Produto Tecnológico
                  </Badge>
                )}

              </div>
              


              <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
            </div>

            {/* Especificações Principais Melhoradas */}
            {product.specifications && (
              <Card>
                <Card.Content className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-gray-900">Especificações Técnicas</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informações Básicas */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">Informações Básicas</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Código:</span>
                          <span className="text-gray-900 font-medium text-sm">{product.reference || product.id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Categoria:</span>
                          <span className="text-gray-900 text-sm">{product.category}</span>
                        </div>
                        {product.specifications?.material && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Material:</span>
                            <span className="text-gray-900 text-sm">{product.specifications.material}</span>
                          </div>
                        )}
                        {product.specifications?.cor && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Cor:</span>
                            <span className="text-gray-900 text-sm">{product.specifications.cor}</span>
                          </div>
                        )}
                        {product.supplier && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Fornecedor:</span>
                            <span className="text-gray-900 text-sm">{product.supplier}</span>
                          </div>
                        )}
                        {/* Fallback para produtos sem especificações dinâmicas */}
                        {!product.specifications?.material && !product.supplier && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Material:</span>
                              <span className="text-gray-900 text-sm">Algodão Orgânico</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Cor:</span>
                              <span className="text-gray-900 text-sm">Natural/Bege</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Dimensões e Peso */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">Dimensões & Peso</h4>
                      <div className="space-y-2">
                        {product.specifications?.comprimento && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Comprimento:</span>
                            <span className="text-gray-900 font-medium text-sm">{product.specifications.comprimento}</span>
                          </div>
                        )}
                        {product.specifications?.largura && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Largura:</span>
                            <span className="text-gray-900 font-medium text-sm">{product.specifications.largura}</span>
                          </div>
                        )}
                        {product.specifications?.altura && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Altura:</span>
                            <span className="text-gray-900 font-medium text-sm">{product.specifications.altura}</span>
                          </div>
                        )}
                        {product.specifications?.peso && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Peso:</span>
                            <span className="text-gray-900 font-medium text-sm">{product.specifications.peso}</span>
                          </div>
                        )}
                        {product.specifications?.volume && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Volume:</span>
                            <span className="text-gray-900 text-sm">{product.specifications.volume}</span>
                          </div>
                        )}
                        {/* Fallback para produtos sem especificações dinâmicas */}
                        {!product.specifications?.comprimento && !product.specifications?.largura && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Comprimento:</span>
                              <span className="text-gray-900 font-medium text-sm">30 cm</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Largura:</span>
                              <span className="text-gray-900 font-medium text-sm">25 cm</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Altura:</span>
                              <span className="text-gray-900 font-medium text-sm">10 cm</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Peso:</span>
                              <span className="text-gray-900 font-medium text-sm">250g</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Embalagem e Logística */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">Embalagem & Logística</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Embalagem:</span>
                          <span className="text-gray-900 text-sm">Individual</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Qtd. por Caixa:</span>
                          <span className="text-gray-900 text-sm">50 unidades</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Peso da Caixa:</span>
                          <span className="text-gray-900 text-sm">13 kg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Prazo de Entrega:</span>
                          <span className="text-gray-900 text-sm">5-7 dias úteis</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Origem:</span>
                          <span className="text-gray-900 text-sm">Nacional</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações Adicionais em Destaque */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Leaf className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">100% Sustentável</p>
                          <p className="text-xs text-gray-600">Material reciclável</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Certificado</p>
                          <p className="text-xs text-gray-600">ISO 14001</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Truck className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Entrega Rápida</p>
                          <p className="text-xs text-gray-600">Todo o Brasil</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Variações de Cores com Quadrados Coloridos */}
            {product.colorVariations && product.colorVariations.length > 0 && (
              <Card>
                <Card.Content className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Cores Disponíveis</h3>
                  
                  {/* Select dropdown para cores */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecionar Cor
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        setSelectedColor(newColor);
                        
                        // Encontrar a imagem correspondente à cor selecionada
                        if (newColor) {
                          const colorImage = allProductImages.find(img => 
                            img.toLowerCase().includes(newColor.toLowerCase()) ||
                            product.colorVariations?.find(cv => cv.color === newColor)?.image === img
                          );
                          if (colorImage) {
                            const imageIndex = allProductImages.indexOf(colorImage);
                            setSelectedImageIndex(imageIndex);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Selecionar cor</option>
                      {product.colorVariations.map((variation) => (
                        <option key={variation.color} value={variation.color}>
                          {variation.color.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {product.colorVariations.map((variation, index) => {
                      // Mapear nomes de cores para códigos hexadecimais
                      const getColorCode = (colorName: string) => {
                        const colorMap: { [key: string]: string } = {
                          'preto': '#000000',
                          'azul': '#0066CC',
                          'branco': '#FFFFFF',
                          'cinza': '#808080',
                          'bordô': '#800020',
                          'verde escuro': '#006400',
                          'verde': '#008000',
                          'verde claro': '#90EE90',
                          'vermelho': '#FF0000',
                          'amarelo': '#FFFF00',
                          'rosa': '#FFC0CB',
                          'laranja': '#FFA500',
                          'roxo': '#800080',
                          'marrom': '#8B4513',
                          'bege': '#F5F5DC',
                          'navy': '#000080',
                          'azul marinho': '#000080',
                          'natural': '#F5F5DC',
                          'turquesa': '#40E0D0'
                        };
                        return colorMap[colorName.toLowerCase()] || '#CCCCCC';
                      };
                      
                      // Verificar se a cor está selecionada
                      const isSelected = selectedColor === variation.color;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            // Encontrar a imagem correspondente à cor
                            const colorImage = allProductImages.find(img => 
                              img.toLowerCase().includes(variation.color.toLowerCase()) ||
                              variation.image === img
                            );
                            if (colorImage) {
                              const imageIndex = allProductImages.indexOf(colorImage);
                              setSelectedImageIndex(imageIndex);
                            }
                            // Salvar a cor selecionada (isso também atualizará o select)
                            setSelectedColor(variation.color);
                          }}
                          className={`group flex flex-col items-center gap-2 p-2 rounded-lg transition-all hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <div 
                            className={`w-12 h-12 rounded-lg border-2 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-blue-500 shadow-lg scale-110' 
                                : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                            } ${
                              variation.color.toLowerCase() === 'branco' ? 'shadow-inner' : ''
                            }`}
                            style={{ 
                              backgroundColor: getColorCode(variation.color),
                              boxShadow: variation.color.toLowerCase() === 'branco' 
                                ? 'inset 0 0 0 1px #e5e7eb' 
                                : undefined
                            }}
                          />
                          <span className="text-xs text-gray-700 font-medium capitalize text-center leading-tight">
                            {variation.color}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * Clique na cor para visualizar a imagem correspondente
                  </p>
                </Card.Content>
              </Card>
            )}

            {/* Campo de Quantidade */}
            <Card>
              <Card.Content className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Quantidade</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quantidade Opção 1 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade Opção 1
                    </label>
                    <input
                      type="number"
                      min="20"
                      step="10"
                      value={quantity1}
                      onChange={(e) => setQuantity1(Math.max(20, parseInt(e.target.value) || 20))}
                      className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Quantidade Opção 2 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade Opção 2
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={quantity2}
                      onChange={(e) => setQuantity2(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0).toString())}
                      className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder=""
                    />
                  </div>

                  {/* Quantidade Opção 3 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade Opção 3
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={quantity3}
                      onChange={(e) => setQuantity3(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0).toString())}
                      className="w-full px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder=""
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Botões de Ação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleWhatsAppContact}
                className="flex items-center justify-center gap-2 bg-[#2CB20B] hover:bg-[#25A009]"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com o consultor
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleRequestQuote}
                className="flex items-center justify-center gap-2 bg-transparent hover:bg-[#2CB20B] text-[#2CB20B] hover:text-white border-[#2CB20B] transition-colors"
              >
                <FileText className="w-4 h-4" />
                Solicitar Orçamento
              </Button>
            </div>

            {/* Características de Sustentabilidade */}
            {product.isEcological && (
              <Card>
                <Card.Content className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Características Sustentáveis</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">
                      Produto Ecológico
                    </Badge>
                    <Badge variant="success">
                      Material Reciclável
                    </Badge>
                    <Badge variant="success">
                      Baixo Impacto Ambiental
                    </Badge>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Características de Produtos Tecnológicos */}
            {product.category === 'tecnologia' && (
              <Card>
                <Card.Content className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Características do Produto</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Produto Tecnológico
                    </Badge>
                    <Badge variant="secondary">
                      Alta Qualidade
                    </Badge>
                    <Badge variant="secondary">
                      Preço Competitivo
                    </Badge>
                    <Badge variant="secondary">
                      Variedade de Cores
                    </Badge>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <Award className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium text-gray-900">Qualidade</div>
                  <div className="text-sm text-gray-600">Garantida</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <Truck className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium text-gray-900">Entrega</div>
                  <div className="text-sm text-gray-600">Todo Brasil</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <Leaf className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium text-gray-900">Sustentável</div>
                  <div className="text-sm text-gray-600">100% Eco</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Seção de Abas com Informações Detalhadas - Largura Total */}
        <div className="mt-12">
          <Card>
            <Card.Content className="p-0">
              {/* Navegação das Abas */}
              <div className="flex border-b">
                {[
                  { id: 'description', label: 'Descrição', icon: Info }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-primary border-b-2 border-primary bg-primary/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Conteúdo das Abas */}
              <div className="p-6">
                {activeTab === 'description' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Descrição Detalhada</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {product.description}
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      Este produto foi desenvolvido com foco na sustentabilidade e qualidade, 
                      utilizando materiais reciclados e processos de produção que respeitam o meio ambiente. 
                      Ideal para empresas que valorizam a responsabilidade social e ambiental.
                    </p>

                  </div>
                )}

                {activeTab === 'specifications' && product.specifications && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Especificações Técnicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Seção de Produtos Recomendados - Antes do Footer */}
        {suggestedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Produtos Relacionados</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Descubra outros produtos que podem interessar você, selecionados especialmente 
                com base nas suas preferências e na categoria deste produto.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <SuggestedGiftsSection suggestions={suggestedProducts} />
              
              {/* Call to Action para ver mais produtos */}
              <div className="text-center mt-8 pt-6 border-t border-gray-100">
                <p className="text-gray-600 mb-4">Não encontrou o que procurava?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => navigate('/catalogo')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Ver Todo o Catálogo
                  </Button>
                  <Button 
                    onClick={handleWhatsAppContact}
                    className="flex items-center gap-2 bg-[#2CB20B] hover:bg-[#25A009]"
                  >
                    <Phone className="w-4 h-4" />
                    Falar com Consultor
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      

    </div>
  );
}