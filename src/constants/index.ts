// Constantes do sistema Natureza Brindes

export const BRAND_COLORS = {
  primary: '#2CB20B',
  secondary: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export const COMPANY_INFO = {
  name: 'Natureza Brindes',
  tagline: 'Brindes Ecológicos e Sustentáveis',
  description: 'Especializada em brindes corporativos sustentáveis e ecológicos',
  email: 'naturezabrindes@naturezabrindes.com.br',
  phone: '(27) 99958-6250',
  whatsapp: '5527999586250',
} as const;

export const NAVIGATION_ITEMS = [
  { label: 'Início', href: '/', icon: 'Home' },
  { label: 'Catálogo', href: '/catalogo', icon: 'Package' },
  { label: 'Sustentabilidade', href: '/sustentabilidade', icon: 'Leaf' },
  { label: 'Sobre', href: '/sobre', icon: 'Info' },
  { label: 'FAQ', href: '/faq', icon: 'HelpCircle' },
  { label: 'Contato', href: '/contato', icon: 'Phone' },
] as const;

export const SUSTAINABILITY_FEATURES = [
  {
    id: 'biodegradable',
    name: 'Biodegradável',
    description: 'Material que se decompõe naturalmente',
    icon: 'Leaf',
    badge: 'ECO',
    color: '#10B981'
  },
  {
    id: 'recyclable',
    name: 'Reciclável',
    description: 'Pode ser reciclado após o uso',
    icon: 'Recycle',
    badge: 'REC',
    color: '#3B82F6'
  },
  {
    id: 'renewable',
    name: 'Renovável',
    description: 'Feito com recursos renováveis',
    icon: 'TreePine',
    badge: 'REN',
    color: '#059669'
  },
  {
    id: 'carbon-neutral',
    name: 'Carbono Neutro',
    description: 'Produção com compensação de carbono',
    icon: 'CloudSnow',
    badge: 'C-N',
    color: '#6366F1'
  },
] as const;

export const PRODUCT_CATEGORIES = [
  {
    id: 'office',
    name: 'Escritório',
    description: 'Produtos para uso corporativo',
    icon: 'Building2'
  },
  {
    id: 'tech',
    name: 'Tecnologia',
    description: 'Gadgets e acessórios tecnológicos',
    icon: 'Smartphone'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Produtos para o dia a dia',
    icon: 'Coffee'
  },
  {
    id: 'bags',
    name: 'Bolsas e Mochilas',
    description: 'Bolsas, mochilas e acessórios',
    icon: 'ShoppingBag'
  },
  {
    id: 'drinkware',
    name: 'Copos e Garrafas',
    description: 'Produtos para bebidas',
    icon: 'Coffee'
  },
  {
    id: 'stationery',
    name: 'Papelaria',
    description: 'Materiais de escritório',
    icon: 'PenTool'
  },
] as const;

export const URGENCY_LEVELS = [
  {
    value: 'low',
    label: 'Baixa',
    description: 'Sem pressa (15-30 dias)',
    color: '#10B981'
  },
  {
    value: 'medium',
    label: 'Média',
    description: 'Prazo normal (7-15 dias)',
    color: '#F59E0B'
  },
  {
    value: 'high',
    label: 'Alta',
    description: 'Urgente (até 7 dias)',
    color: '#EF4444'
  },
] as const;

export const QUOTE_STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'Clock'
  },
  processing: {
    label: 'Processando',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'Loader'
  },
  quoted: {
    label: 'Orçado',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: 'FileText'
  },
  approved: {
    label: 'Aprovado',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'CheckCircle'
  },
  rejected: {
    label: 'Rejeitado',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'XCircle'
  },
} as const;

export const API_ENDPOINTS = {
  products: '/api/products',
  categories: '/api/categories',
  quotes: '/api/quotes',
  auth: '/api/auth',
  dashboard: '/api/dashboard',
} as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 12,
  maxLimit: 50,
} as const;

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  zipCode: /^\d{5}-?\d{3}$/,
} as const;

export const STORAGE_KEYS = {
  cart: 'natureza-brindes-cart',
  user: 'natureza-brindes-user',
  theme: 'natureza-brindes-theme',
  filters: 'natureza-brindes-filters',
} as const;
