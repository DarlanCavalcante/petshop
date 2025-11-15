"use client";
import { useKpisData } from '@/lib/useKpisData';

  const { vendasPorFuncionario, produtosMaisVendidos, receitaDiaria, loading, error } = useKpisData();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">KPIs</h1>
      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <section className="mb-8">
        <h2 className="font-medium mb-2">Vendas por Funcionário</h2>
        <div className="border rounded divide-y">
          {vendasPorFuncionario.map((v,i) => (
            <div key={i} className="p-3 flex justify-between">
              <span>{v.funcionario_nome || v.nome || 'Funcionário'}</span>
              <span className="font-medium">R$ {(v.total_vendas || v.total || 0).toFixed(2)}</span>
            </div>
          ))}
          {vendasPorFuncionario.length === 0 && <div className="p-3 text-sm text-gray-500">Sem dados</div>}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-medium mb-2">Produtos Mais Vendidos</h2>
        <div className="border rounded divide-y">
          {produtosMaisVendidos.map((p,i) => (
            <div key={i} className="p-3 flex justify-between">
              <span>{p.produto_nome || p.nome || 'Produto'}</span>
              <span className="font-medium">Qtd: {p.total_vendido || p.qtd || 0}</span>
            </div>
          ))}
          {produtosMaisVendidos.length === 0 && <div className="p-3 text-sm text-gray-500">Sem dados</div>}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-medium mb-2">Receita Diária</h2>
        <div className="border rounded divide-y">
          {receitaDiaria.map((r,i) => (
            <div key={i} className="p-3 flex justify-between">
              <span>{r.dia || r.data || 'Dia'}</span>
              <span className="font-medium">R$ {(r.receita || r.total || 0).toFixed(2)}</span>
            </div>
          ))}
          {receitaDiaria.length === 0 && <div className="p-3 text-sm text-gray-500">Sem dados</div>}
        </div>
      </section>

    </div>
  );
}
