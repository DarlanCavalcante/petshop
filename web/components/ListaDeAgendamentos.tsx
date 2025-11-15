"use client";
import { useAgendamentosData } from "@/lib/useAgendamentosData";
import { motion } from "framer-motion";
import { Calendar, Briefcase, PawPrint, Clock, CheckCircle, XCircle } from "lucide-react";

export default function ListaDeAgendamentos() {
  const { lista, formatSelecionado, selecionado } = useAgendamentosData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Agendamentos em {formatSelecionado()} ({lista.length})
      </h2>
      <div className="space-y-3">
        {lista.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum agendamento para hoje</p>
          </div>
        ) : (
          lista.map(a => (
            <motion.div
              key={a.id_agendamento}
              whileHover={{ scale: 1.01 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {a.servico_nome || 'Serviço'}
                    </span>
                    {a.status === 'Confirmado' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Confirmado
                      </span>
                    )}
                    {a.status === 'Pendente' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        Pendente
                      </span>
                    )}
                    {a.status === 'Cancelado' && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Cancelado
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <PawPrint className="w-4 h-4" />
                      <span>{a.pet_nome || 'Pet'} - {a.cliente_nome || 'Cliente'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(a.data_hora).toLocaleString('pt-BR')}</span>
                      {a.duracao_estimada && <span>· {a.duracao_estimada}min</span>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
