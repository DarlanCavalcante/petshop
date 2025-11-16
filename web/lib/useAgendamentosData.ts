/**
 * Hook customizado para centralizar o carregamento, manipulação e helpers da página de agendamentos.
 * Gerencia agendamentos, clientes, pets, serviços, pacotes, calendário, seleção e helpers.
 *
 * @returns {object} Todos os estados, setters e funções de CRUD necessárias para a página de agendamentos.
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

import { Agendamento, Cliente, Pet, Servico, Pacote } from '@/lib/types';

interface PacoteCliente extends Pacote {
  id_cliente_pacote: number;
  servicos?: Servico[];
}

export function useAgendamentosData() {
  const [lista, setLista] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pacotesCliente, setPacotesCliente] = useState<PacoteCliente[]>([]);
  const [idClientePacote, setIdClientePacote] = useState<number | null>(null);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [idPet, setIdPet] = useState<number | null>(null);
  const [idServico, setIdServico] = useState<number | null>(null);
  const [idFuncionario, setIdFuncionario] = useState<number | null>(null);
  const [dataHora, setDataHora] = useState<string>("");
  const [duracao, setDuracao] = useState<number>(45);
  const [obs, setObs] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const hoje = new Date();
  const [calAno, setCalAno] = useState<number>(hoje.getFullYear());
  const [calMes, setCalMes] = useState<number>(hoje.getMonth() + 1);
  const [selecionado, setSelecionado] = useState<string>(`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`);
  const [contagens, setContagens] = useState<Record<string, number>>({});

  const fetchContagens = useCallback(async (ano: number, mes: number) => {
    try {
      const res = await apiClient.get(`/agendamentos/calendario?ano=${ano}&mes=${mes}`);
      const data = res.data;
      const map: Record<string, number> = {};
      for (const row of data) {
        const d = new Date(row.dia);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        map[key] = row.total;
      }
      setContagens(map);
    } catch {}
  }, []);

  const loadAgendamentosPorData = useCallback(async (data: string) => {
    try {
      const res = await apiClient.get(`/agendamentos?data=${data}`);
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    try {
      try {
        const meRes = await apiClient.get('/auth/me');
        setIdFuncionario(meRes.data.id);
      } catch {}
      await fetchContagens(calAno, calMes);
      await loadAgendamentosPorData(selecionado);
      try {
        const clientesRes = await apiClient.get('/clientes');
        setClientes(Array.isArray(clientesRes.data) ? clientesRes.data : []);
      } catch {}
      try {
        const servicosRes = await apiClient.get('/servicos');
        setServicos(Array.isArray(servicosRes.data) ? servicosRes.data : []);
      } catch {}
      setLoading(false);
    } catch {
      toast.error('Erro ao carregar dados');
      setLoading(false);
    }
  }, [calAno, calMes, selecionado, fetchContagens, loadAgendamentosPorData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função para selecionar cliente e carregar pets/pacotes
  function onClienteChange(id: number | null) {
    setIdCliente(id);
    setIdPet(null);
    setIdClientePacote(null);
    if (id) {
      apiClient.get(`/clientes/${id}/pets`).then(res => setPets(res.data));
      apiClient.get(`/clientes/${id}/pacotes?status=ativo`).then(res => setPacotesCliente(res.data));
    } else {
      setPets([]);
      setPacotesCliente([]);
    }
  }

  // Função para selecionar serviço
  function onServicoChange(id: number | null) {
    setIdServico(id);
  }

  // Gera a grade de dias do calendário mensal
  function gerarGridDias() {
    const diasNoMes = new Date(calAno, calMes, 0).getDate();
    const primeiroDiaSemana = new Date(calAno, calMes - 1, 1).getDay();
    const grid: (number | null)[] = [];
    for (let i = 0; i < primeiroDiaSemana; i++) grid.push(null);
    for (let d = 1; d <= diasNoMes; d++) grid.push(d);
    return grid;
  }

  // Formata a data selecionada para exibição
  function formatSelecionado() {
    if (!selecionado) return "";
    const [ano, mes, dia] = selecionado.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  // Muda o mês do calendário
  function mudarMes(delta: number) {
    let novoMes = calMes + delta;
    let novoAno = calAno;
    if (novoMes < 1) {
      novoMes = 12;
      novoAno--;
    } else if (novoMes > 12) {
      novoMes = 1;
      novoAno++;
    }
    setCalMes(novoMes);
    setCalAno(novoAno);
    fetchContagens(novoAno, novoMes);
  }

  // Seleciona um dia no calendário
  function selecionarDia(dia: number) {
    const key = `${calAno}-${String(calMes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    setSelecionado(key);
    loadAgendamentosPorData(key);
  }

  return {
    lista, setLista, clientes, setClientes, pets, setPets, servicos, setServicos, pacotesCliente, setPacotesCliente,
    idClientePacote, setIdClientePacote, idCliente, setIdCliente, idPet, setIdPet, idServico, setIdServico, idFuncionario, setIdFuncionario,
    dataHora, setDataHora, duracao, setDuracao, obs, setObs, loading, setLoading,
    calAno, setCalAno, calMes, setCalMes, selecionado, setSelecionado, contagens, setContagens,
    loadData, fetchContagens, loadAgendamentosPorData,
    onClienteChange, onServicoChange, gerarGridDias, formatSelecionado, mudarMes, selecionarDia
  };
}
