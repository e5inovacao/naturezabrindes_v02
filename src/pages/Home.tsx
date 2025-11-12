import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Search,
  ArrowRight,
  Leaf,
  Recycle,
  TreePine,
  Shield,
  Star,
  Users,
  Award,
  CheckCircle,
  Globe,
  Heart,
  Package,
  Home as HomeIcon,
  Smartphone,
  Shirt,
  PenTool,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { SUSTAINABILITY_FEATURES, PRODUCT_CATEGORIES } from '../constants';
import { Product } from '../../shared/types';
import { productsApi } from '../services/api';
import SEOHead from '../components/SEOHead';
import HighlightedProducts from '../components/HighlightedProducts';

// Códigos de produtos específicos - fácil manutenção


interface HomeState {
  bagProducts: Product[];
  bottleProducts: Product[];
  notebookProducts: Product[];
  thermalBagProducts: Product[];
  bagLoading: boolean;
  bottleLoading: boolean;
  notebookLoading: boolean;
  thermalBagLoading: boolean;
  bagError: string | null;
  bottleError: string | null;
  notebookError: string | null;
  thermalBagError: string | null;
}

// Componentes de setas customizadas para o carrossel
const CustomPrevArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
    style={{ zIndex: 2 }}
  >
    <ChevronLeft className="w-5 h-5 text-gray-700" />
  </button>
);

