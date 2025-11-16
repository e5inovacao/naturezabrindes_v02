import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppFloat from './components/WhatsAppFloat';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Quote from './pages/Quote';
import Componentes from './pages/Componentes';
import Contact from './pages/Contact';
import About from './pages/About';
import FAQ from './pages/FAQ';
import ComoComprar from './pages/ComoComprar';
import Privacidade from './pages/Privacidade';
import Termos from './pages/Termos';
import Suporte from './pages/Suporte';
import TestPage from './pages/TestPage';
import Sustainability from './pages/Sustainability';
import EmailTemplates from './pages/EmailTemplates';
import EmailPreview from './pages/EmailPreview';

function App() {
  // Mock cart items count - will be replaced with actual state management
  const cartItemsCount = 0;

  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Layout cartItemsCount={cartItemsCount}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/produto/:id" element={<ProductDetails />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/orcamento" element={<Quote />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/como-comprar" element={<ComoComprar />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/sustentabilidade" element={<Sustainability />} />
          <Route path="/componentes" element={<Componentes />} />
          <Route path="/testes" element={<TestPage />} />
          <Route path="/email-templates" element={<EmailTemplates />} />
          <Route path="/email-preview" element={<EmailPreview />} />

          <Route path="*" element={
            <div className="container-custom section-padding text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Página não encontrada</p>
              <a href="/" className="btn btn-primary">Voltar ao Início</a>
            </div>
          } />
        </Routes>
        </Layout>
        <WhatsAppFloat />
      </Router>
    </HelmetProvider>
  );
}

export default App;
