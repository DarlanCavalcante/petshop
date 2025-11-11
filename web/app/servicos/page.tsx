"use client";
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { API_URL } from '@/lib/config';
import { motion } from 'framer-motion';
import { Plus, Briefcase, Pencil, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface Servico {
  id_servico: number;
  nome: string;
  descricao: string;
  preco_base: string; // vem como string do backend
  duracao_padrao: number | null; // duração em minutos
  ativo: number; // 1 ou 0
  created_at: string;
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editPreco, setEditPreco] = useState('');
  const [editDuracao, setEditDuracao] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<string>('');

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setEmpresa(localStorage.getItem('empresa') || 'teste');
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const t = localStorage.getItem('token');
      const e = localStorage.getItem('empresa') || 'teste';
      const res = await fetch(`${API_URL}/servicos`, {
        headers: { 'Authorization': `Bearer ${t}`, 'X-Empresa': e },
        mode: 'cors'
      });
      if (!res.ok) throw new Error('Falha ao carregar serviços');
      const data = await res.json();
      setServicos(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function criarServico() {
    try {
      if (!token) throw new Error('Sem token');
      const payload: any = { 
        nome, 
        descricao, 
        preco_base: parseFloat(preco), 
        ativo: true 
      };
      if (duracao) payload.duracao_padrao = parseInt(duracao);
      
      const res = await fetch(`${API_URL}/servicos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Serviço criado');
      setShowModal(false);
      setNome(''); setDescricao(''); setPreco(''); setDuracao('');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function toggleAtivo(s: Servico) {
    try {
      const t = localStorage.getItem('token');
      const e = localStorage.getItem('empresa') || 'teste';
      const res = await fetch(`${API_URL}/servicos/${s.id_servico}/ativo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}`, 'X-Empresa': e },
        body: JSON.stringify({ ativo: s.ativo !== 1 }),
        mode: 'cors'
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Status atualizado');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function abrirEdicao(s: Servico) {
    setEditing(s);
    setEditNome(s.nome || '');
    setEditDescricao(s.descricao || '');
    setEditPreco(String(Number(s.preco_base).toFixed(2)));
    setEditDuracao(s.duracao_padrao ? String(s.duracao_padrao) : '');
    setShowEditModal(true);
  }

  async function salvarEdicao() {
    try {
      if (!editing) return;
      const t = localStorage.getItem('token');
      const e = localStorage.getItem('empresa') || 'teste';
      const payload: any = {};
      if (editNome !== editing.nome) payload.nome = editNome;
      if (editDescricao !== (editing.descricao || '')) payload.descricao = editDescricao;
      if (Number(editPreco) !== Number(editing.preco_base)) payload.preco_base = Number(editPreco);
      const newDur = editDuracao ? parseInt(editDuracao) : null;
      if (newDur !== editing.duracao_padrao) payload.duracao_padrao = newDur;
      
      if (Object.keys(payload).length === 0) {
        toast('Nada para atualizar');
        setShowEditModal(false);
        return;
      }
      const res = await fetch(`${API_URL}/servicos/${editing.id_servico}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}`, 'X-Empresa': e },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Serviço atualizado');
      setShowEditModal(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    }
  }

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Briefcase className="w-8 h-8" /> Serviços</h1>
            <p className="text-gray-600 dark:text-gray-400">Gerencie os serviços oferecidos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-5 h-5" /> Novo Serviço
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
            <div className="py-12 text-center text-gray-500">Nenhum serviço cadastrado</div>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{s.descricao || 'Sem descrição'}</p>
                      <p className="mt-2 font-medium text-gray-900 dark:text-gray-200">R$ {Number(s.preco_base).toFixed(2)}</p>
                      {s.duracao_padrao && (
                        <p className="text-xs text-gray-500 mt-1">⏱️ {s.duracao_padrao} min</p>
                      )}
                      <p className="text-xs mt-1 text-gray-500">Criado: {new Date(s.created_at).toLocaleDateString('pt-BR')}</p>
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
                    <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" onClick={() => abrirEdicao(s)}>
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
            <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> Criar Serviço</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <textarea className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none" rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Preço Base *</label>
                <input type="number" step="0.01" className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={preco} onChange={e => setPreco(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Duração Padrão (minutos)</label>
                <input type="number" min="0" className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={duracao} onChange={e => setDuracao(e.target.value)} placeholder="Ex: 30" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
              <button onClick={criarServico} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg">Salvar</button>
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
              <h2 className="text-xl font-bold flex items-center gap-2"><Pencil className="w-5 h-5" /> Editar Serviço</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <input className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={editNome} onChange={e => setEditNome(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <textarea className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none" rows={3} value={editDescricao} onChange={e => setEditDescricao(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Preço Base *</label>
                <input type="number" step="0.01" className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={editPreco} onChange={e => setEditPreco(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Duração Padrão (minutos)</label>
                <input type="number" min="0" className="mt-1 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" value={editDuracao} onChange={e => setEditDuracao(e.target.value)} placeholder="Ex: 30" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
              <button onClick={salvarEdicao} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg">Salvar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AppLayout>
  );
}
