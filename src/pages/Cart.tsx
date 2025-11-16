import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingCart, Mail, Phone, Building, FileText, Check, AlertCircle, User, X } from 'lucide-react';

import { Send } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import SuccessPopup from '../components/SuccessPopup';
import { useCartStore } from '../store/cartStore';
import { checkPhoneExists, checkEmailExists, getOrCreateUser } from '../services/quotesService';
import { productsApi, quotesApi } from '../services/api';
// import removed: email sending handled by backend



interface FormData {
  email: string;
  name: string;
  phone: string;
  company: string;
  cnpj: string;
  acceptTerms: boolean;
  receiveNews: boolean;
}

interface FormErrors {
  email?: string;
  name?: string;
  phone?: string;
  company?: string;
  cnpj?: string;
  acceptTerms?: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const { items, observations, updateQuantity, removeItem, updateItemColor, updateItemNotes, updateObservations, getTotalItems, clearCart, addItem } = useCartStore();
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [step, setStep] = useState<'email' | 'register' | 'success'>('email');
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    cnpj: '',
    acceptTerms: false,
    receiveNews: false
  });


  // Debug: Monitorar mudanças no estado showSuccessPopup
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] [CART] 🔍 Estado do popup de sucesso alterado:`, {
      showSuccessPopup,
      timestamp: new Date().toISOString()
    });
  }, [showSuccessPopup]);

  // Buscar produtos para ter acesso às colorVariations
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getProducts();
        setProducts(response.data?.items || []);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [CART] ❌ Erro ao buscar produtos:`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const ensureDetails = async () => {
      try {
        const ids = items.map(i => i.id);
        const missing = ids.filter(id => {
          const p = products.find(pr => pr.id === id);
          return !p || !Array.isArray(p.colorVariations) || p.colorVariations.length === 0;
        });
        if (missing.length === 0) return;
        const fetched = await Promise.all(missing.map(async (id) => {
          try {
            const r = await productsApi.getProductById(id);
            return r.data;
          } catch {
            return null;
          }
        }));
        const details = fetched.filter(Boolean);
        if (details.length === 0) return;
        setProducts(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          details.forEach((d: any) => map.set(d.id, d));
          return Array.from(map.values());
        });
      } catch {}
    };
    ensureDetails();
  }, [items, products]);
  


  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  };

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleEmailCheck = async () => {
    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Por favor, insira um e-mail válido' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log(`[${new Date().toISOString()}] [CART] 🔍 Verificando existência do e-mail:`, {
        email: formData.email,
        timestamp: new Date().toISOString()
      });
      const exists = await checkEmailExists(formData.email);
      console.log(`[${new Date().toISOString()}] [CART] 📧 Resultado da verificação de e-mail:`, {
        emailExists: exists,
        status: exists ? 'E-mail encontrado' : 'E-mail não encontrado'
      });
      
      if (exists) {
        // Cliente cadastrado - inserir solicitação de orçamento diretamente
        console.log(`[${new Date().toISOString()}] [CART] ✅ Cliente cadastrado - criando solicitação:`, {
            clientRegistered: true,
            hasObservations: !!observations,
            observationsLength: observations?.length || 0
          });
        
        try {
          const clientData = await (async () => {
            const { getUserByEmail } = await import('../services/quotesService');
            return await getUserByEmail(formData.email);
          })();

          const result = await quotesApi.createQuote({
            customerData: {
              name: clientData?.nome || formData.name || 'Cliente',
              email: formData.email,
              phone: clientData?.telefone || formData.phone || '',
              company: clientData?.empresa || formData.company || ''
            },
            items,
            notes: observations || ''
          });
          console.log(`[${new Date().toISOString()}] [CART] ✅ Solicitação de orçamento criada:`, {
              success: result.success,
              message: result.message
            });
          
          // Buscar dados completos do cliente para o email (já obtido acima)
          
          // Enviar e-mail de confirmação
        try {
          // E-mail de confirmação é enviado pelo backend com cópia interna
          console.log(`[${new Date().toISOString()}] [CART] ℹ️ E-mail de confirmação será enviado pelo backend`);
        } catch (emailError) {
          console.error(`[${new Date().toISOString()}] [CART] ❌ Erro ao enviar e-mail:`, emailError);
        }
          
          // Limpar carrinho e mostrar popup de sucesso
          clearCart();
          updateObservations('');
          resetForm();
          setShowQuoteForm(false);
          setShowSuccessPopup(true);
          console.log(`[${new Date().toISOString()}] [CART] 🎉 Popup de sucesso exibido:`, {
              popupDisplayed: true,
              timestamp: new Date().toISOString()
            });
        } catch (insertError) {
          console.error(`[${new Date().toISOString()}] [CART] ❌ Erro ao criar solicitação:`, {
              error: insertError instanceof Error ? insertError.message : 'Erro desconhecido',
              timestamp: new Date().toISOString()
            });
          alert('Erro ao criar solicitação. Tente novamente.');
        }
      } else {
        // Cliente não cadastrado - mostrar formulário de cadastro
        console.log(`[${new Date().toISOString()}] [CART] 📝 Cliente não cadastrado:`, {
          clientRegistered: false,
          redirectingToForm: true
        });
        setEmailExists(false);
        setStep('register');
      }
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [CART] ❌ Erro ao verificar e-mail:`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        email: formData.email
      });
      alert('Erro ao verificar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Nome da empresa é obrigatório';
    }

    if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos para continuar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitQuote = async () => {
    console.log(`[${new Date().toISOString()}] [CART] 🚀 Iniciando processo de orçamento:`, {
      formDataComplete: !!formData,
      totalItems: items.length,
      customerName: formData.name,
      customerEmail: formData.email
    });
    
    // Validação dos campos obrigatórios
    const requiredFields = [];
    
    if (!formData.name || formData.name.trim() === '') {
      requiredFields.push('Nome');
    }
    
    if (!formData.phone || formData.phone.trim() === '') {
      requiredFields.push('Telefone');
    }
    
    if (!formData.company || formData.company.trim() === '') {
      requiredFields.push('Empresa');
    }
    
    if (!formData.acceptTerms) {
      requiredFields.push('Aceitar os termos');
    }
    
    // Se houver campos não preenchidos, mostrar erro
    if (requiredFields.length > 0) {
      const message = `Por favor, preencha os seguintes campos obrigatórios:\n\n• ${requiredFields.join('\n• ')}`;
      alert(message);
      console.log(`[${new Date().toISOString()}] [CART] ❌ Validação falhou:`, {
          missingFields: requiredFields,
          totalMissingFields: requiredFields.length
        });
      return;
    }
    
    // Iniciar processo de criação do orçamento
    setLoading(true);
    
    try {
      console.log(`[${new Date().toISOString()}] [CART] 💾 Criando orçamento completo:`, {
        step: 'creating_quote',
        timestamp: new Date().toISOString()
      });
      
      // Preparar dados do cliente para o orçamento
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        cnpj: formData.cnpj?.trim() || '',
        address: '' // Não temos campo de endereço no formulário atual
      };
      
      console.log(`[${new Date().toISOString()}] [CART] 👤 Dados do cliente preparados:`, {
        hasName: !!customerData.name,
        hasEmail: !!customerData.email,
        hasPhone: !!customerData.phone,
        hasCompany: !!customerData.company
      });
      
      // Criar orçamento completo usando o serviço existente
      // Esta função já gerencia todas as inserções nas tabelas:
      // 1. usuarios_clientes (se necessário)
      // 2. solicitacao_orcamentos
      // 3. products_solicitacao
      // E faz rollback automático em caso de erro
      const quoteResult = await quotesApi.createQuote({
        customerData,
        items,
        notes: observations || ''
      });
      
      console.log(`[${new Date().toISOString()}] [CART] ✅ Orçamento criado com sucesso:`, {
          success: (quoteResult as any)?.success,
          response: (quoteResult as any)?.data || quoteResult,
          databaseConfirmed: true
        });
      
      // Enviar e-mail de confirmação
      try {
        // E-mail de confirmação é enviado pelo backend com cópia interna
        console.log(`[${new Date().toISOString()}] [CART] ℹ️ E-mail de confirmação será enviado pelo backend`);
      } catch (emailError) {
        console.error(`[${new Date().toISOString()}] [CART] ❌ Erro ao enviar e-mail:`, emailError);
      }
      
      // APENAS APÓS CONFIRMAÇÃO DE SUCESSO: Limpar o carrinho e dados
      console.log(`[${new Date().toISOString()}] [CART] 🧹 Limpando carrinho:`, {
          step: 'clearing_cart',
          reason: 'quote_success'
        });
      clearCart();
      updateObservations('');
      
      // Limpar formulário após sucesso
      resetForm();
      
      // Mostrar popup de sucesso
      setShowSuccessPopup(true);
      setShowQuoteForm(false);
      
      // Redirecionar para home após 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
      console.log(`[${new Date().toISOString()}] [CART] 🎉 Processo concluído com sucesso:`, {
          processCompleted: true,
          timestamp: new Date().toISOString()
        });
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] [CART] ❌ Erro ao processar orçamento:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          cartNotCleared: true,
          timestamp: new Date().toISOString()
        });
      
      // Mostrar mensagem de erro específica
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro ao processar orçamento:\n\n${errorMessage}\n\nTente novamente ou entre em contato com o suporte.\n\nSeus dados do carrinho foram preservados.`);
      
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmailExists(false);
    setFormData({
      email: '',
      name: '',
      phone: '',
      company: '',
      cnpj: '',
      acceptTerms: false,
      receiveNews: false
    });
    setErrors({});
  };

  const handleFinishQuote = () => {
    setShowQuoteForm(!showQuoteForm);
    if (!showQuoteForm) {
      resetForm();
    }
  };

  const handleAddMoreProducts = () => {
    window.scrollTo(0, 0);
    navigate('/catalogo');
  };



  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-600 mb-6">
              Adicione produtos ao seu carrinho para solicitar um orçamento personalizado.
            </p>
            <Button 
              onClick={() => navigate('/catalogo')}
              className="bg-[#2CB20B] hover:bg-[#25A009]"
            >Explorar Catálogo</Button>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Carrinho de Compras</h1>
              {getTotalItems() > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
                </Badge>
              )}
            </div>

            <div className="space-y-6">
            {/* Cart Items - Desktop Table / Mobile Cards */}
            <Card className="overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Produto</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Descrição</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Cor</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Qtd 1</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Qtd 2</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Qtd 3</th>
                      <th className="w-16 py-4 px-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      // Buscar produto completo para ter acesso às colorVariations
                      const product = products.find(p => p.id === item.id);
                      
                      return (
                        <tr key={item.id} className={index !== items.length - 1 ? 'border-b' : ''}>
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-4">
                              <img
                                src={(() => {
                                  // Se há uma cor selecionada, buscar imagem específica para essa cor
                                  if (item.selectedColor && product?.colorVariations) {
                                    const colorVariation = product.colorVariations.find(
                                      (variation: any) => variation.color.toLowerCase() === item.selectedColor.toLowerCase()
                                    );
                                    if (colorVariation && colorVariation.image) {
                                      return colorVariation.image;
                                    }
                                  }
                                  
                                  // Fallback para imagem padrão
                                  return item.image;
                                })()} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <div className="max-w-xs">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {product?.description || 'Descrição não disponível'}
                              </p>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <select 
                              value={item.selectedColor || ''}
                              onChange={(e) => updateItemColor(item.id, e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                            >
                              <option value="">Selecionar cor</option>
                              {Array.isArray(product?.colorVariations) && product.colorVariations.length > 0 && (
                                product.colorVariations.map((variation: any) => (
                                  <option key={variation.color} value={variation.color}>
                                    {variation.color.toUpperCase()}
                                  </option>
                                ))
                              )}
                            </select>
                          </td>
                          <td className="py-6 px-6">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity || ''}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="py-6 px-6">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity2 || ''}
                              onChange={(e) => {
                                const newQuantity2 = parseInt(e.target.value) || 0;
                                // Atualizar quantity2 no store
                                const updatedItems = items.map(i => 
                                  i.id === item.id ? { ...i, quantity2: newQuantity2 > 0 ? newQuantity2 : undefined } : i
                                );
                                // Usar método interno do store para atualizar
                                useCartStore.setState({ items: updatedItems });
                              }}
                              className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="py-6 px-6">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity3 || ''}
                              onChange={(e) => {
                                const newQuantity3 = parseInt(e.target.value) || 0;
                                // Atualizar quantity3 no store
                                const updatedItems = items.map(i => 
                                  i.id === item.id ? { ...i, quantity3: newQuantity3 > 0 ? newQuantity3 : undefined } : i
                                );
                                // Usar método interno do store para atualizar
                                useCartStore.setState({ items: updatedItems });
                              }}
                              className="w-20 p-2 border border-gray-300 rounded text-sm text-center"
                            />
                          </td>
                          <td className="py-6 px-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-[#2CB20B] hover:text-green-700 hover:bg-green-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {items.map((item, index) => {
                  // Buscar produto completo para ter acesso às colorVariations
                  const product = products.find(p => p.id === item.id);
                  
                  return (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      {/* Product Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <img
                          src={(() => {
                            // Se há uma cor selecionada, buscar imagem específica para essa cor
                            if (item.selectedColor && product?.colorVariations) {
                              const colorVariation = product.colorVariations.find(
                                (variation: any) => variation.color.toLowerCase() === item.selectedColor.toLowerCase()
                              );
                              if (colorVariation && colorVariation.image) {
                                return colorVariation.image;
                              }
                            }
                            
                            // Fallback para imagem padrão
                            return item.image;
                          })()} 
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1">{item.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">{item.id}</p>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {product?.description || 'Descrição não disponível'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Color Selection */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Cor</label>
                        <select 
                          value={item.selectedColor || ''}
                          onChange={(e) => updateItemColor(item.id, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                        >
                          <option value="">Selecionar cor</option>
                          {Array.isArray(product?.colorVariations) && product.colorVariations.length > 0 && (
                            product.colorVariations.map((variation: any) => (
                              <option key={variation.color} value={variation.color}>
                                {variation.color.toUpperCase()}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      {/* Quantities */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Qtd 1</label>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity || ''}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Qtd 2</label>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity2 || ''}
                            onChange={(e) => {
                              const newQuantity2 = parseInt(e.target.value) || 0;
                              // Atualizar quantity2 no store
                              const updatedItems = items.map(i => 
                                i.id === item.id ? { ...i, quantity2: newQuantity2 > 0 ? newQuantity2 : undefined } : i
                              );
                              // Usar método interno do store para atualizar
                              useCartStore.setState({ items: updatedItems });
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Qtd 3</label>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity3 || ''}
                            onChange={(e) => {
                              const newQuantity3 = parseInt(e.target.value) || 0;
                              // Atualizar quantity3 no store
                              const updatedItems = items.map(i => 
                                i.id === item.id ? { ...i, quantity3: newQuantity3 > 0 ? newQuantity3 : undefined } : i
                              );
                              // Usar método interno do store para atualizar
                              useCartStore.setState({ items: updatedItems });
                            }}
                            className="w-full p-2 border border-gray-300 rounded text-sm text-center"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
  
            {/* Observações */}
            <Card className="p-4 md:p-6">
              <textarea
                 placeholder="Observações"
                 value={observations}
                 onChange={(e) => updateObservations(e.target.value)}
                 className="w-full p-3 md:p-4 border border-gray-300 rounded-md resize-none text-sm"
                 rows={3}
               />
            </Card>
  
            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <Button
                variant="outline"
                onClick={handleAddMoreProducts}
                className="flex-1 py-3 md:py-4 px-4 md:px-6 text-base md:text-lg bg-gray-400 hover:bg-gray-500 text-white border-gray-400 hover:border-gray-500"
              >
                ADICIONAR MAIS PRODUTOS
              </Button>
              <Button
                 onClick={() => setShowQuoteForm(true)}
                 className="flex-1 py-3 md:py-4 px-4 md:px-6 text-base md:text-lg bg-[#2CB20B] hover:bg-[#25A009] tracking-wide"
               >FINALIZAR ORÇAMENTO</Button>
            </div>
                {/* Formulário Expandido */}
                <div className={`transition-all duration-500 ease-in-out overflow-visible ${
                  showQuoteForm ? 'max-h-none opacity-100 mt-4 md:mt-6' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                <Card className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 md:w-5 md:h-5 text-[#2CB20B]" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900">Solicitar Orçamento</h2>
                      <p className="text-xs md:text-sm text-gray-600">Para solicitar seu orçamento personalizado, informe seu e-mail.</p>
                    </div>
                  </div>
  
                  {step === 'email' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="seu@email.com"
                          disabled={loading}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
  
  
                      </div>
                      <Button
                        onClick={handleEmailCheck}
                        disabled={loading || !formData.email}
                        className="w-full bg-[#2CB20B] hover:bg-[#25A009] text-white py-3 rounded-lg font-medium transition-colors duration-200"
                      >
                        {loading ? 'Verificando...' : 'Continuar'}
                      </Button>
                    </div>
                  )}
  
                  {step === 'register' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                            <User className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm ${
                              errors.name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Seu nome completo"
                            disabled={loading}
                          />
                          {errors.name && (
                            <p className="mt-1 text-xs md:text-sm text-red-600">{errors.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                            <Phone className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                            Telefone *
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                            className={`w-full px-3 md:px-4 py-2 md:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm ${
                              errors.phone ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="(27) 99958-6250"
                            disabled={loading}
                          />
                          {errors.phone && (
                            <p className="mt-1 text-xs md:text-sm text-red-600">{errors.phone}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building className="w-4 h-4 inline mr-1" />
                          Nome da Empresa *
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                            errors.company ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Nome da sua empresa"
                          disabled={loading}
                        />
                        {errors.company && (
                          <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FileText className="w-4 h-4 inline mr-1" />
                          CNPJ (opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.cnpj}
                          onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${
                            errors.cnpj ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="00.000.000/0000-00"
                          disabled={loading}
                        />
                        {errors.cnpj && (
                          <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.acceptTerms}
                            onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                            className="mt-1 w-4 h-4 text-[#2CB20B] border-gray-300 rounded focus:ring-green-500"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-700">
                            Aceito os{' '}
                            <a href="#" className="text-[#2CB20B] hover:text-green-700 underline">
                              termos de uso
                            </a>{' '}
                            e{' '}
                            <a href="#" className="text-[#2CB20B] hover:text-green-700 underline">
                              política de privacidade
                            </a>
                            *
                          </span>
                        </label>
                        {errors.acceptTerms && (
                          <p className="text-sm text-red-600">{errors.acceptTerms}</p>
                        )}
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.receiveNews}
                            onChange={(e) => handleInputChange('receiveNews', e.target.checked)}
                            className="mt-1 w-4 h-4 text-[#2CB20B] border-gray-300 rounded focus:ring-green-500"
                            disabled={loading}
                          />
                          <span className="text-sm text-gray-700">
                            Desejo receber novidades e promoções por e-mail
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-3 pb-4 md:pb-0">
                        <Button
                          onClick={() => setStep('email')}
                          variant="outline"
                          disabled={loading}
                          className="flex-1 py-2 md:py-3 rounded-lg font-medium transition-colors duration-200 text-sm md:text-base"
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={handleSubmitQuote}
                          disabled={loading}
                          className="flex-1 bg-[#2CB20B] hover:bg-[#25A009] text-white py-2 md:py-3 rounded-lg font-medium transition-colors duration-200 text-sm md:text-base"
                        >
                          {loading ? 'Enviando...' : 'Enviar Orçamento'}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
                 </div>
               </div>
             </>
           )}

         {/* Success Popup */}
         {showSuccessPopup && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check className="w-8 h-8 text-[#2CB20B]" />
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">Sucesso!</h2>
               <p className="text-gray-600 mb-6">
                 Solicitação de orçamento enviada com sucesso! Você será redirecionado para a página inicial.
               </p>
               <Button
                 onClick={() => {
                   setShowSuccessPopup(false);
                   navigate('/');
                 }}
                 className="w-full bg-[#2CB20B] hover:bg-[#25A009] text-white py-3 rounded-lg font-medium"
               >Ir para Página Inicial</Button>
             </div>
           </div>
         )}


       </div>
     </div>
   </>
   );
}