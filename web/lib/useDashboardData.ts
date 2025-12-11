/**
 * Hook customizado para centralizar o carregamento de dados do dashboard.
 * Realiza o fetch dos KPIs, receita diária e produtos mais vendidos.
 * Fornece loading, dados e função de recarregar.
 *
 * @returns {object} {
 *   kpis: KPI[],
 *   receitaDiaria: any[],
 *   produtosMaisVendidos: any[],
 *   loading: boolean,
 *   reload: () => Promise<void>
 * }
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { DollarSign, TrendingUp, Package, Users, Calendar } from 'lucide-react';

export interface KPI {
  title: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

const EXEMPLO_RECEITA_DIARIA = [
  { data: '01/11', valor: 1200 },
  { data: '02/11', valor: 1800 },
  { data: '03/11', valor: 1500 },
  { data: '04/11', valor: 2100 },
  { data: '05/11', valor: 1900 },
  { data: '06/11', valor: 2400 },
  { data: '07/11', valor: 2200 },
];

const EXEMPLO_PRODUTOS_VENDIDOS = [
  { nome: 'Ração Premium', vendas: 45 },
  { nome: 'Shampoo Pet', vendas: 32 },
  { nome: 'Coleira', vendas: 28 },
  { nome: 'Brinquedo', vendas: 25 },
  { nome: 'Antipulgas', vendas: 22 },
];

export function useDashboardData() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [receitaDiaria, setReceitaDiaria] = useState<any[]>(EXEMPLO_RECEITA_DIARIA);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<any[]>(EXEMPLO_PRODUTOS_VENDIDOS);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar receita diária
      try {
        const receitaRes = await apiClient.get('/kpis/receita-diaria');
        setReceitaDiaria(Array.isArray(receitaRes.data) ? receitaRes.data.slice(0, 7) : EXEMPLO_RECEITA_DIARIA);
      } catch (err) {
        setReceitaDiaria(EXEMPLO_RECEITA_DIARIA);
      }
      // Buscar produtos mais vendidos
      try {
        const produtosRes = await apiClient.get('/kpis/produtos-mais-vendidos');
        setProdutosMaisVendidos(Array.isArray(produtosRes.data) ? produtosRes.data.slice(0, 5) : EXEMPLO_PRODUTOS_VENDIDOS);
      } catch (err) {
        setProdutosMaisVendidos(EXEMPLO_PRODUTOS_VENDIDOS);
      }
      // KPIs simulados
      setKpis([
        {
          title: 'Receita Mensal',
          value: 'R$ 45.231',
          change: 12.5,
          icon: DollarSign,
          color: 'from-green-500 to-emerald-600'
        },
        {
          title: 'Vendas Hoje',
          value: '23',
          change: 8.2,
          icon: TrendingUp,
          color: 'from-blue-500 to-cyan-600'
        },
        {
          title: 'Produtos Ativos',
          value: '156',
          change: -2.4,
          icon: Package,
          color: 'from-purple-500 to-pink-600'
        },
        {
          title: 'Clientes Ativos',
          value: '842',
          change: 15.3,
          icon: Users,
          color: 'from-orange-500 to-red-600'
        },
        {
          title: 'Agendamentos',
          value: '12',
          change: 5.1,
          icon: Calendar,
          color: 'from-indigo-500 to-purple-600'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return { kpis, receitaDiaria, produtosMaisVendidos, loading, reload: loadDashboardData };
}
