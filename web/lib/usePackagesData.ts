/**
 * Hook customizado para centralizar o carregamento, criação e edição de pacotes.
 * Gerencia estado, busca, helpers e ações de CRUD para pacotes e serviços.
 *
 * @returns {object} {
 *   pacotes: Pacote[],
 *   servicos: Servico[],
 *   loading: boolean,
 *   criarPacote: (dados) => Promise<void>,
 *   editarPacote: (id, dados) => Promise<void>,
 *   helpers: { calcularTotal: (ids: number[]) => number }
 * }
 */
import { useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

export type Pacote = {
  id_pacote: number;
  nome: string;
  descricao: string | null;
  tipo: 'combo' | 'creditos';
  preco_base: number;
  validade_dias: number | null;
  max_usos: number | null;
  ativo: boolean;
  data_criacao: string;
  servicos: Array<{
    id_servico: number;
    nome: string;
    preco: number;
    quantidade: number;
  }>;
};

export type Servico = {
  id_servico: number;
  nome: string;
  preco_base: number;
};

export function usePackagesData() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const pacotesRes = await apiClient.get('/pacotes');
      setPacotes(Array.isArray(pacotesRes.data) ? pacotesRes.data : []);
      const servicosRes = await apiClient.get('/servicos');
      setServicos(Array.isArray(servicosRes.data) ? servicosRes.data : []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicialização
  useState(() => { carregarDados(); });

  const criarPacote = useCallback(async (dados: any) => {
    try {
      const token = sessionStorage.getItem("token");
      const empresa = sessionStorage.getItem("empresa") || "teste";
      if (!token) throw new Error("Faça login");
      const payload = { ...dados };
      const res = await apiClient.post('/pacotes', payload, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Empresa": empresa
        }
      });
      toast.success(`Pacote "${res.data.nome}" criado com sucesso!`);
      carregarDados();
    } catch (error: any) {
      toast.error(`Erro ao criar pacote: ${error.message}`);
    }
  }, [carregarDados]);

  const editarPacote = useCallback(async (id: number, dados: any) => {
    try {
      const token = sessionStorage.getItem("token");
      const empresa = sessionStorage.getItem("empresa") || "teste";
      const res = await apiClient.put(`/pacotes/${id}`, dados, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Empresa": empresa
        }
      });
      toast.success("Pacote atualizado!");
      carregarDados();
    } catch (error: any) {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  }, [carregarDados]);

  const calcularTotal = useCallback((ids: number[]) => {
    return ids.reduce((sum, id) => {
      const s = servicos.find(x => x.id_servico === id);
      return sum + (s?.preco_base || 0);
    }, 0);
  }, [servicos]);

  return {
    pacotes,
    servicos,
    loading,
    criarPacote,
    editarPacote,
    helpers: { calcularTotal },
    reload: carregarDados
  };
}
