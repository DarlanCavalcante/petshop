/**
 * Hook customizado para centralizar o carregamento dos dados de KPIs.
 * Realiza o fetch de vendas por funcionário, produtos mais vendidos e receita diária.
 * Fornece loading, erro e função de recarregar.
 *
 * @returns {object} {
 *   vendasPorFuncionario: any[],
 *   produtosMaisVendidos: any[],
 *   receitaDiaria: any[],
 *   loading: boolean,
 *   error: string,
 *   reload: () => Promise<void>
 * }
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';

export function useKpisData() {
  const [vendasPorFuncionario, setVendasPorFuncionario] = useState<any[]>([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<any[]>([]);
  const [receitaDiaria, setReceitaDiaria] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const v1 = await apiClient.get('/kpis/vendas-por-funcionario');
      setVendasPorFuncionario(Array.isArray(v1.data) ? v1.data : []);
      const v2 = await apiClient.get('/kpis/produtos-mais-vendidos');
      setProdutosMaisVendidos(Array.isArray(v2.data) ? v2.data : []);
      const v3 = await apiClient.get('/kpis/receita-diaria');
      setReceitaDiaria(Array.isArray(v3.data) ? v3.data : []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar KPIs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { vendasPorFuncionario, produtosMaisVendidos, receitaDiaria, loading, error, reload: load };
}
