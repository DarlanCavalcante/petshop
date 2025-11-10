"use client";
import { useEffect, useState } from "react";

type Produto = {
  id_produto: number;
  nome: string;
  codigo_barras: string;
  descricao: string;
  preco_venda: number;
  categoria: string;
  estoque_total: number;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const empresa = localStorage.getItem("empresa") || "teste";
        const res = await fetch("http://localhost:8000/produtos", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "X-Empresa": empresa
          }
        });
        if (!res.ok) throw new Error("Falha ao buscar produtos");
        const data = await res.json();
        setProdutos(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Produtos</h1>
      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {produtos.map(p => (
          <div key={p.id_produto} className="border rounded p-4">
            <h2 className="font-medium text-lg">{p.nome}</h2>
            <p className="text-sm text-gray-600">{p.descricao}</p>
            <p className="mt-2">Preço: R$ {p.preco_venda.toFixed(2)}</p>
            <p>Estoque: {p.estoque_total}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
