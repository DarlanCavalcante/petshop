/**
 * Hook customizado para centralizar o carregamento, manipulação e helpers da página de vendas.
 * Gerencia produtos, clientes, itens da venda, descontos, busca, helpers e ações de CRUD.
 *
 * @returns {object} {
 *   produtos, clientes, selectedCliente, itens, desconto, idFuncionario,
 *   searchCliente, setSearchCliente, searchProduto, setSearchProduto,
 *   showClienteModal, setShowClienteModal, showProdutoModal, setShowProdutoModal,
 *   showNovoClienteModal, setShowNovoClienteModal, novoCliente, setNovoCliente,
 *   filteredClientes, filteredProdutos, total, valorFinal,
 *   addItem, updateQtd, updatePreco, removeItem, handleCreateCliente, setSelectedCliente
 * }
 */
import { useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

export function useSalesData() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [desconto, setDesconto] = useState<number>(0);
  const [idFuncionario, setIdFuncionario] = useState<number | null>(null);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchProduto, setSearchProduto] = useState('');
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: '', cpf: '', telefone: '', email: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      try {
        const meRes = await apiClient.get('/auth/me');
        setIdFuncionario(meRes.data.id);
      } catch {}
      try {
        const produtosRes = await apiClient.get('/produtos');
        setProdutos(Array.isArray(produtosRes.data) ? produtosRes.data : []);
      } catch {}
      try {
        const clientesRes = await apiClient.get('/clientes');
        setClientes(Array.isArray(clientesRes.data) ? clientesRes.data : []);
      } catch {}
    } catch {}
  };

  const filteredClientes = useMemo(() =>
    clientes.filter((c: any) => c.nome.toLowerCase().includes(searchCliente.toLowerCase())),
    [clientes, searchCliente]
  );

  const filteredProdutos = useMemo(() =>
    produtos.filter((p: any) => p.nome.toLowerCase().includes(searchProduto.toLowerCase()) && p.estoque_total > 0),
    [produtos, searchProduto]
  );

  const total = useMemo(() => itens.reduce((acc, item) => acc + item.qtd * item.preco, 0), [itens]);
  const valorFinal = Math.max(total - desconto, 0);

  const addItem = (produto: any) => {
    const existing = itens.find((i: any) => i.id_produto === produto.id_produto);
    if (existing) {
      if (existing.qtd + 1 > produto.estoque_total) {
        toast.error('Estoque insuficiente');
        return;
      }
      setItens(itens.map((i: any) =>
        i.id_produto === produto.id_produto
          ? { ...i, qtd: i.qtd + 1 }
          : i
      ));
    } else {
      setItens([...itens, {
        id_produto: produto.id_produto,
        nome: produto.nome,
        qtd: 1,
        preco: Number(produto.preco_venda)
      }]);
    }
    toast.success(`${produto.nome} adicionado`);
  };

  const updateQtd = (id_produto: number, qtd: number) => {
    const produto = produtos.find((p: any) => p.id_produto === id_produto);
    if (produto && qtd > produto.estoque_total) {
      toast.error('Quantidade maior que estoque');
      return;
    }
    setItens(itens.map((i: any) =>
      i.id_produto === id_produto ? { ...i, qtd: Math.max(1, qtd) } : i
    ));
  };

  const updatePreco = (id_produto: number, preco: number) => {
    setItens(itens.map((i: any) =>
      i.id_produto === id_produto ? { ...i, preco: Math.max(0, preco) } : i
    ));
  };

  const removeItem = (id_produto: number) => {
    setItens(itens.filter((i: any) => i.id_produto !== id_produto));
    toast.success('Item removido');
  };

  const handleCreateCliente = async (novoCliente: any) => {
    try {
      const token = sessionStorage.getItem('token');
      const empresa = sessionStorage.getItem('empresa') || 'teste';
      await apiClient.post('/clientes', novoCliente, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Empresa': empresa,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Cliente criado!');
      setShowNovoClienteModal(false);
      loadData();
    } catch (error: any) {
      toast.error('Erro ao criar cliente');
    }
  };

  return {
    produtos, clientes, selectedCliente, setSelectedCliente, itens, setItens, desconto, setDesconto, idFuncionario,
    searchCliente, setSearchCliente, searchProduto, setSearchProduto,
    showClienteModal, setShowClienteModal, showProdutoModal, setShowProdutoModal,
    showNovoClienteModal, setShowNovoClienteModal, novoCliente, setNovoCliente,
    filteredClientes, filteredProdutos, total, valorFinal,
    addItem, updateQtd, updatePreco, removeItem, handleCreateCliente
  };
}
