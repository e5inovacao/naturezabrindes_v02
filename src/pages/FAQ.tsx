import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Mail, Phone, MessageCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'produtos' | 'pedidos' | 'personalizacao' | 'sustentabilidade' | 'entrega';
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: 'Quais tipos de produtos vocês oferecem?',
    answer: 'Oferecemos uma ampla gama de produtos sustentáveis e personalizáveis, incluindo sacolas ecológicas, garrafas reutilizáveis, copos, blocos e cadernetas feitos com materiais reciclados, além de diversos outros brindes corporativos ecológicos.',
    category: 'produtos'
  },
  {
    id: 2,
    question: 'Como funciona a personalização dos produtos?',
    answer: 'A personalização pode ser feita através de diferentes técnicas como serigrafia, bordado, gravação a laser ou impressão digital. Enviamos uma arte digital para aprovação antes da produção. O prazo varia de acordo com a técnica escolhida e quantidade.',
    category: 'personalizacao'
  },
  {
    id: 3,
    question: 'Qual é o pedido mínimo?',
    answer: 'O pedido mínimo varia de acordo com o produto e tipo de personalização.',
    category: 'pedidos'
  },
  {
    id: 4,
    question: 'Os produtos são realmente sustentáveis?',
    answer: 'Sim! Todos os nossos produtos são cuidadosamente selecionados por critérios de sustentabilidade. Utilizamos materiais reciclados, biodegradáveis ou reutilizáveis. Cada produto possui certificações ambientais quando aplicável.',
    category: 'sustentabilidade'
  },
  {
    id: 5,
    question: 'Qual é o prazo de entrega?',
    answer: 'O prazo varia conforme o produto e personalização: produtos sem personalização (3-5 dias úteis), com personalização simples (7-10 dias úteis), personalização complexa (15-20 dias úteis). Prazos podem ser reduzidos mediante consulta.',
    category: 'entrega'
  },
  {
    id: 6,
    question: 'Vocês entregam em todo o Brasil?',
    answer: 'Sim, realizamos entregas em todo território nacional através de transportadoras parceiras. O frete é calculado de acordo com o CEP de destino, peso e dimensões do pedido.',
    category: 'entrega'
  },
  {
    id: 7,
    question: 'Como solicitar um orçamento?',
    answer: 'Você pode solicitar orçamento através do nosso site, WhatsApp, e-mail ou telefone. Informe o produto desejado, quantidade, tipo de personalização e prazo. Retornamos em até 24 horas com proposta detalhada.',
    category: 'pedidos'
  },
  {
    id: 8,
    question: 'Posso ver uma amostra antes de fazer o pedido?',
    answer: 'Sim! Para pedidos acima de determinada quantidade, disponibilizamos amostras físicas. Para personalização, sempre enviamos arte digital para aprovação. Amostras físicas personalizadas podem ter custo adicional.',
    category: 'personalizacao'
  },
  {
    id: 9,
    question: 'Quais são as formas de pagamento?',
    answer: 'Aceitamos diversas formas de pagamento: PIX, transferência bancária, boleto bancário, cartão de crédito e cartão de débito.',
    category: 'pedidos'
  },
  {
    id: 10,
    question: 'Os produtos têm garantia?',
    answer: 'Todos os produtos possuem garantia contra defeitos de fabricação. O prazo varia conforme o tipo de produto. Problemas de qualidade são resolvidos com reposição ou reembolso integral.',
    category: 'produtos'
  }
];

const categoryLabels = {
  produtos: 'Produtos',
  pedidos: 'Pedidos',
  personalizacao: 'Personalização',
  sustentabilidade: 'Sustentabilidade',
  entrega: 'Entrega'
};

const categoryColors = {
  produtos: 'success',
  pedidos: 'info',
  personalizacao: 'warning',
  sustentabilidade: 'success',
  entrega: 'info'
} as const;

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQ = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const categories = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle size={32} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Perguntas Frequentes
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre nossos produtos e serviços
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Category Filter */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Filtrar por categoria</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Todas
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {categoryLabels[category]}
                </Button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          variant={categoryColors[item.category]} 
                          size="sm"
                        >
                          {categoryLabels[item.category]}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.question}
                      </h3>
                    </div>
                    <div className="ml-4">
                      {openItems.includes(item.id) ? (
                        <ChevronUp className="text-gray-500" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-500" size={20} />
                      )}
                    </div>
                  </div>
                </button>
                
                {openItems.includes(item.id) && (
                  <div className="px-6 pb-6">
                    <div className="border-t pt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {filteredFAQ.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-600">Nenhuma pergunta encontrada para esta categoria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Não encontrou sua resposta?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Nossa equipe está pronta para ajudar! Entre em contato conosco através dos canais abaixo.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Telefone</h3>
              <p className="text-gray-600 mb-4">(27) 99958-6250</p>
              <Button size="sm" variant="outline">
                Ligar Agora
              </Button>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-gray-600 mb-4">Resposta rápida</p>
              <Button size="sm" variant="outline">
                Enviar Mensagem
              </Button>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">E-mail</h3>
              <p className="text-gray-600 mb-4">naturezabrindes@naturezabrindes.com.br</p>
              <Button size="sm" variant="outline">
                Enviar E-mail
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
