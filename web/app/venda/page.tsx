"use client";
import { useEffect, useMemo, useState } from "react";

type Produto = { id_produto: number; nome: string; preco_venda: number; estoque_total: number };
type Cliente = { id_cliente: number; nome: string };

type ItemVenda = { id_produto: number; nome: string; qtd: number; preco: number };

export default function VendaPage() {
  const [empresa, setEmpresa] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [desconto, setDesconto] = useState<number>(0);
  const [idFuncionario, setIdFuncionario] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const e = localStorage.getItem("empresa") || "teste";
    setToken(t);
    setEmpresa(e);
    async function init() {
      try {
        const base = "http://127.0.0.1:8000";
        // obter id_funcionario
        const me = await fetch(`${base}/auth/me`, { headers: { "Authorization": `Bearer ${t}`, "X-Empresa": e } });
        if (me.ok) {
          const j = await me.json();
          setIdFuncionario(j.id);
        }
        // produtos
        const rp = await fetch(`${base}/produtos`, { headers: { "Authorization": `Bearer ${t}`, "X-Empresa": e } });
        if (rp.ok) setProdutos(await rp.json());
        // clientes
        const rc = await fetch(`${base}/clientes`, { headers: { "Authorization": `Bearer ${t}`, "X-Empresa": e } });
        if (rc.ok) setClientes(await rc.json());
      } catch (err: any) {
        setError(err.message);
      }
    }
    if (t) init();
  }, []);

  const total = useMemo(() => itens.reduce((acc, it) => acc + it.qtd * it.preco, 0), [itens]);
  const valorFinal = Math.max(total - desconto, 0);

  function addItem(p: Produto) {
    setItens(prev => {
      const found = prev.find(i => i.id_produto === p.id_produto);
      if (found) return prev.map(i => i.id_produto === p.id_produto ? { ...i, qtd: i.qtd + 1 } : i);
      return [...prev, { id_produto: p.id_produto, nome: p.nome, qtd: 1, preco: p.preco_venda }];
    });
  }

  function updateQtd(id_produto: number, qtd: number) {
    setItens(prev => prev.map(i => i.id_produto === id_produto ? { ...i, qtd: Math.max(1, qtd) } : i));
  }
  function updatePreco(id_produto: number, preco: number) {
    setItens(prev => prev.map(i => i.id_produto === id_produto ? { ...i, preco: Math.max(0, preco) } : i));
  }
  function removeItem(id_produto: number) {
    setItens(prev => prev.filter(i => i.id_produto !== id_produto));
  }

  async function submitVenda() {
    setMsg(""); setError("");
    try {
      if (!token || !empresa) throw new Error("Faça login primeiro");
      if (!idCliente) throw new Error("Selecione um cliente");
      if (!idFuncionario) throw new Error("Não foi possível obter id do funcionário");
      if (itens.length === 0) throw new Error("Adicione pelo menos um item");
      const payload = {
        id_cliente: idCliente,
        id_funcionario: idFuncionario,
        itens: itens.map(i => ({ id_produto: i.id_produto, qtd: i.qtd, preco: i.preco })),
        desconto: desconto || 0
      };
      const res = await fetch("http://127.0.0.1:8000/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, "X-Empresa": empresa },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const data = await res.json();
      setMsg(`Venda #${data.id_venda} registrada. Valor final R$ ${data.valor_final.toFixed(2)}`);
      setItens([]); setDesconto(0); setIdCliente(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Registrar Venda</h1>

      <div className="mb-4">
        <label className="block text-sm mb-1">Cliente</label>
        <select className="border p-2 rounded w-full" value={idCliente ?? ''} onChange={e => setIdCliente(Number(e.target.value) || null)}>
          <option value="">Selecione...</option>
          {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-medium mb-2">Produtos</h2>
          <div className="max-h-80 overflow-auto border rounded">
            {produtos.map(p => (
              <div key={p.id_produto} className="flex items-center justify-between border-b px-3 py-2">
                <div>
                  <div className="font-medium">{p.nome}</div>
                  <div className="text-sm text-gray-600">R$ {p.preco_venda.toFixed(2)} · Estoque: {p.estoque_total}</div>
                </div>
                <button className="bg-blue-600 text-white rounded px-3 py-1" onClick={() => addItem(p)}>Adicionar</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-medium mb-2">Itens da Venda</h2>
          <div className="border rounded divide-y">
            {itens.map(i => (
              <div key={i.id_produto} className="p-3 flex items-center gap-2">
                <div className="flex-1">
                  <div className="font-medium">{i.nome}</div>
                  <div className="text-sm text-gray-600">ID {i.id_produto}</div>
                </div>
                <input type="number" className="border rounded p-1 w-20" value={i.qtd} onChange={e => updateQtd(i.id_produto, Number(e.target.value))} />
                <input type="number" step="0.01" className="border rounded p-1 w-28" value={i.preco} onChange={e => updatePreco(i.id_produto, Number(e.target.value))} />
                <button className="text-red-600" onClick={() => removeItem(i.id_produto)}>Remover</button>
              </div>
            ))}
            {itens.length === 0 && <div className="p-3 text-sm text-gray-500">Nenhum item</div>}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div>Total: <strong>R$ {total.toFixed(2)}</strong></div>
            <div>
              Desconto: <input type="number" step="0.01" className="border rounded p-1 w-28" value={desconto} onChange={e => setDesconto(Number(e.target.value))} />
            </div>
            <div>Final: <strong>R$ {valorFinal.toFixed(2)}</strong></div>
          </div>

          <button className="mt-4 bg-green-600 text-white rounded px-4 py-2" onClick={submitVenda}>Registrar venda</button>
          {msg && <p className="mt-2 text-green-700">{msg}</p>}
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
