'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDashboardData } from '@/lib/useDashboardData';




/**
 * Página principal do dashboard.
 * Protegida por autenticação.
 *
 * @returns {JSX.Element} Página do dashboard protegida.
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}


/**
 * Conteúdo principal do dashboard.
 * Busca dados de KPIs, gráficos e ações rápidas.
 *
 * @returns {JSX.Element} Conteúdo do dashboard.
 */
function DashboardContent() {
  const router = useRouter();
  const { kpis, receitaDiaria, produtosMaisVendidos, loading } = useDashboardData();

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
          className="flex flex-wrap gap-4 justify-center md:justify-start"
        >
          <button
            onClick={() => router.push('/venda')}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Nova Venda"
          >
            <ShoppingCart className="w-6 h-6" /> Nova Venda
          </button>
          <button
            onClick={() => router.push('/agendamentos')}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-green-400"
            aria-label="Novo Agendamento"
          >
            <Calendar className="w-6 h-6" /> Novo Agendamento
          </button>
          <button
            onClick={() => router.push('/produtos')}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label="Cadastrar Produto"
          >
            <Package className="w-6 h-6" /> Cadastrar Produto
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
