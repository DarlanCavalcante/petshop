"use client";

import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Calendar, Clock, User, PawPrint, Briefcase, Plus, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { API_URL } from '@/lib/config';

type Agendamento = { 
  id_agendamento: number; 
  data_hora: string; 
  status: string; 
  pet_nome?: string; 
  cliente_nome?: string; 
  servico_nome?: string; 
  funcionario_nome?: string;
  duracao_estimada?: number;
};

export default function AgendamentosPage() {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pacotesCliente, setPacotesCliente] = useState<any[]>([]);
  const [idClientePacote, setIdClientePacote] = useState<number | null>(null);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [idPet, setIdPet] = useState<number | null>(null);
  const [idServico, setIdServico] = useState<number | null>(null);
  const [idFuncionario, setIdFuncionario] = useState<number | null>(null);
  const [dataHora, setDataHora] = useState<string>("");
  const [duracao, setDuracao] = useState<number>(45);
  const [obs, setObs] = useState<string>("");
  const [loading, setLoading] = useState(true);
  // Estados do calendário
  const hoje = new Date();
  const [calAno, setCalAno] = useState<number>(hoje.getFullYear());
  const [calMes, setCalMes] = useState<number>(hoje.getMonth() + 1); // 1-12
  const [selecionado, setSelecionado] = useState<string>(`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`);
  const [contagens, setContagens] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const empresa = localStorage.getItem("empresa") || "teste";
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const headers = {
        "Authorization": `Bearer ${token}`,
        "X-Empresa": empresa
      };

      // Obter funcionário logado
      const meRes = await fetch(`${API_URL}/auth/me`, { headers, mode: 'cors' });
      if (meRes.ok) {
        const userData = await meRes.json();
        setIdFuncionario(userData.id);
      }

      // Carregar contagens do mês e agendamentos do dia selecionado inicial
      await fetchContagens(calAno, calMes, headers);
      await loadAgendamentosPorData(selecionado, headers);

      // Carregar clientes
      const clientesRes = await fetch(`${API_URL}/clientes`, { headers, mode: 'cors' });
      if (clientesRes.ok) {
        setClientes(await clientesRes.json());
      }

      // Carregar serviços
      const servicosRes = await fetch(`${API_URL}/servicos`, { headers, mode: 'cors' });
      if (servicosRes.ok) {
        setServicos(await servicosRes.json());
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setLoading(false);
    }
  };

  const fetchContagens = async (ano: number, mes: number, headers?: any) => {
    try {
      const token = localStorage.getItem("token");
      const empresa = localStorage.getItem("empresa") || "teste";
      const h = headers || { "Authorization": `Bearer ${token}`, "X-Empresa": empresa };
      const res = await fetch(`${API_URL}/agendamentos/calendario?ano=${ano}&mes=${mes}`, { headers: h, mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, number> = {};
        for (const row of data) {
          const d = new Date(row.dia);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          map[key] = row.total;
        }
        setContagens(map);
      }
    } catch {}
  };

  const loadAgendamentosPorData = async (data: string, headers?: any) => {
    const token = localStorage.getItem("token");
    const empresa = localStorage.getItem("empresa") || "teste";
    const h = headers || { "Authorization": `Bearer ${token}`, "X-Empresa": empresa };
    const res = await fetch(`${API_URL}/agendamentos?data=${data}`, { headers: h, mode: 'cors' });
    if (res.ok) setLista(await res.json());
  };

  const mudarMes = async (delta: number) => {
    let ano = calAno;
    let mes = calMes + delta;
    if (mes < 1) { mes = 12; ano -= 1; }
    if (mes > 12) { mes = 1; ano += 1; }
    setCalAno(ano);
    setCalMes(mes);
    await fetchContagens(ano, mes);
  };

  const selecionarDia = async (dia: number) => {
    const key = `${calAno}-${String(calMes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
    setSelecionado(key);
    setDataHora(`${key}T09:00`); // horário padrão
    await loadAgendamentosPorData(key);
  };

  const diasDoMes = () => {
    const total = new Date(calAno, calMes, 0).getDate(); // calMes é 1-12, JS aceita mês-1? Aqui: new Date(ano, mes, 0) => último dia do mês anterior; melhor usar (calMes,0) para obter último dia do mês atual? Ajuste: calMes index 1-12. new Date(calAno, calMes, 0) retorna último dia do mês calMes (porque mês 1 = fevereiro). Corrigir: usar (calMes, 0) com calMes baseado em 1-12 para obter último dia correto.
    const lastDay = new Date(calAno, calMes, 0).getDate();
    return lastDay;
  };

  const gerarGridDias = () => {
    const primeiroDiaSemana = new Date(calAno, calMes - 1, 1).getDay(); // 0=domingo
    const totalDias = new Date(calAno, calMes, 0).getDate();
    const cells: (number | null)[] = [];
    // Preenchimento inicial em branco
    for (let i = 0; i < primeiroDiaSemana; i++) cells.push(null);
    for (let d = 1; d <= totalDias; d++) cells.push(d);
    return cells;
  };

  const formatSelecionado = () => {
    const [y,m,d] = selecionado.split('-');
    return `${d}/${m}/${y}`;
  };

  const onServicoChange = (sid: number | null) => {
    setIdServico(sid);
    if (!sid) return;

    const servico = servicos.find(s => s.id_servico === sid);
    if (servico?.duracao_padrao) {
      setDuracao(servico.duracao_padrao);
    }
  };

  const onClienteChange = async (cid: number | null) => {
    setIdCliente(cid);
    setIdPet(null);
    setPets([]);
    setPacotesCliente([]);
    setIdClientePacote(null);
    
    if (!cid) return;

    try {
      const token = localStorage.getItem("token");
      const empresa = localStorage.getItem("empresa") || "teste";
      
      const petsRes = await fetch(`${API_URL}/clientes/${cid}/pets`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Empresa": empresa
        },
        mode: 'cors'
      });
      
      if (petsRes.ok) {
        setPets(await petsRes.json());
      }

      // Carregar pacotes do cliente
      const pacotesRes = await fetch(`${API_URL}/clientes/${cid}/pacotes?status=ativo`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Empresa": empresa
        },
        mode: 'cors'
      });
      if (pacotesRes.ok) {
        setPacotesCliente(await pacotesRes.json());
      }
    } catch (error) {
      console.error('Erro ao carregar pets:', error);
    }
  };

  const criarAgendamento = async () => {
    try {
      const token = localStorage.getItem("token");
      const empresa = localStorage.getItem("empresa") || "teste";
      
      if (!token) throw new Error("Faça login");
      if (!idCliente || !idPet || !idServico || !idFuncionario || !dataHora) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

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
          "X-Empresa": empresa
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!res.ok) throw new Error(await res.text());
      
      const result = await res.json();
      toast.success(`Agendamento #${result.id_agendamento} criado com sucesso!`);
      
      // Limpar formulário
      setIdCliente(null);
      setIdPet(null);
      setIdServico(null);
      setDataHora("");
      setDuracao(45);
      setObs("");
      setPets([]);
      
      // Recarregar lista
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar agendamento');
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
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agendamentos</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie os agendamentos do dia</p>
        </motion.div>

        {/* Formulário de Criação */}
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
                {(idClientePacote ? pacotesCliente.find(p => p.id_cliente_pacote === idClientePacote)?.servicos || [] : servicos).map((s: any) => (
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

        {/* Calendário Mensal */}
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

        {/* Lista de Agendamentos de Hoje */}
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
      </div>
    </AppLayout>
  );
}
