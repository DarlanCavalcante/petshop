export default function Page() {
  // ...todo o conteúdo do arquivo original, incluindo hooks, funções e JSX...
}
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ShoppingCart, Trash2, User, Package, DollarSign, X, UserPlus, PackagePlus } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { useSalesData } from '@/lib/useSalesData';




  const {
    produtos, clientes, selectedCliente, setSelectedCliente, itens, setItens, desconto, setDesconto, idFuncionario,
    searchCliente, setSearchCliente, searchProduto, setSearchProduto,
    showClienteModal, setShowClienteModal, showProdutoModal, setShowProdutoModal,
    showNovoClienteModal, setShowNovoClienteModal, novoCliente, setNovoCliente,
    filteredClientes, filteredProdutos, total, valorFinal,
    addItem, updateQtd, updatePreco, removeItem, handleCreateCliente
  } = useSalesData();

  // submitVenda permanece local pois depende de API_URL e lógica de reset local
  const submitVenda = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const empresa = sessionStorage.getItem('empresa') || 'teste';
      if (!selectedCliente) {
        alert('Selecione um cliente');
        return;
      }
      if (!idFuncionario) {
        alert('Funcionário não identificado');
        return;
      }
      if (itens.length === 0) {
        alert('Adicione pelo menos um produto');
        return;
      }
      const payload = {
        id_cliente: selectedCliente.id_cliente,
        id_funcionario: idFuncionario,
        itens: itens.map((i: any) => ({ id_produto: i.id_produto, qtd: i.qtd, preco: i.preco })),
        desconto: desconto || 0
      };
      const response = await fetch(`/api/vendas`, {
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
 
        export default function Page() {
          const {
            produtos, clientes, selectedCliente, setSelectedCliente, itens, setItens, desconto, setDesconto, idFuncionario,
            searchCliente, setSearchCliente, searchProduto, setSearchProduto,
            showClienteModal, setShowClienteModal, showProdutoModal, setShowProdutoModal,
            showNovoClienteModal, setShowNovoClienteModal, novoCliente, setNovoCliente,
            filteredClientes, filteredProdutos, total, valorFinal,
            addItem, updateQtd, updatePreco, removeItem, handleCreateCliente
          } = useSalesData();

          // submitVenda permanece local pois depende de API_URL e lógica de reset local
          const submitVenda = async () => {
            try {
              const token = sessionStorage.getItem('token');
              const empresa = sessionStorage.getItem('empresa') || 'teste';
              if (!selectedCliente) {
                alert('Selecione um cliente');
                return;
              }
              if (!idFuncionario) {
                alert('Funcionário não identificado');
                return;
              }
              if (itens.length === 0) {
                alert('Adicione pelo menos um produto');
                return;
              }
              const payload = {
                id_cliente: selectedCliente.id_cliente,
                id_funcionario: idFuncionario,
                itens: itens.map((i: any) => ({ id_produto: i.id_produto, qtd: i.qtd, preco: i.preco })),
                desconto: desconto || 0
              };
              const response = await fetch(`/api/vendas`, {
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
              alert(`Venda #${data.id_venda} registrada! Total: R$ ${data.valor_final.toFixed(2)}`);
              setItens([]);
              setDesconto(0);
              setSelectedCliente(null);
            } catch (error: any) {
              alert(error.message || 'Erro ao registrar venda');
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
