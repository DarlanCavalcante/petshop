"use client";
import { useState } from "react";

export default function LoginPage() {
  const [empresa, setEmpresa] = useState("teste");
  const [login, setLogin] = useState("admin");
  const [senha, setSenha] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new URLSearchParams();
      form.append("username", login);
      form.append("password", senha);

      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Empresa": empresa
        },
        body: form.toString()
      });
      if (!res.ok) {
        throw new Error("Falha no login");
      }
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("empresa", empresa);
      setToken(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login Petshop (Empresa: {empresa})</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="text-sm">Empresa (código)</span>
          <input value={empresa} onChange={e => setEmpresa(e.target.value)} className="border p-2 rounded" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm">Usuário</span>
            <input value={login} onChange={e => setLogin(e.target.value)} className="border p-2 rounded" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm">Senha</span>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="border p-2 rounded" />
        </label>
        <button disabled={loading} className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 disabled:opacity-50">{loading ? "Entrando..." : "Entrar"}</button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {token && <p className="text-green-700 text-sm">Login ok! Vá para <a className="underline" href="/produtos">/produtos</a></p>}
      </form>
    </div>
  );
}
