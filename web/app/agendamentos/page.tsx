"use client";
import { useEffect, useState } from "react";

type Agendamento = { id_agendamento: number; data_hora: string; status: string; pet_nome?: string; cliente_nome?: string; servico_nome?: string; funcionario_nome?: string };

export default function AgendamentosPage() {
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [lista, setLista] = useState<Agendamento[]>([]);

  // form
  const [clientes, setClientes] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [idPet, setIdPet] = useState<number | null>(null);
  const [idServico, setIdServico] = useState<number | null>(null);
  const [idFuncionario, setIdFuncionario] = useState<number | null>(null);
  const [dataHora, setDataHora] = useState<string>("");
  const [duracao, setDuracao] = useState<number>(45);
  const [obs, setObs] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const e = localStorage.getItem("empresa") || "teste";
    setToken(t); setEmpresa(e);
    async function load() {
      try {
        const base = "http://127.0.0.1:8000";
        // me
        const me = await fetch(`${base}/auth/me`, { headers: { "Authorization": `Bearer ${t}`, "X-Empresa": e }});
        if (me.ok) { const jj = await me.json(); setIdFuncionario(jj.id); }
        // hoje
        const rh = await fetch(`${base}/agendamentos/hoje`, { headers: { "Authorization": `Bearer ${t}`, "X-Empresa": e }});
        if (rh.ok) setLista(await rh.json());
        // clientes + serviços
        const rc = await fetch(`${base}/clientes`, { headers: { "Authorization": `Bearer ${t}`, "X-Empresa": e }});
        if (rc.ok) setClientes(await rc.json());
        const rs = await fetch(`${base}/servicos`, { headers: { "Authorization": `Bearer ${t}`, "X-Empresa": e }});
        if (rs.ok) setServicos(await rs.json());
      } catch (err: any) { setError(err.message); }
    }
    if (t) load();
  }, []);

  async function onClienteChange(cid: number | null) {
    setIdCliente(cid);
    setIdPet(null);
    if (!token || !empresa) return;
    const base = "http://127.0.0.1:8000";
    if (!cid) { setPets([]); return; }
    const rp = await fetch(`${base}/clientes/${cid}/pets`, { headers: { "Authorization": `Bearer ${token}`, "X-Empresa": empresa }});
    if (rp.ok) setPets(await rp.json());
  }

  async function criarAgendamento() {
    setMsg(""); setError("");
    try {
      if (!token || !empresa) throw new Error("Faça login");
      if (!idCliente || !idPet || !idServico || !idFuncionario || !dataHora) throw new Error("Preencha os campos");
      const payload = {
        id_pet: idPet,
        id_servico: idServico,
        id_funcionario: idFuncionario,
        data_hora: dataHora.replace("T", " ")+":00",
        duracao_estimada: duracao,
        observacoes: obs
      };
      const res = await fetch("http://127.0.0.1:8000/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "X-Empresa": empresa },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setMsg(`Agendamento #${j.id_agendamento} criado`);
      // refresh lista de hoje
      const rh = await fetch(`http://127.0.0.1:8000/agendamentos/hoje`, { headers: { "Authorization": `Bearer ${token}`, "X-Empresa": empresa }});
      if (rh.ok) setLista(await rh.json());
    } catch (err: any) { setError(err.message); }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Agendamentos</h1>

      <h2 className="font-medium mb-2">Criar</h2>
      <div className="grid md:grid-cols-2 gap-4 border rounded p-4 mb-8">
        <div>
          <label className="block text-sm">Cliente</label>
          <select className="border p-2 rounded w-full" value={idCliente ?? ''} onChange={e => onClienteChange(Number(e.target.value) || null)}>
            <option value="">Selecione...</option>
            {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Pet</label>
          <select className="border p-2 rounded w-full" value={idPet ?? ''} onChange={e => setIdPet(Number(e.target.value) || null)}>
            <option value="">Selecione...</option>
            {pets.map(p => <option key={p.id_pet} value={p.id_pet}>{p.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Serviço</label>
          <select className="border p-2 rounded w-full" value={idServico ?? ''} onChange={e => setIdServico(Number(e.target.value) || null)}>
            <option value="">Selecione...</option>
            {servicos.map(s => <option key={s.id_servico} value={s.id_servico}>{s.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm">Data e hora</label>
          <input type="datetime-local" className="border p-2 rounded w-full" value={dataHora} onChange={e => setDataHora(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Duração (min)</label>
          <input type="number" className="border p-2 rounded w-full" value={duracao} onChange={e => setDuracao(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm">Observações</label>
          <input className="border p-2 rounded w-full" value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <button className="bg-blue-600 text-white rounded px-4 py-2" onClick={criarAgendamento}>Criar agendamento</button>
          {msg && <p className="mt-2 text-green-700">{msg}</p>}
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>
      </div>

      <h2 className="font-medium mb-2">Hoje</h2>
      <div className="border rounded divide-y">
        {lista.map(a => (
          <div key={a.id_agendamento} className="p-3">
            <div className="font-medium">{a.servico_nome || 'Serviço'} • {a.pet_nome || 'Pet'} • {a.cliente_nome || ''}</div>
            <div className="text-sm text-gray-600">{new Date(a.data_hora).toLocaleString()} — {a.status}</div>
          </div>
        ))}
        {lista.length === 0 && <div className="p-3 text-sm text-gray-500">Sem agendamentos hoje</div>}
      </div>
    </div>
  );
}
