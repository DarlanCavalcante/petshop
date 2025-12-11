"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Calendar, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { usePackagesData, Pacote } from '@/lib/usePackagesData';

export default function PacotesPage() {
  const {
    pacotes, servicos, loading, criarPacote, editarPacote, helpers
  } = usePackagesData();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<Pacote | null>(null);

  // Estados para formulário de criação
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [tipo, setTipo] = useState<'combo' | 'creditos'>('combo');
  const [validade, setValidade] = useState('');
  const [maxUsos, setMaxUsos] = useState('');
  const [servicosSelecionados, setServicosSelecionados] = useState<number[]>([]);

  // Estados para formulário de edição
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editPreco, setEditPreco] = useState('');
  const [editValidade, setEditValidade] = useState('');
  const [editMaxUsos, setEditMaxUsos] = useState('');
  const [editServicosSelecionados, setEditServicosSelecionados] = useState<number[]>([]);







  const abrirEdicao = (p: Pacote) => {
    setEditing(p);
    setEditNome(p.nome);
    setEditDescricao(p.descricao || '');
    setEditPreco(String(p.preco_base));
    setEditValidade(p.validade_dias ? String(p.validade_dias) : '');
    setEditMaxUsos(p.max_usos ? String(p.max_usos) : '');
    setEditServicosSelecionados(p.servicos.map((s) => s.id_servico));
    setShowEditModal(true);
  };


  const salvarEdicao = async () => {
    if (!editing) return;
    const payload: Partial<Pacote> = {};
    if (editNome !== editing.nome) payload.nome = editNome;
    if (editDescricao !== (editing.descricao || '')) payload.descricao = editDescricao || null;
    if (parseFloat(editPreco) !== editing.preco_base) payload.preco_base = parseFloat(editPreco);
    if (editing.tipo === 'creditos') {
      const newValidade = parseInt(editValidade);
      const newMaxUsos = parseInt(editMaxUsos);
      if (newValidade !== editing.validade_dias) payload.validade_dias = newValidade;
      if (newMaxUsos !== editing.max_usos) payload.max_usos = newMaxUsos;
    }
    const oldIds = editing.servicos.map((s) => s.id_servico).sort().join(',');
    const newIds = editServicosSelecionados.sort().join(',');
    if (oldIds !== newIds) {
      (payload as any).servicos_ids = editServicosSelecionados;
    }
    if (Object.keys(payload).length === 0) {
      alert("Nenhuma alteração detectada");
      setShowEditModal(false);
      return;
    }
    await editarPacote(editing.id_pacote, payload);
    setShowEditModal(false);
  };


  const toggleServico = (id: number, lista: number[], setter: (ids: number[]) => void) => {
    if (lista.includes(id)) {
      setter(lista.filter(x => x !== id));
    } else {
      setter([...lista, id]);
    }
  };

  const calcularTotal = helpers.calcularTotal;

  if (loading) return <AppLayout><div className="p-8">Carregando...</div></AppLayout>;

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-600" />
              Pacotes de Serviços
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Crie combos e planos de serviços com preços especiais
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Novo Pacote
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Pacotes</p>
                <p className="text-2xl font-bold">{pacotes.length}</p>
              </div>
              <Package className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </motion.div>
          <motion.div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Combos</p>
                <p className="text-2xl font-bold">{pacotes.filter(p => p.tipo === 'combo').length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </motion.div>
          <motion.div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Planos/Créditos</p>
                <p className="text-2xl font-bold">{pacotes.filter(p => p.tipo === 'creditos').length}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </motion.div>
        </div>

        {/* Lista de Pacotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pacotes.map(p => (
            <motion.div
              key={p.id_pacote}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
            >
              {/* Badge tipo */}
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  p.tipo === 'combo' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}>
                  {p.tipo === 'combo' ? '📦 Combo' : '🎫 Créditos'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirEdicao(p)}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{p.nome}</h3>
              {p.descricao && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{p.descricao}</p>}

              {/* Preço */}
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">R$ {Number(p.preco_base).toFixed(2)}</span>
              </div>

              {/* Info de créditos */}
              {p.tipo === 'creditos' && (
                <div className="flex gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{p.validade_dias} dias</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>{p.max_usos} usos</span>
                  </div>
                </div>
              )}

              {/* Serviços incluídos */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">SERVIÇOS INCLUÍDOS:</p>
                <ul className="space-y-1">
                  {p.servicos.map(s => (
                    <li key={s.id_servico} className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {s.nome}
                    </li>
                  ))}
                </ul>
                {p.servicos.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Nenhum serviço vinculado</p>
                )}
              </div>

              {/* Status */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className={`flex items-center gap-1 text-sm ${p.ativo ? 'text-green-600' : 'text-red-600'}`}>
                  {p.ativo ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {pacotes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Nenhum pacote cadastrado. Crie o primeiro!</p>
          </div>
        )}

        {/* Modal Criar */}
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" /> Criar Pacote
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <input
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex: Spa Completo"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <textarea
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
                    rows={2}
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder="Descrição do pacote..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tipo *</label>
                  <select
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    value={tipo}
                    onChange={e => setTipo(e.target.value as 'combo' | 'creditos')}
                  >
                    <option value="combo">Combo (uso único)</option>
                    <option value="creditos">Créditos (uso parcelado)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      value={preco}
                      onChange={e => setPreco(e.target.value)}
                    />
                  </div>

                  {tipo === 'creditos' && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Validade (dias) *</label>
                        <input
                          type="number"
                          className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                          value={validade}
                          onChange={e => setValidade(e.target.value)}
                          placeholder="Ex: 30"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Qtd. Usos *</label>
                        <input
                          type="number"
                          className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                          value={maxUsos}
                          onChange={e => setMaxUsos(e.target.value)}
                          placeholder="Ex: 4"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Serviços Incluídos *</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                    {servicos.map(s => (
                      <label key={s.id_servico} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={servicosSelecionados.includes(s.id_servico)}
                          onChange={() => toggleServico(s.id_servico, servicosSelecionados, setServicosSelecionados)}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">{s.nome}</span>
                        <span className="text-sm text-gray-500">R$ {Number(s.preco_base).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                  {servicosSelecionados.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Total individual: R$ {calcularTotal(servicosSelecionados).toFixed(2)} | 
                      Pacote: R$ {preco || '0.00'} | 
                      Economia: R$ {(calcularTotal(servicosSelecionados) - parseFloat(preco || '0')).toFixed(2)}
                    </p>
                  )}
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
                  onClick={criarPacote}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
                >
                  Criar Pacote
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Editar (similar ao criar, mas com editX states) */}
        {showEditModal && editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5" /> Editar Pacote
              </h2>

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
                  <label className="text-sm font-medium">Descrição</label>
                  <textarea
                    className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
                    rows={2}
                    value={editDescricao}
                    onChange={e => setEditDescricao(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      value={editPreco}
                      onChange={e => setEditPreco(e.target.value)}
                    />
                  </div>

                  {editing.tipo === 'creditos' && (
                    <>
                      <div>
                        <label className="text-sm font-medium">Validade (dias) *</label>
                        <input
                          type="number"
                          className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                          value={editValidade}
                          onChange={e => setEditValidade(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Qtd. Usos *</label>
                        <input
                          type="number"
                          className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                          value={editMaxUsos}
                          onChange={e => setEditMaxUsos(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Serviços Incluídos *</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                    {servicos.map(s => (
                      <label key={s.id_servico} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={editServicosSelecionados.includes(s.id_servico)}
                          onChange={() => toggleServico(s.id_servico, editServicosSelecionados, setEditServicosSelecionados)}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">{s.nome}</span>
                        <span className="text-sm text-gray-500">R$ {Number(s.preco_base).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
