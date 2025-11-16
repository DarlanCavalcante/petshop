'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, TrendingUp, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { API_URL } from '@/lib/config';

type Produto = {
  id_produto: number;
  nome: string;
  codigo_barras: string;
  descricao: string;
  preco_venda: number;
  categoria: string;
  estoque_total: number;
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewProdutoModal, setShowNewProdutoModal] = useState(false);
  const [newProdutoForm, setNewProdutoForm] = useState({
    nome: '',
    codigo_barras: '',
    descricao: '',
    preco_venda: '',
    categoria: '',
    estoque_total: ''
  });

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const empresa = sessionStorage.getItem('empresa') || 'teste';
      
      const response = await fetch(`${API_URL}/produtos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
        },
      });

      if (!response.ok) throw new Error('Erro ao carregar produtos');
      
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      toast.error((error as Error)?.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(produtos.map(p => p.categoria)))];
  
  const filteredProdutos = produtos.filter(produto => {
    const matchSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produto.codigo_barras.includes(searchTerm);
    const matchCategory = selectedCategory === 'all' || produto.categoria === selectedCategory;
    return matchSearch && matchCategory;
  });

  const getStockColor = (estoque: number) => {
    if (estoque === 0) return 'text-red-600 bg-red-100';
    if (estoque < 10) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const handleViewProduto = (produto: Produto) => {
    setSelectedProduto(produto);
    setShowModal(true);
  };

  const handleEditProduto = () => {
    toast('Funcionalidade de edição em desenvolvimento', {
      icon: 'ℹ️',
    });
  };

  const handleDeleteProduto = (produto: Produto) => {
    setSelectedProduto(produto);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduto) return;
    
    try {
      // Aqui você pode adicionar endpoint de delete quando estiver pronto
      toast.success(`Produto ${selectedProduto.nome} removido!`);
      setShowDeleteConfirm(false);
      setSelectedProduto(null);
      loadProdutos();
    } catch {
      toast.error('Erro ao remover produto');
    }
  };

  const handleCreateProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      const empresa = sessionStorage.getItem('empresa') || 'teste';

      if (!token) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const produtoData = {
        nome: newProdutoForm.nome,
        codigo_barras: newProdutoForm.codigo_barras,
        descricao: newProdutoForm.descricao,
        preco_venda: parseFloat(newProdutoForm.preco_venda),
        categoria: newProdutoForm.categoria,
        estoque_total: parseInt(newProdutoForm.estoque_total)
      };

      const response = await fetch(`${API_URL}/produtos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(produtoData),
      });

      if (!response.ok) throw new Error('Erro ao cadastrar produto');
      
      toast.success('Produto cadastrado com sucesso!');
      setShowNewProdutoModal(false);
      setNewProdutoForm({
        nome: '',
        codigo_barras: '',
        descricao: '',
        preco_venda: '',
        categoria: '',
        estoque_total: ''
      });
      loadProdutos();
    } catch (error) {
      toast.error((error as Error)?.message || 'Erro ao cadastrar produto');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Produtos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seu catálogo de produtos
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewProdutoModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de Produtos</p>
                <h3 className="text-3xl font-bold mt-1">{produtos.length}</h3>
              </div>
              <Package className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Valor Total Estoque</p>
                <h3 className="text-3xl font-bold mt-1">
                  R$ {produtos.reduce((sum, p) => sum + (p.preco_venda * p.estoque_total), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Categorias</p>
                <h3 className="text-3xl font-bold mt-1">{categories.length - 1}</h3>
              </div>
              <Filter className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">Todas Categorias</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProdutos.map((produto, index) => (
                <motion.div
                  key={produto.id_produto}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4 cursor-pointer"
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                        {produto.nome}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {produto.codigo_barras}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStockColor(produto.estoque_total)}`}>
                      {produto.estoque_total} un
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {produto.descricao || 'Sem descrição'}
                  </p>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                      {produto.categoria}
                    </span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Preço</p>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {produto.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleViewProduto(produto)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEditProduto()}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteProduto(produto)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredProdutos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tente ajustar os filtros ou adicione um novo produto
            </p>
          </motion.div>
        )}
      </div>

      {/* Modal Ver Produto */}
      <AnimatePresence>
        {showModal && selectedProduto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Detalhes do Produto
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProduto.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Código de Barras</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProduto.codigo_barras}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Categoria</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProduto.categoria}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Preço de Venda</p>
                    <p className="text-lg font-semibold text-green-600">
                      R$ {selectedProduto.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estoque</p>
                    <p className={`text-lg font-semibold ${selectedProduto.estoque_total === 0 ? 'text-red-600' : selectedProduto.estoque_total < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {selectedProduto.estoque_total} unidades
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Descrição</p>
                  <p className="text-gray-900 dark:text-white">{selectedProduto.descricao || 'Sem descrição'}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Produto */}
      <AnimatePresence>
        {showNewProdutoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewProdutoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Cadastrar Novo Produto
              </h2>
              <form onSubmit={handleCreateProduto} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProdutoForm.nome}
                      onChange={(e) => setNewProdutoForm({ ...newProdutoForm, nome: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Ex: Ração Premium para Cães"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código de Barras *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProdutoForm.codigo_barras}
                      onChange={(e) => setNewProdutoForm({ ...newProdutoForm, codigo_barras: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Ex: 7891234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoria *
                    </label>
                    <select
                      required
                      value={newProdutoForm.categoria}
                      onChange={(e) => setNewProdutoForm({ ...newProdutoForm, categoria: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="Alimentação">Alimentação</option>
                      <option value="Higiene">Higiene</option>
                      <option value="Brinquedos">Brinquedos</option>
                      <option value="Acessórios">Acessórios</option>
                      <option value="Medicamentos">Medicamentos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preço de Venda *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={newProdutoForm.preco_venda}
                      onChange={(e) => setNewProdutoForm({ ...newProdutoForm, preco_venda: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estoque Inicial *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newProdutoForm.estoque_total}
                      onChange={(e) => setNewProdutoForm({ ...newProdutoForm, estoque_total: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <textarea
                      rows={3}
                      value={newProdutoForm.descricao}
                      onChange={(e) => setNewProdutoForm({ ...newProdutoForm, descricao: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Descrição opcional do produto..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewProdutoModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Cadastrar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Confirmar Exclusão */}
      <AnimatePresence>
        {showDeleteConfirm && selectedProduto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Confirmar Exclusão
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tem certeza que deseja remover o produto <strong>{selectedProduto.nome}</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
