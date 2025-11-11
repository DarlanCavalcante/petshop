'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Plus, Eye, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { API_URL } from '@/lib/config';

// Componente para listar pacotes ativos do cliente
function PacotesDoCliente({ idCliente }: { idCliente: number }) {
  const [loading, setLoading] = useState(true);
  const [pacotes, setPacotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchPacotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const empresa = localStorage.getItem('empresa') || 'teste';
        const res = await fetch(`${API_URL}/clientes/${idCliente}/pacotes?status=ativo`, {
          headers: { 'Authorization': `Bearer ${token}`, 'X-Empresa': empresa },
          mode: 'cors'
        });
        if (res.ok) {
          setPacotes(await res.json());
        }
      } catch (e) {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    fetchPacotes();
  }, [idCliente]);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span>Pacotes Ativos</span>
        <span className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900 dark:text-purple-300">{loading ? '...' : pacotes.length}</span>
      </h3>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando pacotes...</p>}
      {!loading && pacotes.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Nenhum pacote ativo</p>
      )}
      <div className="space-y-3">
        {pacotes.map(p => (
          <div key={p.id_cliente_pacote} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-700/40">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{p.pacote_nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{p.pacote_tipo === 'creditos' ? 'Créditos' : 'Combo único'}</p>
              </div>
              {p.pacote_tipo === 'creditos' && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Restantes: {p.usos_restantes}</span>
              )}
            </div>
            {p.data_validade && (
              <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">Validade: {new Date(p.data_validade).toLocaleDateString()}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {p.servicos.slice(0,6).map((s: any) => (
                <span key={s.id_servico} className="text-[10px] px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full">{s.nome}</span>
              ))}
              {p.servicos.length > 6 && (
                <span className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded-full">+{p.servicos.length - 6}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Cliente {
  id_cliente: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  ativo: boolean;
  created_at: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [pacoteId, setPacoteId] = useState<number | null>(null);
  const [valorPago, setValorPago] = useState<string>('');
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco_cidade: '',
    endereco_estado: ''
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa') || 'teste';
      
      const response = await fetch(`${API_URL}/clientes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
        },
      });

      if (!response.ok) throw new Error('Erro ao carregar clientes');
      
      const data = await response.json();
      setClientes(data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa') || 'teste';
      
      const response = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao criar cliente');
      
      toast.success('Cliente cadastrado com sucesso!');
      setShowModal(false);
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        email: '',
        endereco_cidade: '',
        endereco_estado: ''
      });
      loadClientes();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar cliente');
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.cpf.includes(searchTerm) ||
    cliente.telefone.includes(searchTerm) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowViewModal(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    toast('Funcionalidade de edição em desenvolvimento', { icon: 'ℹ️' });
  };

  const handleDeleteCliente = (cliente: Cliente) => {
    toast('Funcionalidade de exclusão em desenvolvimento', { icon: '🚧' });
  };

  const abrirVendaPacote = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setPacoteId(null);
    setValorPago('');
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa') || 'teste';
      const res = await fetch(`${API_URL}/pacotes?ativo=true`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Empresa': empresa },
        mode: 'cors'
      });
      if (res.ok) {
        setPacotes(await res.json());
        setShowBuyModal(true);
      } else {
        toast.error('Não foi possível carregar pacotes');
      }
    } catch (e: any) {
      toast.error('Erro ao carregar pacotes');
    }
  };

  const confirmarVendaPacote = async () => {
    if (!selectedCliente || !pacoteId) {
      toast.error('Selecione um pacote');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa') || 'teste';
      const payload: any = { id_pacote: pacoteId };
      if (valorPago) payload.valor_pago = parseFloat(valorPago);
      const res = await fetch(`${API_URL}/clientes/${selectedCliente.id_cliente}/pacotes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Pacote vendido com sucesso!');
      setShowBuyModal(false);
    } catch (e: any) {
      toast.error('Erro ao vender pacote');
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus clientes e pets
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </motion.button>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Clientes Ativos</p>
              <h3 className="text-4xl font-bold mt-1">{clientes.length}</h3>
            </div>
            <Users className="w-16 h-16 opacity-80" />
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </motion.div>

        {/* Clientes Grid */}
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
              {filteredClientes.map((cliente, index) => (
                <motion.div
                  key={cliente.id_cliente}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4 cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {cliente.nome}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {cliente.cpf}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        {cliente.telefone}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        {cliente.email}
                      </div>
                    )}
                    {cliente.endereco_cidade && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {cliente.endereco_cidade}, {cliente.endereco_estado}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleViewCliente(cliente)}
                      className="flex-1 p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Ver</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => abrirVendaPacote(cliente)}
                      className="flex-1 p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Vender Pacote</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditCliente(cliente)}
                      className="flex-1 p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Editar</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteCliente(cliente)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredClientes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tente ajustar a busca ou cadastre um novo cliente
            </p>
          </motion.div>
        )}
      </div>

      {/* Modal Ver Cliente */}
      <AnimatePresence>
        {showViewModal && selectedCliente && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedCliente.nome.charAt(0).toUpperCase()}
                </div>
                <div>

                {/* Modal Vender Pacote */}
                <AnimatePresence>
                  {showBuyModal && selectedCliente && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4"
                      >
                        <h2 className="text-xl font-bold">Vender Pacote para {selectedCliente.nome}</h2>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Pacote *</label>
                            <select
                              className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                              value={pacoteId ?? ''}
                              onChange={e => setPacoteId(Number(e.target.value) || null)}
                            >
                              <option value="">Selecione um pacote...</option>
                              {pacotes.map((p: any) => (
                                <option key={p.id_pacote} value={p.id_pacote}>
                                  {p.nome} {p.tipo === 'creditos' ? `(Créditos: ${p.max_usos} / ${p.validade_dias} dias)` : '(Combo)'} - R$ {Number(p.preco_base).toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Valor Pago (opcional)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                              value={valorPago}
                              onChange={e => setValorPago(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <button onClick={() => setShowBuyModal(false)} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                          <button onClick={confirmarVendaPacote} className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg">Confirmar</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedCliente.nome}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">{selectedCliente.cpf}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCliente.telefone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCliente.email || '-'}</p>
                  </div>
                  {selectedCliente.endereco_cidade && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cidade</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCliente.endereco_cidade}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCliente.endereco_estado}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Pacotes ativos do cliente */}
                <PacotesDoCliente idCliente={selectedCliente.id_cliente} />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Novo Cliente */}
      <AnimatePresence>
        {showModal && (
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
                Novo Cliente
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.endereco_cidade}
                      onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={formData.endereco_estado}
                      onChange={(e) => setFormData({ ...formData, endereco_estado: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
    </AppLayout>
  );
}
