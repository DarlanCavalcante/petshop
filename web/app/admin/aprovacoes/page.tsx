"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";
import AppLayout from "@/components/AppLayout";

interface PendingCompany {
  id: number;
  nome: string;
  email_admin: string;
  criado_em: string;
}

export default function AdminAprovacoesPage() {
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/pending-companies") as { data: PendingCompany[] };
      setPendingCompanies(response.data || []);
    } catch {
      toast.error("Erro ao buscar empresas pendentes");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/api/admin/approve-company/${id}`);
      toast.success("Empresa aprovada com sucesso!");
      fetchPendingCompanies();
    } catch {
      toast.error("Erro ao aprovar empresa");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/api/admin/reject-company/${id}`);
      toast.success("Empresa rejeitada com sucesso!");
      fetchPendingCompanies();
    } catch {
      toast.error("Erro ao rejeitar empresa");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Aprovação de Empresas</h1>
        {loading ? (
          <div>Carregando...</div>
        ) : pendingCompanies.length === 0 ? (
          <div className="text-gray-500">Nenhuma empresa pendente de aprovação.</div>
        ) : (
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Nome</th>
                <th className="py-2 px-4 border-b">Email do Admin</th>
                <th className="py-2 px-4 border-b">Data de Cadastro</th>
                <th className="py-2 px-4 border-b">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingCompanies.map((empresa) => (
                <tr key={empresa.id}>
                  <td className="py-2 px-4 border-b">{empresa.nome}</td>
                  <td className="py-2 px-4 border-b">{empresa.email_admin}</td>
                  <td className="py-2 px-4 border-b">{new Date(empresa.criado_em).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b flex gap-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      onClick={() => handleApprove(empresa.id)}
                    >
                      Aprovar
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      onClick={() => handleReject(empresa.id)}
                    >
                      Rejeitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
