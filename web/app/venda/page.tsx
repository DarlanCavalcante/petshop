'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ShoppingCart, Trash2, User, Package, DollarSign, X, UserPlus, PackagePlus } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { API_URL } from '@/lib/config';

type Produto = { 
  id_produto: number; 
  nome: string; 
  preco_venda: number; 
  estoque_total: number;
  categoria: string;
};

type Cliente = { 
  id_cliente: number; 
  nome: string;
  telefone?: string;
  email?: string;
};

type ItemVenda = { 
  id_produto: number; 
  nome: string; 
  qtd: number; 
  preco: number 
};

export default function VendaPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [desconto, setDesconto] = useState<number>(0);
  const [idFuncionario, setIdFuncionario] = useState<number | null>(null);
  
  const [searchCliente, setSearchCliente] = useState('');
  const [searchProduto, setSearchProduto] = useState('');
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  
  // Form novo cliente
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    console.log('=== ESTADO CLIENTES ATUALIZADO ===');
    console.log('Total de clientes no estado:', clientes.length);
    console.log('Clientes:', clientes);
  }, [clientes]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa') || 'teste';
      
      console.log('=== LOAD DATA ===');
      console.log('API_URL:', API_URL);
      console.log('Token:', token ? token.substring(0, 50) + '...' : 'null');
      console.log('Empresa:', empresa);
      
      if (!token) {
        console.error('Token não encontrado, redirecionando para login');
        window.location.href = '/login';
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Empresa': empresa
      };

      console.log('Headers:', headers);

      // Obter funcionário logado
      console.log('Fazendo requisição para:', `${API_URL}/auth/me`);
      const meRes = await fetch(`${API_URL}/auth/me`, { 
        headers,
        mode: 'cors'
      });
      console.log('Auth /me status:', meRes.status);
      if (meRes.ok) {
        const userData = await meRes.json();
        console.log('User data:', userData);
        setIdFuncionario(userData.id);
      } else {
        const errorText = await meRes.text();
        console.error('Erro ao obter usuário:', errorText);
      }

      // Carregar produtos
      console.log('Fazendo requisição para:', `${API_URL}/produtos`);
      const produtosRes = await fetch(`${API_URL}/produtos`, { 
        headers,
        mode: 'cors'
      });
      console.log('Produtos status:', produtosRes.status);
      if (produtosRes.ok) {
        const produtosData = await produtosRes.json();
        console.log('Produtos carregados:', produtosData.length);
        setProdutos(produtosData);
      } else {
        const errorText = await produtosRes.text();
        console.error('Erro ao carregar produtos:', errorText);
      }

      // Carregar clientes
      console.log('Fazendo requisição para:', `${API_URL}/clientes`);
      const clientesRes = await fetch(`${API_URL}/clientes`, { 
        headers,
        mode: 'cors'
      });
      console.log('Clientes status:', clientesRes.status);
      console.log('Clientes response ok:', clientesRes.ok);
      
      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        console.log('=== CLIENTES RECEBIDOS ===');
        console.log('Raw data:', clientesData);
        console.log('Tipo:', Array.isArray(clientesData) ? 'Array' : typeof clientesData);
        console.log('Quantidade:', clientesData.length);
        console.log('Primeiro cliente:', clientesData[0]);
        setClientes(clientesData);
        console.log('Estado atualizado com', clientesData.length, 'clientes');
      } else {
        const errorText = await clientesRes.text();
        console.error('Erro HTTP ao carregar clientes:', clientesRes.status, errorText);
        toast.error(`Erro ao carregar clientes: ${clientesRes.status}`);
      }
    } catch (error: any) {
      console.error('ERRO no loadData:', error);
      console.error('Stack:', error.stack);
      toast.error('Erro de conexão com a API. Verifique se está rodando na porta 8000');
    }
  };

  const filteredClientes = useMemo(() => {
    console.log('=== FILTRO DE CLIENTES ===');
    console.log('Total clientes no array:', clientes.length);
    console.log('Termo de busca:', searchCliente);
    
    const filtered = clientes.filter(c => {
      const match = c.nome.toLowerCase().includes(searchCliente.toLowerCase());
      console.log(`Cliente "${c.nome}" - Match: ${match}`);
      return match;
    });
    
    console.log('Clientes filtrados:', filtered.length);
    console.log('Resultado:', filtered);
    return filtered;
  }, [clientes, searchCliente]);

  const filteredProdutos = produtos.filter(p =>
    p.nome.toLowerCase().includes(searchProduto.toLowerCase()) &&
    p.estoque_total > 0
  );

  const total = useMemo(() => 
    itens.reduce((acc, item) => acc + item.qtd * item.preco, 0), 
    [itens]
  );

  const valorFinal = Math.max(total - desconto, 0);

  const addItem = (produto: Produto) => {
    const existing = itens.find(i => i.id_produto === produto.id_produto);
    if (existing) {
      if (existing.qtd + 1 > produto.estoque_total) {
        toast.error('Estoque insuficiente');
        return;
      }
      setItens(itens.map(i => 
        i.id_produto === produto.id_produto 
          ? { ...i, qtd: i.qtd + 1 }
          : i
      ));
    } else {
      setItens([...itens, {
        id_produto: produto.id_produto,
        nome: produto.nome,
        qtd: 1,
        preco: Number(produto.preco_venda)
      }]);
    }
    toast.success(`${produto.nome} adicionado`);
  };

  const updateQtd = (id_produto: number, qtd: number) => {
    const produto = produtos.find(p => p.id_produto === id_produto);
    if (produto && qtd > produto.estoque_total) {
      toast.error('Quantidade maior que estoque');
      return;
    }
    setItens(itens.map(i => 
      i.id_produto === id_produto ? { ...i, qtd: Math.max(1, qtd) } : i
    ));
  };

  const updatePreco = (id_produto: number, preco: number) => {
    setItens(itens.map(i => 
      i.id_produto === id_produto ? { ...i, preco: Math.max(0, preco) } : i
    ));
  };

  const removeItem = (id_produto: number) => {
    setItens(itens.filter(i => i.id_produto !== id_produto));
    toast.success('Item removido');
  };

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa') || 'teste';
      
      const response = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...novoCliente,
          endereco_cidade: '',
          endereco_estado: ''
        })
      });

      if (!response.ok) throw new Error('Erro ao cadastrar cliente');
      
      const newCliente = await response.json();
      toast.success('Cliente cadastrado com sucesso!');
      setShowNovoClienteModal(false);
      setNovoCliente({ nome: '', cpf: '', telefone: '', email: '' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar cliente');
    }
  };

  const submitVenda = async () => {
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa') || 'teste';
      
      if (!selectedCliente) {
        toast.error('Selecione um cliente');
        return;
      }
      if (!idFuncionario) {
        toast.error('Funcionário não identificado');
        return;
      }
      if (itens.length === 0) {
        toast.error('Adicione pelo menos um produto');
        return;
      }

      const payload = {
        id_cliente: selectedCliente.id_cliente,
        id_funcionario: idFuncionario,
        itens: itens.map(i => ({ 
          id_produto: i.id_produto, 
          qtd: i.qtd, 
          preco: i.preco 
        })),
        desconto: desconto || 0
      };

      const response = await fetch(`${API_URL}/vendas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      toast.success(`Venda #${data.id_venda} registrada! Total: R$ ${data.valor_final.toFixed(2)}`);
      
      // Limpar formulário
      setItens([]);
      setDesconto(0);
      setSelectedCliente(null);
      loadData(); // Recarregar produtos para atualizar estoque
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar venda');
    }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Venda</h1>
          <p className="text-gray-600 dark:text-gray-400">Registre uma nova venda no sistema</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cliente */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cliente
                </h2>
                <button
                  onClick={() => setShowNovoClienteModal(true)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Novo Cliente"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              {selectedCliente ? (
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg">{selectedCliente.nome}</p>
                      {selectedCliente.telefone && (
                        <p className="text-sm opacity-90">{selectedCliente.telefone}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCliente(null)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowClienteModal(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  Selecionar Cliente
                </button>
              )}

              {/* Resumo da Venda */}
              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-semibold">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Desconto:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={total}
                    value={desconto}
                    onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                    className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-right"
                  />
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">R$ {valorFinal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={submitVenda}
                disabled={!selectedCliente || itens.length === 0}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Finalizar Venda
              </button>
            </div>
          </motion.div>

          {/* Produtos e Carrinho */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Produtos Disponíveis */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produtos ({produtos.filter(p => p.estoque_total > 0).length})
                </h2>
                <button
                  onClick={() => window.location.href = '/produtos'}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Cadastrar Produto"
                >
                  <PackagePlus className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchProduto}
                  onChange={(e) => setSearchProduto(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProdutos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                ) : (
                  filteredProdutos.map((produto) => (
                    <motion.div
                      key={produto.id_produto}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{produto.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          R$ {Number(produto.preco_venda).toFixed(2)} · Estoque: {produto.estoque_total}
                        </p>
                      </div>
                      <button
                        onClick={() => addItem(produto)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Carrinho */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrinho ({itens.length})
              </h2>

              <div className="space-y-3">
                <AnimatePresence>
                  {itens.map((item) => (
                    <motion.div
                      key={item.id_produto}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{item.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          R$ {Number(item.preco).toFixed(2)} × {item.qtd} = R$ {(Number(item.preco) * item.qtd).toFixed(2)}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={item.qtd}
                        onChange={(e) => updateQtd(item.id_produto, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-center"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.preco}
                        onChange={(e) => updatePreco(item.id_produto, parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-right"
                      />
                      <button
                        onClick={() => removeItem(item.id_produto)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {itens.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos para começar a venda</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal Selecionar Cliente */}
      <AnimatePresence>
        {showClienteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClienteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Selecionar Cliente
                </h2>
                <button
                  onClick={() => {
                    loadData();
                    toast.success('Dados recarregados');
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                >
                  Recarregar
                </button>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Total de clientes: {clientes.length} | Exibindo: {filteredClientes.length}
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredClientes.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Nenhum cliente encontrado</p>
                    <button
                      onClick={() => {
                        setShowClienteModal(false);
                        setShowNovoClienteModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Cadastrar Novo Cliente
                    </button>
                  </div>
                ) : (
                  filteredClientes.map((cliente) => (
                    <motion.button
                      key={cliente.id_cliente}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setSelectedCliente(cliente);
                        setShowClienteModal(false);
                        setSearchCliente('');
                      }}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="font-semibold text-gray-900 dark:text-white">{cliente.nome}</p>
                      {cliente.telefone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cliente.telefone}</p>
                      )}
                    </motion.button>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowClienteModal(false)}
                className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Cliente */}
      <AnimatePresence>
        {showNovoClienteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNovoClienteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Cadastro Rápido de Cliente
              </h2>
              
              <form onSubmit={handleCreateCliente} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoCliente.nome}
                    onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoCliente.cpf}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoCliente.telefone}
                    onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={novoCliente.email}
                    onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNovoClienteModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700"
                  >
                    Cadastrar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
