"use client";
import { useAgendamentosData } from "@/lib/useAgendamentosData";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarioMensal() {
  const {
    calAno, calMes, contagens, selecionado,
    mudarMes, gerarGridDias, selecionarDia, formatSelecionado
  } = useAgendamentosData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Calendário {String(calMes).padStart(2,'0')}/{calAno}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mudarMes(-1)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => mudarMes(1)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium mb-2">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} className="text-gray-600 dark:text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {gerarGridDias().map((dia, idx) => {
          if (dia === null) return <div key={idx} />;
          const key = `${calAno}-${String(calMes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
          const total = contagens[key] || 0;
          const ativo = key === selecionado;
          return (
            <button
              key={idx}
              onClick={() => selecionarDia(dia)}
              className={`relative flex flex-col items-center justify-center h-16 rounded-xl border text-sm transition-all group
                ${ativo ? 'bg-blue-600 text-white border-blue-700 shadow-lg' : 'bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600'}`}
            >
              <span className="font-semibold">{dia}</span>
              <span className={`text-xs mt-1 ${ativo ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{total} agds</span>
              {ativo && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Selecionado: {formatSelecionado()} · {contagens[selecionado] || 0} agendamentos</p>
    </motion.div>
  );
}
