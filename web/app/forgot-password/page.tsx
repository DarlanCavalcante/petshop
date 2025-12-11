'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success('E-mail enviado com sucesso!');
      } else {
        toast.error(data.detail || 'Erro ao enviar e-mail');
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  E-mail Enviado!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Não recebeu o e-mail? Verifique sua pasta de spam ou{' '}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    tente novamente
                  </button>
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-8">
            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg"
              >
                <PawPrint className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Esqueci minha senha
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                Digite seu e-mail para receber instruções de reset
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full py-3 px-6 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    Enviar instruções
                    <Mail className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Back to Login */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}