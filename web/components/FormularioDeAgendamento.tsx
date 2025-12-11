"use client";
import { useAgendamentosData } from "@/lib/useAgendamentosData";
import { useAuth } from "@/lib/useAuth";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, User, PawPrint, Briefcase, Calendar, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FormularioDeAgendamento() {
  const {
    clientes, pets, servicos, pacotesCliente,
    idClientePacote, setIdClientePacote, idCliente, idPet, idServico, idFuncionario,
    setIdCliente, setIdPet, setIdServico,
    dataHora, setDataHora, duracao, setDuracao, obs, setObs,
    onClienteChange, onServicoChange, loadData, setPets
  } = useAgendamentosData();
  const { token, empresa } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  const criarAgendamento = async () => {
    if (!idCliente || !idPet || !idServico || !idFuncionario || !dataHora) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      const payload: any = {
        id_pet: idPet,
        id_servico: idServico,
        id_funcionario: idFuncionario,
        data_hora: dataHora.replace("T", " ") + ":00",
        duracao_estimada: duracao,
        observacoes: obs
      };
      if (idClientePacote) payload.id_cliente_pacote = idClientePacote;

      const res = await fetch(`${API_URL}/agendamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Empresa": empresa || ""
        },
        body: JSON.stringify(payload),
        mode: "cors"
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();
      toast.success(`Agendamento #${result.id_agendamento} criado com sucesso!`);
      setIdCliente(null);
      setIdPet(null);
      setIdServico(null);
      setDataHora("");
      setDuracao(45);
      setObs("");
      setPets([]);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar agendamento");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5" />
        Novo Agendamento
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Cliente *
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            value={idCliente ?? ''}
            onChange={e => onClienteChange(Number(e.target.value) || null)}
          >
            <option value="">Selecione um cliente...</option>
            {clientes.map(c => (
              <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <PawPrint className="w-4 h-4 inline mr-1" />
            Pet *
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            value={idPet ?? ''}
            onChange={e => setIdPet(Number(e.target.value) || null)}
            disabled={!idCliente}
          >
            <option value="">Selecione um pet...</option>
            {pets.map(p => (
              <option key={p.id_pet} value={p.id_pet}>{p.nome} ({p.especie})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Briefcase className="w-4 h-4 inline mr-1" />
            Serviço *
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            value={idServico ?? ''}
            onChange={e => onServicoChange(Number(e.target.value) || null)}
          >
            <option value="">Selecione um serviço...</option>
            {(
              idClientePacote
                ? (pacotesCliente.find(p => p.id_cliente_pacote === idClientePacote)?.servicos ?? [])
                : servicos
            ).map((s: any) => (
              <option key={s.id_servico} value={s.id_servico}>
                {s.nome} - R$ {Number(s.preco).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        {pacotesCliente.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pacote (opcional)</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700"
              value={idClientePacote ?? ''}
              onChange={e => setIdClientePacote(Number(e.target.value) || null)}
            >
              <option value="">Sem pacote...</option>
              {pacotesCliente.map((p: any) => (
                <option key={p.id_cliente_pacote} value={p.id_cliente_pacote}>
                  {p.pacote_nome} {p.pacote_tipo === 'creditos' ? `(Restantes: ${p.usos_restantes})` : '(Combo)'}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data e Hora *
          </label>
          <input
            type="datetime-local"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            value={dataHora}
            onChange={e => setDataHora(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Duração (min)
          </label>
          <input
            type="number"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            value={duracao}
            onChange={e => setDuracao(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações
          </label>
          <input
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Observações adicionais..."
          />
        </div>
      </div>
      <button
        onClick={criarAgendamento}
        className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Criar Agendamento
      </button>
    </motion.div>
  );
}
