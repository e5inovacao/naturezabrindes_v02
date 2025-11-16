import React from 'react';
import {
  Leaf,
  Heart,
  Target,
  Eye,
  Award,
  Users,
  TreePine,
  Recycle,
  Shield,
  Globe,
  CheckCircle,
  Star,
  Calendar,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  MessageCircle,
} from 'lucide-react';
import { COMPANY_INFO, SUSTAINABILITY_FEATURES } from '../constants';
import SEOHead from '../components/SEOHead';
import Button from '../components/Button';

const About: React.FC = () => {
  const handleWhatsAppContact = () => {
    const phoneNumber = '5527999586250';
    const message = encodeURIComponent('Olá! Gostaria de saber mais sobre a Natureza Brindes.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const timeline = [
    {
      year: '2001',
      title: 'Início da Jornada',
      description: 'A Cristal Brindes iniciou suas atividades na residência de sua fundadora, com foco no mercado capixaba.',
      icon: Calendar,
    },
    {
      year: '2001-2021',
      title: 'Crescimento e Expansão',
      description: 'Duas décadas de crescimento, reinvenção e transformação, expandindo para todo o território nacional.',
      icon: Globe,
    },
    {
      year: 'Atualmente',
      title: 'Natureza Brindes',
      description: 'A Natureza Brindes é uma empresa da Cristal Brindes, especializada em brindes sustentáveis, aproveitando mais de 25 anos de experiência no mercado para oferecer soluções ecológicas e inovadoras.',
      icon: Building2,
    },
  ];

  const differentials = [
    {
      icon: Award,
      title: 'Qualidade Superior',
      description: 'Produtos nacionais e importados com os mais altos padrões de qualidade.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Clock,
      title: 'Entregas Pontuais',
      description: 'Compromisso com prazos e pontualidade em todas as entregas.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Users,
      title: 'Atendimento Profissional',
      description: 'Equipe especializada com atendimento personalizado e consultivo.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Package,
      title: 'Preços Competitivos',
      description: 'Melhor custo-benefício do mercado sem comprometer a qualidade.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Sobre a Natureza Brindes - Nossa História e Missão"
        description="Conheça a história da Natureza Brindes, empresa especializada em brindes sustentáveis com mais de 25 anos de experiência no mercado de brindes corporativos."
        keywords="sobre natureza brindes, história empresa, cristal brindes, brindes corporativos serra es"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-green-700 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Leaf className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sobre a Natureza Brindes
            </h1>
            <p className="text-xl text-green-100 leading-relaxed">
              Empresa especializada em brindes sustentáveis com mais de 25 anos de experiência no mercado
            </p>
          </div>
        </div>
      </section>

      {/* Nossa História */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa História
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="text-xl mb-8">
                A Natureza Brindes é uma empresa da Cristal Brindes, especializada em brindes sustentáveis, aproveitando mais de 25 anos de experiência no mercado.
              </p>
              
              <p className="mb-6">
                Nossa história começa em 2001, quando a Cristal Brindes iniciou suas atividades na residência de sua fundadora. 
                Ao longo de duas décadas, crescemos, nos reinventamos e nos transformamos, atendendo inicialmente empresas 
                capixabas e rapidamente expandindo para todo o território nacional.
              </p>

              <p className="mb-6">
                Com a experiência consolidada da Cristal Brindes, criamos a Natureza Brindes para focar especificamente em soluções sustentáveis, 
                operando com toda a expertise e qualidade que construímos ao longo dos anos.
              </p>

              <p className="mb-6">
                Oferecemos uma ampla linha de produtos nacionais e importados, especialmente desenvolvidos para personalização. 
                Nossos diferenciais incluem qualidade superior, entregas pontuais e atendimento profissional com preços competitivos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa Trajetória
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="space-y-8">
              {timeline.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {item.year}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Nossos Diferenciais */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nossos Diferenciais
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              O que nos torna únicos no mercado de brindes corporativos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {differentials.map((differential, index) => {
              const IconComponent = differential.icon;
              return (
                <div key={index} className="text-center group">
                  <div className={`w-16 h-16 ${differential.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-8 h-8 ${differential.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {differential.title}
                  </h3>
                  <p className="text-gray-600">
                    {differential.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Nossa Missão */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa Missão
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none text-center text-gray-700">
                <p className="text-xl leading-relaxed">
                  Na Natureza Brindes, nossa missão é proporcionar soluções criativas que atendam às necessidades de cada cliente. 
                  Através de nossos produtos, ajudamos empresas a criar momentos marcantes, gerando experiências positivas e 
                  memoráveis para seus clientes.
                </p>
                
                <p className="text-lg text-primary font-semibold mt-6">
                  Afinal, todo mundo aprecia receber um brinde - por mais simples que seja - pois é uma forma de ser sempre lembrado com carinho.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Localização */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa Localização
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="bg-gray-50 p-8 md:p-12 rounded-2xl">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Distrito Industrial da Serra - ES
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Localização estratégica que nos permite atender todo o território nacional com eficiência e agilidade.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-2" />
                    <span>(27) 99958-6250</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-2" />
                    <span>naturezabrindes@naturezabrindes.com.br</span>
                  </div>
                </div>
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
              Vamos Criar Algo Especial Juntos?
            </h2>
            <p className="text-lg text-green-100">
              Entre em contato conosco e descubra como podemos ajudar sua empresa a criar momentos marcantes 
              com nossos produtos personalizados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleWhatsAppContact}
                variant="secondary" 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-primary"
                onClick={() => window.location.href = '/contato'}
              >
                Entre em Contato
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
