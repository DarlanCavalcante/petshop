'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, Calendar, CheckCircle, XCircle, Eye, Power, PowerOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface Empresa {
  id: number;
  nome: string;
  nome_fantasia?: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  plano: string;
  ativo: boolean;
  created_at: string;
  total_funcionarios: number;
  total_clientes: number;
  total_pets: number;
  data_assinatura?: string;
  data_expiracao?: string;
}

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const data = await api.get('/empresas');
      setEmpresas(data);
    } catch (error: any) {
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmpresaStatus = async (empresa: Empresa) => {
    try {
      const action = empresa.ativo ? 'desativar' : 'ativar';
      await api.patch(`/empresas/${empresa.id}/${action}`);

      toast.success(`Empresa ${empresa.ativo ? 'desativada' : 'ativada'} com sucesso`);

      // Se ativando, criar o banco do tenant
      if (!empresa.ativo) {
        await api.post(`/empresas/${empresa.id}/criar-banco`);
        toast.success('Banco do tenant criado com sucesso');
      }

      loadEmpresas();
    } catch (error: any) {
      toast.error(`Erro ao ${empresa.ativo ? 'desativar' : 'ativar'} empresa`);
    }
  };

  const viewEmpresa = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setShowModal(true);
  };

  const empresasPendentes = empresas.filter(e => !e.ativo);
  const empresasAtivas = empresas.filter(e => e.ativo);

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Administração de Empresas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie empresas e tenants do sistema
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Empresas Pendentes</p>
                <h3 className="text-4xl font-bold mt-1">{empresasPendentes.length}</h3>
              </div>
              <Building2 className="w-16 h-16 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Empresas Ativas</p>
                <h3 className="text-4xl font-bold mt-1">{empresasAtivas.length}</h3>
              </div>
              <CheckCircle className="w-16 h-16 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de Empresas</p>
                <h3 className="text-4xl font-bold mt-1">{empresas.length}</h3>
              </div>
              <Users className="w-16 h-16 opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Empresas Pendentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-orange-500" />
            Empresas Aguardando Aprovação ({empresasPendentes.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : empresasPendentes.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle className="w-20 h-20 text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nenhuma empresa pendente
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Todas as empresas foram aprovadas
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {empresasPendentes.map((empresa, index) => (
                  <motion.div
                    key={empresa.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {empresa.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {empresa.nome}
                          </h3>
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            Aguardando aprovação
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Email:</strong> {empresa.email}</p>
                      {empresa.telefone && <p><strong>Telefone:</strong> {empresa.telefone}</p>}
                      {empresa.cidade && <p><strong>Cidade:</strong> {empresa.cidade}, {empresa.estado}</p>}
                      <p><strong>Cadastrada em:</strong> {new Date(empresa.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-orange-200 dark:border-orange-800">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => viewEmpresa(empresa)}
                        className="flex-1 p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Ver Detalhes</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleEmpresaStatus(empresa)}
                        className="flex-1 p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Aprovar</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Empresas Ativas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Empresas Ativas ({empresasAtivas.length})
          </h2>

          {empresasAtivas.length === 0 ? (
            <div className="text-center py-20">
              <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nenhuma empresa ativa
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {empresasAtivas.map((empresa, index) => (
                  <motion.div
                    key={empresa.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {empresa.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {empresa.nome}
                          </h3>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Ativa - {empresa.plano}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{empresa.total_funcionarios || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Funcionários</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{empresa.total_clientes || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Clientes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{empresa.total_pets || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pets</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-green-200 dark:border-green-800">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => viewEmpresa(empresa)}
                        className="flex-1 p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Ver Detalhes</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleEmpresaStatus(empresa)}
                        className="flex-1 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <PowerOff className="w-4 h-4" />
                        <span className="text-sm">Desativar</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Modal Detalhes Empresa */}
        <AnimatePresence>
          {showModal && selectedEmpresa && (
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedEmpresa.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedEmpresa.nome}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedEmpresa.nome_fantasia}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedEmpresa.ativo ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Ativa
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          Aguardando aprovação
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CNPJ</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedEmpresa.cnpj || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedEmpresa.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedEmpresa.telefone || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Plano</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedEmpresa.plano}
                      </p>
                    </div>
                  </div>

                  {selectedEmpresa.endereco && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Endereço</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedEmpresa.endereco}
                        {selectedEmpresa.cidade && `, ${selectedEmpresa.cidade}`}
                        {selectedEmpresa.estado && ` - ${selectedEmpresa.estado}`}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {selectedEmpresa.total_funcionarios || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Funcionários</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {selectedEmpresa.total_clientes || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Clientes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {selectedEmpresa.total_pets || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pets</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p><strong>Cadastrada em:</strong> {new Date(selectedEmpresa.created_at).toLocaleString()}</p>
                    {selectedEmpresa.data_assinatura && (
                      <p><strong>Data de assinatura:</strong> {new Date(selectedEmpresa.data_assinatura).toLocaleDateString()}</p>
                    )}
                    {selectedEmpresa.data_expiracao && (
                      <p><strong>Data de expiração:</strong> {new Date(selectedEmpresa.data_expiracao).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => toggleEmpresaStatus(selectedEmpresa)}
                    className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                      selectedEmpresa.ativo
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {selectedEmpresa.ativo ? 'Desativar Empresa' : 'Aprovar Empresa'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}