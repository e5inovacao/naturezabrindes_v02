export const URGENCY_LEVELS = [
  {
    value: 'low',
    label: 'Baixa',
    description: 'Sem pressa (15-30 dias)',
    color: '#10B981'
  },
  {
    value: 'normal',
    label: 'Normal',
    description: 'Prazo padrão (7-15 dias)',
    color: '#3B82F6'
  },
  {
    value: 'high',
    label: 'Alta',
    description: 'Prazo reduzido (3-7 dias)',
    color: '#F59E0B'
  },
  {
    value: 'urgent',
    label: 'Urgente',
    description: 'Para evento específico (1-3 dias)',
    color: '#EF4444'
  }
] as const;

export const COMPANY_INFO = {
  name: 'Natureza Brindes',
  tagline: 'Brindes sustentáveis para um futuro melhor',
  email: 'naturezabrindes@naturezabrindes.com.br',
  phone: '(27) 99958-6250',
  address: {
    street: 'Rua das Flores, 123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567'
  }
};

export const PRODUCT_CATEGORIES = [
  { 
    id: 'papelaria', 
    name: 'Papelaria Sustentável', 
    slug: 'papelaria',
    description: 'Cadernos, canetas e materiais de escritório ecológicos',
    icon: 'Package'
  },
  { 
    id: 'casa-escritorio', 
    name: 'Casa & Escritório', 
    slug: 'casa-escritorio',
    description: 'Produtos para uso doméstico e corporativo',
    icon: 'Home'
  },
  { 
    id: 'acessorios', 
    name: 'Acessórios', 
    slug: 'acessorios',
    description: 'Bolsas, mochilas e acessórios sustentáveis',
    icon: 'Package'
  },
  { 
    id: 'tecnologia', 
    name: 'Tecnologia Verde', 
    slug: 'tecnologia',
    description: 'Gadgets e acessórios tecnológicos sustentáveis',
    icon: 'Smartphone'
  },
  { 
    id: 'textil', 
    name: 'Têxtil Ecológico', 
    slug: 'textil',
    description: 'Roupas e tecidos de origem sustentável',
    icon: 'Shirt'
  }
] as const;

export const SUSTAINABILITY_FEATURES = [
  { 
    id: 'recyclable', 
    name: 'Material Reciclado', 
    badge: 'Reciclado',
    description: 'Feito com materiais reciclados',
    icon: 'Recycle' 
  },
  { 
    id: 'biodegradable', 
    name: 'Biodegradável', 
    badge: 'Biodegradável',
    description: 'Se decompõe naturalmente no meio ambiente',
    icon: 'Leaf' 
  },
  { 
    id: 'renewable', 
    name: 'Fonte Renovável', 
    badge: 'Renovável',
    description: 'Feito com recursos renováveis',
    icon: 'TreePine' 
  },
  { 
    id: 'solar-energy', 
    name: 'Energia Solar', 
    badge: 'Solar',
    description: 'Funciona com energia solar',
    icon: 'Sun' 
  },
  { 
    id: 'organic', 
    name: 'Orgânico', 
    badge: 'Orgânico',
    description: 'Produzido sem químicos sintéticos',
    icon: 'Leaf' 
  },
  { 
    id: 'reusable', 
    name: 'Reutilizável', 
    badge: 'Reutilizável',
    description: 'Pode ser usado múltiplas vezes',
    icon: 'RotateCcw' 
  },
  { 
    id: 'durable', 
    name: 'Durável', 
    badge: 'Durável',
    description: 'Construído para durar muito tempo',
    icon: 'Shield' 
  }
] as const;

export const NAVIGATION_ITEMS = [
  { href: '/', label: 'Início', icon: 'Home' },
  { href: '/catalogo', label: 'Catálogo', icon: 'Package' },
  { href: '/sobre', label: 'Sobre', icon: 'Info' }
] as const;
