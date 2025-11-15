import { motion } from 'framer-motion';
import { Clock, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ContaPendentePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full"
      >
        <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Conta Aguardando Aprovação</h1>
        <p className="text-gray-600 mb-6">
          Sua solicitação foi recebida com sucesso! Estamos analisando os dados e em breve você receberá um email com o resultado.
        </p>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <Mail className="w-5 h-5" />
            <span className="font-medium">O que acontece agora?</span>
          </div>
          <ul className="text-sm text-orange-600 text-left space-y-1">
            <li>• Nossa equipe revisará os dados fornecidos</li>
            <li>• Você receberá um email de confirmação</li>
            <li>• Após aprovação, poderá fazer login no sistema</li>
            <li>• O processo geralmente leva 1-2 dias úteis</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>

          <p className="text-sm text-gray-500">
            Dúvidas? Entre em contato conosco pelo email suporte@petshop.com
          </p>
        </div>
      </motion.div>
    </div>
  );
}