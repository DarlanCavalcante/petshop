import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

/**
 * Hook customizado para centralizar o carregamento, busca, filtros e helpers dos clientes.
 * Gerencia estado, busca, helpers e ações de CRUD para clientes e pacotes do cliente.
 *
 * @returns {object} Estados, setters e handlers para a página de Clientes.
 */
export function useClientesData() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [pacoteId, setPacoteId] = useState<number | null>(null);
  const [valorPago, setValorPago] = useState<string>('');
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
  });

  const loadClientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/clientes');
      setClientes(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const buscarPacotesCliente = useCallback(async (idCliente: number) => {
    try {
      const token = sessionStorage.getItem('token');
      const empresa = sessionStorage.getItem('empresa') || 'teste';
      const res = await apiClient.get(`/clientes/${idCliente}/pacotes?status=ativo`, {
        headers: { 'Authorization': `Bearer ${token}`, 'X-Empresa': empresa }
      });
      setPacotes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setPacotes([]);
    }
  }, []);

  // Filtros e helpers
  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm) ||
    c.telefone?.includes(searchTerm)
  );

  return {
    clientes, setClientes, loading, setLoading, searchTerm, setSearchTerm,
    showModal, setShowModal, selectedCliente, setSelectedCliente, showViewModal, setShowViewModal,
    showBuyModal, setShowBuyModal, pacotes, setPacotes, pacoteId, setPacoteId, valorPago, setValorPago, formData, setFormData,
    loadClientes, buscarPacotesCliente, clientesFiltrados
  };
}
