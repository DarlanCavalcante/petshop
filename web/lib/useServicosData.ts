import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

/**
 * Hook para gerenciar dados e operações dos Serviços.
 * Fornece estado, carregamento, criação, edição e ativação/inativação de serviços.
 *
 * @returns Todos os estados, setters e handlers necessários para a página de Serviços.
 */
export function useServicosData() {
  const [servicos, setServicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editPreco, setEditPreco] = useState('');
  const [editDuracao, setEditDuracao] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<string>('');

  useEffect(() => {
    setToken(sessionStorage.getItem('token'));
    setEmpresa(sessionStorage.getItem('empresa') || 'teste');
    load();
    // eslint-disable-next-line
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/servicos');
      setServicos(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const criarServico = useCallback(async () => {
    try {
      if (!token) throw new Error('Sem token');
      const payload: any = {
        nome,
        descricao,
        preco_base: parseFloat(preco),
        ativo: true
      };
      if (duracao) payload.duracao_padrao = parseInt(duracao);
      await apiClient.post('/servicos', payload);
      toast.success('Serviço criado');
      setShowModal(false);
      setNome(''); setDescricao(''); setPreco(''); setDuracao('');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [token, nome, descricao, preco, duracao, load]);

  const toggleAtivo = useCallback(async (s: any) => {
    try {
      await apiClient.patch(`/servicos/${s.id_servico}/ativo`, { ativo: s.ativo !== 1 });
      toast.success('Status atualizado');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [load]);

  const abrirEdicao = useCallback((s: any) => {
    setEditing(s);
    setEditNome(s.nome || '');
    setEditDescricao(s.descricao || '');
    setEditPreco(String(Number(s.preco_base).toFixed(2)));
    setEditDuracao(s.duracao_padrao ? String(s.duracao_padrao) : '');
    setShowEditModal(true);
  }, []);

  const salvarEdicao = useCallback(async () => {
    try {
      if (!editing) return;
      const t = sessionStorage.getItem('token');
      const e = sessionStorage.getItem('empresa') || 'teste';
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
      await apiClient.put(`/servicos/${editing.id_servico}`, payload);
      toast.success('Serviço atualizado');
      setShowEditModal(false);
      setEditing(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    }
  }, [editing, editNome, editDescricao, editPreco, editDuracao, load]);

  return {
    servicos, setServicos, loading, setLoading,
    nome, setNome, descricao, setDescricao, preco, setPreco, duracao, setDuracao,
    showModal, setShowModal, showEditModal, setShowEditModal,
    editing, setEditing, editNome, setEditNome, editDescricao, setEditDescricao, editPreco, setEditPreco, editDuracao, setEditDuracao,
    token, setToken, empresa, setEmpresa,
    load, criarServico, toggleAtivo, abrirEdicao, salvarEdicao
  };
}
