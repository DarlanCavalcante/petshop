'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, ArrowRight, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast, Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { API_URL } from '@/lib/config';

interface KPI {
  title: string;
  value: string;
  change: number;
  icon: any;
  color: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

// Dados de exemplo caso a API não retorne
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

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [receitaDiaria, setReceitaDiaria] = useState<any[]>(EXEMPLO_RECEITA_DIARIA);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<any[]>(EXEMPLO_PRODUTOS_VENDIDOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const empresa = localStorage.getItem('empresa');

      if (!token || !empresa) {
        window.location.href = '/login';
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Empresa': empresa
      };

      // Buscar receita diária (não bloqueia se falhar)
      try {
        const receitaRes = await fetch(`${API_URL}/kpis/receita-diaria`, { 
          headers,
          mode: 'cors'
        });
        if (receitaRes.ok) {
          const data = await receitaRes.json();
          setReceitaDiaria(data.slice(0, 7)); // Últimos 7 dias
        }
      } catch (err) {
        console.warn('Não foi possível carregar receita diária:', err);
      }

      // Buscar produtos mais vendidos (não bloqueia se falhar)
      try {
        const produtosRes = await fetch(`${API_URL}/kpis/produtos-mais-vendidos`, { 
          headers,
          mode: 'cors'
        });
        if (produtosRes.ok) {
          const data = await produtosRes.json();
          setProdutosMaisVendidos(data.slice(0, 5));
        }
      } catch (err) {
        console.warn('Não foi possível carregar produtos mais vendidos:', err);
      }

      // KPIs simulados (você pode criar endpoints específicos)
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

      setLoading(false);
      toast.success('Dashboard carregado!');
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      console.error('Stack:', error.stack);
      toast.error('Erro de conexão com a API');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do seu negócio
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {kpis.map((kpi, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${kpi.color} rounded-xl flex items-center justify-center`}>
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(kpi.change)}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {kpi.value}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {kpi.title}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receita Diária */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Receita Diária (Últimos 7 dias)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={receitaDiaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="data_venda" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="receita_total"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#3B82F6' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Produtos Mais Vendidos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Produtos Mais Vendidos
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosMaisVendidos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="nome" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Bar dataKey="quantidade_vendida" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/venda')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Nova Venda</h3>
              <ShoppingCart className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-90">Registrar nova venda no sistema</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/agendamentos')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Novo Agendamento</h3>
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-90">Agendar serviço para cliente</p>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/produtos')}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">Cadastrar Produto</h3>
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-90">Adicionar produto ao estoque</p>
          </motion.button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
