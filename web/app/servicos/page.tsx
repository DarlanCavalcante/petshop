'use client';

import AppLayout from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Pencil, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useServicosData } from '@/lib/useServicosData';

export default function ServicosPage() {
  const {
    servicos, loading,
    nome, setNome, descricao, setDescricao, preco, setPreco, duracao, setDuracao,
    showModal, setShowModal, showEditModal, setShowEditModal,
    editNome, setEditNome, editDescricao, setEditDescricao, editPreco, setEditPreco, editDuracao, setEditDuracao,
    criarServico, toggleAtivo, abrirEdicao, salvarEdicao
  } = useServicosData();

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-8 h-8" /> Servicos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie os servicos oferecidos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-5 h-5" /> Novo Servico
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          {loading ? (
            <div className="py-12 text-center text-gray-500">Carregando...</div>
          ) : servicos.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Nenhum servico cadastrado</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicos.map(s => (
                <motion.div
                  key={s.id_servico}
                  whileHover={{ scale: 1.02 }}
                  className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-colors relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" /> {s.nome}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {s.descricao || 'Sem descricao'}
                      </p>
                      <p className="mt-2 font-medium text-gray-900 dark:text-gray-200">
                        R$ {Number(s.preco_base).toFixed(2)}
                      </p>
                      {s.duracao_padrao && (
                        <p className="text-xs text-gray-500 mt-1">⏱️ {s.duracao_padrao} min</p>
                      )}
                      <p className="text-xs mt-1 text-gray-500">
                        Criado: {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleAtivo(s)}
                      className={`p-2 rounded-lg ${s.ativo === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} hover:opacity-80`}
                      title={s.ativo === 1 ? 'Inativar' : 'Ativar'}
                    >
                      {s.ativo === 1 ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => abrirEdicao(s)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5" /> Criar Servico
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descricao</label>
                <textarea
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
                  rows={3}
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Preco Base *</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  value={preco}
                  onChange={e => setPreco(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duracao Padrao (minutos)</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  value={duracao}
                  onChange={e => setDuracao(e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={criarServico}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5" /> Editar Servico
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descricao</label>
                <textarea
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
                  rows={3}
                  value={editDescricao}
                  onChange={e => setEditDescricao(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Preco Base *</label>
                <input
                  type="number"
                  step="0.01"
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  value={editPreco}
                  onChange={e => setEditPreco(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duracao Padrao (minutos)</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  value={editDuracao}
                  onChange={e => setEditDuracao(e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AppLayout>
  );
}
