'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, User, Lock, Building2, ArrowRight } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { authAPI, APIError } from '@/lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [empresa, setEmpresa] = useState('teste');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authAPI.login(username, password, empresa);
      
      // Usar sessionStorage (mais seguro que localStorage)
      // Dados são apagados ao fechar o navegador
      sessionStorage.setItem('token', data.access_token);
      sessionStorage.setItem('empresa', empresa);
      
      toast.success('Login realizado com sucesso!');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err: any) {
      if (err instanceof APIError) {
        toast.error(err.message);
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
              rotate: [360, 180, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full relative"
        >
          {/* Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-8">
            {/* Logo and Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg"
              >
                <PawPrint className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bem-vindo!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Faça login para continuar
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Empresa */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Empresa
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="teste">Empresa Teste</option>
                    <option value="empresa_a">Empresa A</option>
                    <option value="empresa_b">Empresa B</option>
                  </select>
                </div>
              </motion.div>

              {/* Username */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className={`
                  w-full py-3 px-6 rounded-xl font-medium text-white
                  bg-gradient-to-r from-blue-600 to-purple-600
                  hover:from-blue-700 hover:to-purple-700
                  shadow-lg hover:shadow-xl
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Demo Credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
                Credenciais de demonstração:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-xs font-mono text-center space-y-1">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-bold">Usuário:</span> admin
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-bold">Senha:</span> admin
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-bold">Empresa:</span> teste
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
