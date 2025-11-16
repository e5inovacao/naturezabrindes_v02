import React from 'react';
import { Search, FileText, CheckCircle2, Package } from 'lucide-react';

const ComoComprar: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Como Comprar</h1>
            <p className="text-xl opacity-90">Processo simples e seguro para adquirir nossos produtos sustentáveis</p>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-green-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Escolha os Produtos</h3>
              <p className="text-gray-600">Navegue pelo nosso catálogo e selecione os produtos que deseja. Adicione-os ao carrinho ou solicite um orçamento personalizado.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-blue-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Solicite Orçamento</h3>
              <p className="text-gray-600">Preencha o formulário com suas informações e detalhes do pedido. Nossa equipe entrará em contato em até 24 horas.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-yellow-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Confirme o Pedido</h3>
              <p className="text-gray-600">Após receber o orçamento, confirme os detalhes, quantidades e prazo de entrega. Efetue o pagamento conforme acordado.</p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="text-purple-600" size={28} />
              </div>
              <h3 className="text-xl font-semibold mb-2">4. Receba em Casa</h3>
              <p className="text-gray-600">Seus produtos serão produzidos com cuidado e entregues no prazo acordado, diretamente no endereço informado.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Informações Importantes</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600">Formas de Pagamento</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• PIX (desconto especial)</li>
                  <li>• Transferência bancária</li>
                  <li>• Boleto bancário</li>
                  <li>• Cartão de crédito (parcelamento disponível)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600">Prazos de Entrega</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Os prazos de entrega dependem dos produtos, quantidades e personalização</li>
                  <li>• Produtos em estoque: 3-5 dias úteis</li>
                  <li>• Produtos personalizados: 7-15 dias úteis</li>
                  <li>• Grandes quantidades: consulte nossa equipe</li>
                  <li>• Frete grátis para pedidos acima de R$ 500</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600">Personalização</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Possuímos diversos tipos de personalização disponíveis</li>
                  <li>• Impressão de logotipo</li>
                  <li>• Escolha de cores</li>
                  <li>• Embalagens personalizadas</li>
                  <li>• Consulte opções disponíveis</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-600">Suporte</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Atendimento via WhatsApp</li>
                  <li>• E-mail: naturezabrindes@naturezabrindes.com.br</li>
                  <li>• Horário: Segunda - Quinta: 07:30 - 17:30, Sexta: 08:00 - 17:00</li>
                  <li>• Acompanhamento do pedido online</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-xl mb-8 opacity-90">Explore nosso catálogo e faça seu primeiro pedido sustentável</p>
          <div className="space-x-4">
            <a href="/catalogo" className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
              Ver Catálogo
            </a>
            <a href="/contato" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors inline-block">
              Falar Conosco
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComoComprar;