const CustomNextArrow = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
    style={{ zIndex: 2 }}
  >
    <ChevronRight className="w-5 h-5 text-gray-700" />
  </button>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<HomeState>({
    bagProducts: [],
    bottleProducts: [],
    notebookProducts: [],
    thermalBagProducts: [],
    bagLoading: true,
    bottleLoading: true,
    notebookLoading: true,
    thermalBagLoading: true,
    bagError: null,
    bottleError: null,
    notebookError: null,
    thermalBagError: null,
  });

  // Função para normalização padronizada de strings
  const norm = (s: string) => 
    s?.toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  // Função para verificação consistente de estado ativo
  const isActive = (selected?: string, label?: string) => 
    norm(selected || '') === norm(label || '');

  // Função para navegar para o catálogo com filtro de categoria
  const handleCategoryFilter = (category: string) => {
    console.log('[Home] Navegando para catálogo com categoria:', category);
    
    // Normalizar a categoria antes de usar
    const normalizedCategory = norm(category);
    
    // Navegar para o catálogo com parâmetros de URL
    const url = new URL('/catalogo', window.location.origin);
    url.searchParams.set('categoria', category); // Usar categoria original para URL
    url.searchParams.set('pagina', '1');
    
    navigate(`/catalogo?categoria=${encodeURIComponent(category)}&pagina=1`);
  };

  // Configurações do carrossel
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    dotsClass: "slick-dots custom-dots",
    appendDots: (dots: React.ReactNode) => (
      <div className="custom-dots-container">
        <ul> {dots} </ul>
      </div>
    ),
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: false,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          centerMode: true,
          centerPadding: '20px',
        }
      }
    ]
  };

  useEffect(() => {
    const loadBagProducts = async () => {
      try {
        setState(prev => ({ ...prev, bagLoading: true, bagError: null }));
        
        // Códigos específicos de sacolas solicitados
        const bagCodes = ['92823', '94239', '93281', '91773', '92372'];
        const bagProducts: Product[] = [];
        
        console.log(`[${new Date().toISOString()}] [HOME] 🔍 Carregando produtos de sacolas:`, {
      codes: bagCodes,
      totalCodes: bagCodes.length
    });
        
        // Buscar cada produto pelo código de referência
        for (const code of bagCodes) {
          try {
            const response = await productsApi.getProducts({
              search: code,
              limit: 1
            });
            if (response.success && response.data && response.data.items && response.data.items.length > 0) {
              bagProducts.push(response.data.items[0]);
              console.log(`✅ Produto encontrado para código ${code}:`, response.data.items[0].name);
            } else {
              console.warn(`[${new Date().toISOString()}] [HOME] ⚠️ Produto não encontrado:`, {
          code,
          productType: 'sacola'
        });
            }
          } catch (error) {
            console.warn(`[${new Date().toISOString()}] [HOME] ❌ Erro ao buscar produto:`, {
          code,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          productType: 'sacola'
        });
          }
        }
        
        // Se não encontrou produtos específicos, buscar por sacolas como fallback
        if (bagProducts.length === 0) {
          console.log(`[${new Date().toISOString()}] [HOME] 🔄 Usando fallback:`, {
      searchTerm: 'sacola',
      reason: 'no_products_found_by_codes'
    });
          const fallbackResponse = await productsApi.getProducts({
            search: 'sacola',
            limit: 4
          });
          if (fallbackResponse.success && fallbackResponse.data && fallbackResponse.data.items) {
            bagProducts.push(...fallbackResponse.data.items.slice(0, 4));
          }
        }
        
        setState(prev => ({ 
          ...prev, 
          bagProducts: bagProducts, 
          bagLoading: false 
        }));
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [HOME] ❌ Erro ao carregar produtos de sacolas:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          productType: 'sacolas'
        });
        setState(prev => ({ 
          ...prev, 
          bagError: 'Erro ao carregar produtos de sacolas', 
          bagLoading: false 
        }));
      }
    };

    const loadBottleProducts = async () => {
      try {
        setState(prev => ({ ...prev, bottleLoading: true, bottleError: null }));

        // Consultar múltiplos termos relevantes para ampliar resultados
        const terms = ['garrafa', 'squeeze', 'térmica', 'inox'];
        const aggregated: Product[] = [];

        for (const term of terms) {
          try {
            const resp = await productsApi.getProducts({ search: term, limit: 8 });
            if (resp.success && resp.data?.items?.length) {
              // Evitar duplicatas por id
              resp.data.items.forEach((item: any) => {
                if (!aggregated.find(p => p.id === item.id)) aggregated.push(item);
              });
            }
          } catch (e) {
            console.warn(`[${new Date().toISOString()}] [HOME] ⚠️ Falha parcial ao buscar termo`, { term, error: e instanceof Error ? e.message : String(e) });
          }
        }

        // Aplicar filtro de relevância e usar seu tamanho para renderização
        const filtered = aggregated.filter(product => {
          const productName = product.name?.toLowerCase() || '';
          const includeTerms = ['garrafa', 'squeeze', 'térmica', 'inox', 'vacuum', 'vácuo'];
          const hasIncludeTerm = includeTerms.some(term => productName.includes(term));
          const excludeTerms = ['porta', 'abridor de garrafa', 'garrafa bebedouro'];
          const hasExcludeTerm = excludeTerms.some(term => productName.includes(term));
          return hasIncludeTerm && !hasExcludeTerm;
        });

        setState(prev => ({ 
          ...prev, 
          bottleProducts: filtered.length ? filtered : aggregated, 
          bottleLoading: false 
        }));
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [HOME] ❌ Erro ao carregar produtos de garrafas:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          productType: 'garrafas'
        });
        setState(prev => ({ 
          ...prev, 
          bottleError: 'Erro ao carregar produtos de garrafas', 
          bottleLoading: false 
        }));
      }
    };

    const loadNotebookProducts = async () => {
      try {
        setState(prev => ({ ...prev, notebookLoading: true, notebookError: null }));

        // Consultar múltiplos termos para cobrir variações
        const terms = ['caderno', 'caderneta', 'bloco'];
        const aggregated: Product[] = [];
        for (const term of terms) {
          try {
            const resp = await productsApi.getProducts({ search: term, limit: 6 });
            if (resp.success && resp.data?.items?.length) {
              resp.data.items.forEach((item: any) => {
                if (!aggregated.find(p => p.id === item.id)) aggregated.push(item);
              });
            }
          } catch (e) {
            console.warn(`[${new Date().toISOString()}] [HOME] ⚠️ Falha parcial ao buscar termo`, { term, error: e instanceof Error ? e.message : String(e) });
          }
        }

        setState(prev => ({ 
          ...prev, 
          notebookProducts: aggregated, 
          notebookLoading: false 
        }));
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [HOME] ❌ Erro ao carregar produtos de blocos/cadernetas:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          productType: 'blocos_cadernetas'
        });
        setState(prev => ({ 
          ...prev, 
          notebookError: 'Erro ao carregar produtos de blocos/cadernetas', 
          notebookLoading: false 
        }));
      }
    };

    const loadThermalBagProducts = async () => {
      try {
        setState(prev => ({ ...prev, thermalBagLoading: true, thermalBagError: null }));

        // Buscar nécessaire (com e sem acento) e variações comuns
        const terms = ['nécessaire', 'necessaire', 'estojo', 'necessária'];
        const aggregated: Product[] = [];
        for (const term of terms) {
          try {
            const resp = await productsApi.getProducts({ search: term, limit: 6 });
            if (resp.success && resp.data?.items?.length) {
              resp.data.items.forEach((item: any) => {
                if (!aggregated.find(p => p.id === item.id)) aggregated.push(item);
              });
            }
          } catch (e) {
            console.warn(`[${new Date().toISOString()}] [HOME] ⚠️ Falha parcial ao buscar termo`, { term, error: e instanceof Error ? e.message : String(e) });
          }
        }

        setState(prev => ({ 
          ...prev, 
          thermalBagProducts: aggregated, 
          thermalBagLoading: false 
        }));
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [HOME] ❌ Erro ao carregar produtos de nécessaires:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          productType: 'necessaires'
        });
        setState(prev => ({ 
          ...prev, 
          thermalBagError: 'Erro ao carregar produtos de nécessaires', 
          thermalBagLoading: false 
        }));
      }
    };

    loadBagProducts();
    loadBottleProducts();
    loadNotebookProducts();
    loadThermalBagProducts();
  }, []);

  // Dados mockados removidos - agora usando API

  const stats = [
    { icon: Package, value: '+1300', label: 'Produtos' },
    { icon: Leaf, value: '100%', label: 'Ecológicos' },
    { icon: Users, value: '500+', label: 'Clientes Atendidos' },
    { icon: Award, value: '5 Anos', label: 'de Experiência' },
  ];

  const getSustainabilityIcon = (featureId: string) => {
    const feature = SUSTAINABILITY_FEATURES.find(f => f.id === featureId);
    const icons: Record<string, React.ComponentType<any>> = {
      Leaf,
      Recycle,
      TreePine,
      Shield,
    };
    return feature ? icons[feature.icon] || Leaf : Leaf;
  };

  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Natureza Brindes",
    "description": "Especialista em brindes sustentáveis e ecológicos para empresas",
    "url": "https://naturezabrindes.com.br",
    "logo": "https://naturezabrindes.com.br/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-11-99999-9999",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    },
    "sameAs": [
      "https://www.instagram.com/naturezabrindes",
      "https://www.linkedin.com/company/naturezabrindes"
    ]
  };

  return (
    <div className="animate-fade-in">
      <SEOHead
        title="Natureza Brindes - Brindes Sustentáveis e Ecológicos"
        description="Fortaleça sua marca com brindes sustentáveis e ecológicos. Mais de 500 produtos personalizados para empresas que se preocupam com o meio ambiente. Orçamento gratuito!"
        keywords="brindes sustentáveis, brindes ecológicos, produtos personalizados, brindes corporativos, meio ambiente, sustentabilidade, brindes empresariais, produtos ecológicos"
        url="/"
        type="website"
        structuredData={homeStructuredData}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-green-50 to-white">
        <div className="container-custom section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2 md:space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Brindes <span className="text-gradient">Ecológicos</span> para sua Empresa
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">Transforme sua marca com brindes sustentáveis de alta qualidade. Produtos ecológicos personalizados que demonstram o compromisso da sua empresa com o meio ambiente.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" icon={<Search size={20} />}>Ver Catálogo</Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  icon={<ArrowRight size={20} />}
                  iconPosition="right"
                >
                  Solicitar Orçamento
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/capa.png"
                  alt="Produtos Sustentáveis Natureza Brindes"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Highlighted Products Section */}
      <HighlightedProducts />

      {/* Bottle Products Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Garrafas e Copos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Garrafas reutilizáveis e copos personalizados para promover sustentabilidade e reduzir o uso de plástico descartável.
            </p>
          </div>

          <div className="carousel-container">
            {state.bottleLoading ? (
              // Loading skeleton for bottle products
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} padding="none" className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <Card.Content className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-1">
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                          <div className="h-5 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="flex justify-between">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </Card.Content>
                    <Card.Footer className="p-4 pt-0">
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </Card.Footer>
                  </Card>
                ))}
              </div>
            ) : state.bottleError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{state.bottleError}</p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
              </div>
            ) : state.bottleProducts.length > 0 ? (
              <Slider {...carouselSettings} className="bottle-carousel">
                {state.bottleProducts.map((product) => (
                  <div key={product.id} className="px-2">
                    <Link to={`/produto/${product.id}`}>
                      <Card hover padding="none" className="group ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-white h-full">
                        <div className="aspect-square overflow-hidden rounded-t-lg relative">
                          <img
                            src={product.images?.[0] || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=eco-friendly%20reusable%20bottle%20sustainable%20corporate%20gift&image_size=square'}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <Card.Content className="p-2 sm:p-3 md:p-6">
                          <div className="space-y-2 sm:space-y-3 md:space-y-4">
                            <h3 className="font-bold text-gray-900 line-clamp-2 text-xs sm:text-sm md:text-base lg:text-lg group-hover:text-green-700 transition-colors duration-300">
                              {product.name}
                            </h3>
                            
                            {product.isEcological && product.ecologicalClassification && (
                              <div className="bg-green-100 border border-green-300 rounded-lg p-1.5 sm:p-2">
                                <div className="flex items-center gap-1 text-green-800 text-xs font-medium">
                                  <Award className="w-3 h-3" />
                                  <span className="truncate">{product.ecologicalClassification}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="info" size="sm" className="text-xs">Garrafa</Badge>
                              {product.featured && (
                                <Badge variant="success" size="sm" className="text-xs">Destaque</Badge>
                              )}
                            </div>
                          </div>
                        </Card.Content>
                        <Card.Footer className="p-2 sm:p-3 md:p-4 pt-0">
                          <Button className="w-full text-xs sm:text-sm" style={{backgroundColor: '#00AA00'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#00AA00'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#00AA00'} size="sm">Ver Detalhes</Button>
                        </Card.Footer>
                      </Card>
                    </Link>
                  </div>
                  ))}
              </Slider>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-green-600" size={32} />
                </div>
                <p className="text-gray-600 mb-4">Nenhum produto de garrafa encontrado no momento.</p>
                <Link to="/catalogo?search=garrafa">
                  <Button variant="outline">Buscar no Catálogo</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="text-center mb-16">
            <Link to="/catalogo?search=garrafa">
              <Button size="lg" style={{backgroundColor: '#00AA00'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#00AA00'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#00AA00'} icon={<ArrowRight size={20} />} iconPosition="right">Ver Todas as Garrafas</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Thermal Bag Products Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nécessaire
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nécessaires elegantes e funcionais para organizar seus itens pessoais, perfeitas para brindes corporativos e uso diário.
            </p>
          </div>

          <div className="carousel-container">
            {state.thermalBagLoading ? (
              // Loading skeleton for thermal bag products
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} padding="none" className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <Card.Content className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-1">
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                          <div className="h-5 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="flex justify-between">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </Card.Content>
                    <Card.Footer className="p-4 pt-0">
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </Card.Footer>
                  </Card>
                ))}
              </div>
            ) : state.thermalBagError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{state.thermalBagError}</p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
              </div>
            ) : state.thermalBagProducts.length > 0 ? (
              <Slider {...carouselSettings} className="thermal-bag-carousel">
                {state.thermalBagProducts.map((product) => (
                  <div key={product.id} className="px-2">
                    <Link to={`/produto/${product.id}`}>
                      <Card hover padding="none" className="group ring-2 ring-blue-200 bg-gradient-to-br from-blue-50 to-white h-full">
                        <div className="aspect-square overflow-hidden rounded-t-lg relative">
                          <img
                            src={product.images?.[0] || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=eco-friendly%20thermal%20bag%20insulated%20cooler%20sustainable%20corporate%20gift&image_size=square'}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <Card.Content className="p-2 sm:p-3 md:p-6">
                          <div className="space-y-2 sm:space-y-3 md:space-y-4">
                            <h3 className="font-bold text-gray-900 line-clamp-2 text-xs sm:text-sm md:text-base lg:text-lg group-hover:text-blue-700 transition-colors duration-300">
                              {product.name}
                            </h3>
                            
                            {product.isEcological && product.ecologicalClassification && (
                              <div className="bg-blue-100 border border-blue-300 rounded-lg p-1.5 sm:p-2">
                                <div className="flex items-center gap-1 text-blue-800 text-xs font-medium">
                                  <Award className="w-3 h-3" />
                                  <span className="truncate">{product.ecologicalClassification}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" size="sm" className="text-xs">Nécessaire</Badge>
                              {product.featured && (
                                <Badge variant="success" size="sm" className="text-xs">Destaque</Badge>
                              )}
                            </div>
                          </div>
                        </Card.Content>
                        <Card.Footer className="p-2 sm:p-3 md:p-4 pt-0">
                          <Button className="w-full text-xs sm:text-sm" style={{backgroundColor: '#2563EB'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'} size="sm">Ver Detalhes</Button>
                        </Card.Footer>
                      </Card>
                    </Link>
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-blue-600" size={32} />
                </div>
                <p className="text-gray-600 mb-4">Nenhum produto de nécessaire encontrado no momento.</p>
                <Link to="/catalogo?categoria=Nécessaire">
                  <Button variant="outline">Buscar no Catálogo</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="text-center mb-16">
            <Link to="/catalogo?categoria=Nécessaire">
              <Button size="lg" style={{backgroundColor: '#2563EB'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'} icon={<ArrowRight size={20} />} iconPosition="right">Ver Todas as Nécessaires</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Notebook Products Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Blocos e Cadernetas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Material de escritório sustentável feito com papel reciclado e materiais ecológicos para sua empresa.
            </p>
          </div>

          <div className="carousel-container">
            {state.notebookLoading ? (
              // Loading skeleton for notebook products
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} padding="none" className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <Card.Content className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-1">
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                          <div className="h-5 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="flex justify-between">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </Card.Content>
                    <Card.Footer className="p-4 pt-0">
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </Card.Footer>
                  </Card>
                ))}
              </div>
            ) : state.notebookError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{state.notebookError}</p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
              </div>
            ) : state.notebookProducts.length > 0 ? (
              <Slider {...carouselSettings} className="notebook-carousel">
                {state.notebookProducts.map((product) => (
                  <div key={product.id} className="px-2">
                    <Link to={`/produto/${product.id}`}>
                      <Card hover padding="none" className="group ring-2 ring-yellow-200 bg-gradient-to-br from-yellow-50 to-white h-full">
                        <div className="aspect-square overflow-hidden rounded-t-lg relative">
                          <img
                            src={product.images?.[0] || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=eco-friendly%20notebook%20recycled%20paper%20sustainable%20corporate%20gift&image_size=square'}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <Card.Content className="p-2 sm:p-3 md:p-4">
                          <div className="space-y-2 sm:space-y-3">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 text-xs sm:text-sm md:text-base">
                              {product.name}
                            </h3>
                            
                            {product.isEcological && product.ecologicalClassification && (
                              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-1.5 sm:p-2">
                                <div className="flex items-center gap-1 text-yellow-800 text-xs font-medium">
                                  <Award className="w-3 h-3" />
                                  <span className="truncate">{product.ecologicalClassification}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="warning" size="sm" className="text-xs">Caderno</Badge>
                              {product.featured && (
                                <Badge variant="success" size="sm" className="text-xs">Destaque</Badge>
                              )}
                            </div>
                          </div>
                        </Card.Content>
                        <Card.Footer className="p-2 sm:p-3 md:p-4 pt-0">
                          <Button className="w-full text-xs sm:text-sm" style={{backgroundColor: '#F97316'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#F97316'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#F97316'} size="sm">Ver Detalhes</Button>
                        </Card.Footer>
                      </Card>
                    </Link>
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TreePine className="text-yellow-600" size={32} />
                </div>
                <p className="text-gray-600 mb-4">Nenhum produto de caderno encontrado no momento.</p>
                <Link to="/catalogo?search=caderno">
                  <Button variant="outline">Buscar no Catálogo</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link to="/catalogo">
              <Button size="lg" style={{backgroundColor: '#F97316'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#E8661F'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#F97316'} icon={<ArrowRight size={20} />} iconPosition="right">Ver Todos os Produtos</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ecobag Products Section */}
      <section className="section-padding bg-gradient-to-br from-green-50 via-emerald-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <Badge variant="success" className="mb-6 px-4 py-2 text-sm font-medium">
              Sustentabilidade
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Ecobags Sustentáveis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Descubra nossa linha de ecobags ecológicas, perfeitas para promover sua marca de forma sustentável e consciente.
            </p>
          </div>

          <div className="carousel-container">
            {state.bagLoading ? (
              // Loading skeleton for ecobag products
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} padding="none" className="animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                    <Card.Content className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-1">
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                          <div className="h-5 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="flex justify-between">
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                          </div>
                    </div>
                  </Card.Content>
                  <Card.Footer className="p-4 pt-0">
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </Card.Footer>
                </Card>
              ))}
            </div>
            ) : state.bagError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{state.bagError}</p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
              </div>
            ) : state.bagProducts && state.bagProducts.length > 0 ? (
              <Slider {...carouselSettings} className="ecobag-carousel">
                {state.bagProducts.map((product) => (
                  <div key={product.id} className="px-2">
                    <Link to={`/produto/${product.id}`}>
                      <Card hover padding="none" className="group ring-2 ring-[#2CB20B] hover:ring-[#2CB20B] bg-gradient-to-br from-white to-green-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                        <div className="aspect-square overflow-hidden rounded-t-lg relative bg-gradient-to-br from-green-100 to-emerald-100">
                          <img
                            src={product.images?.[0] || 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=eco-friendly%20reusable%20bag%20sustainable%20ecobag%20corporate%20gift&image_size=square'}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-all duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <Card.Content className="p-2 sm:p-3 md:p-4">
                          <div className="space-y-1 sm:space-y-2 md:space-y-3">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 text-xs sm:text-sm md:text-base">
                              {product.name}
                            </h3>
                            
                            {product.isEcological && product.ecologicalClassification && (
                              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg p-1.5 sm:p-2 md:p-3 shadow-sm">
                                <div className="flex items-center gap-1 sm:gap-2 text-green-800 text-xs sm:text-sm font-semibold">
                                  <Award className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                  <span className="truncate">{product.ecologicalClassification}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <Badge variant="success" size="sm" className="bg-green-600 hover:bg-green-700 transition-colors text-xs">Ecobag</Badge>
                              {product.featured && (
                                <Badge variant="info" size="sm" className="bg-green-600 hover:bg-green-700 transition-colors animate-pulse text-xs">Destaque</Badge>
                              )}
                            </div>
                          </div>
                        </Card.Content>
                        <Card.Footer className="p-2 sm:p-3 md:p-4 pt-0">
                          <Button className="w-full text-xs sm:text-sm" style={{backgroundColor: '#2CB20B'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2CB20B'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#2CB20B'} size="sm">Ver Detalhes</Button>
                        </Card.Footer>
                      </Card>
                    </Link>
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="text-green-600" size={32} />
                </div>
                <p className="text-gray-600 mb-4">Nenhum produto ecobag encontrado no momento.</p>
                <Link to="/catalogo?search=ecobag">
                  <Button variant="outline">Buscar no Catálogo</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="text-white border-[#2CB20B] hover:opacity-90" 
              style={{ backgroundColor: '#2CB20B' }}
              icon={<ArrowRight size={20} />} 
              iconPosition="right"
              onClick={() => window.location.href = '/catalogo?categoria=Sacolas&pagina=1'}
            >Ver Todas as Ecobags</Button>
          </div>
        </div>
      </section>



      {/* Categories Filter Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore por Categoria
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Encontre rapidamente os produtos que você precisa navegando pelas nossas categorias organizadas.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categorias
              </label>
              
              {/* Filtros em layout horizontal */}
              <div className="flex flex-wrap gap-2">
                {/* Botão "Todas as Categorias" */}
                <Link to="/catalogo">
                  <button
                    className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 text-white border-[#2CB20B] hover:opacity-90"
                    style={{ backgroundColor: '#2CB20B' }}
                  >
                    Todas as Categorias
                  </button>
                </Link>
                
                {/* Botão "Agenda" */}
                <button
                  onClick={() => handleCategoryFilter('Agenda')}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >Agenda</button>
                
                {/* Botão "Blocos e Cadernetas" */}
                <button
                  onClick={() => handleCategoryFilter('Blocos e Cadernetas')}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Blocos e Cadernetas
                </button>
                
                {/* Botão "Bolsas" */}
                <button
                  onClick={() => handleCategoryFilter('Bolsas')}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Bolsas
                </button>
                
                {/* Botão "Bolsas Térmicas" */}
                <button
                  onClick={() => handleCategoryFilter('Bolsas Térmicas')}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Bolsas Térmicas
                </button>
                
                {/* Botão "Nécessaire" */}
                <button
                  onClick={() => handleCategoryFilter('Nécessaire')}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Nécessaire
                </button>
                
                {/* Botão "Canecas" */}
                <button
                  onClick={() => handleCategoryFilter('Canecas')}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Canecas
                </button>
                
                {/* Outras categorias como botões funcionais */}
                {['Canetas', 'Canivetes', 'Canudos', 'Chaveiros', 'Copos', 'Cozinha', 'Eletrônicos', 'Escritório', 'Estojos', 'Kit Banho', 'Kit Executivo', 'Kit Manicure', 'Lápis', 'Leques', 'Linha PET', 'Moda', 'Nécessaires', 'Porta-Cartão e Carteira', 'Sacochilas', 'Sacolas', 'Squeezes e Garrafas', 'Tapetes'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryFilter(category)}
                    className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-white">
        <div className="container-custom text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para Impressionar seus Clientes?
            </h2>
            <p className="text-lg text-green-100">
              Solicite um orçamento personalizado e descubra como nossos produtos
              sustentáveis podem fortalecer sua marca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/catalogo">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100"
                >Solicitar Orçamento</Button>
              </Link>
              <Link to="/contato">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  Falar com Especialista
                </Button>
              </Link>
              <Button 
                onClick={() => {
                  const phoneNumber = '5527999586250';
                  const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os produtos da Natureza Brindes.');
                  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                  window.open(whatsappUrl, '_blank');
                }}
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300"
              >
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;