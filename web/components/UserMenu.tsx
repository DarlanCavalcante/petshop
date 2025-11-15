"use client";

import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { User, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';

/**
 * Menu de usuário global.
 * Exibe avatar, menu suspenso e botões de login/logout conforme autenticação.
 * Usa o hook useAuth para estado de autenticação e logout.
 *
 * @returns {JSX.Element} O menu de usuário renderizado.
 */
export default function UserMenu() {

  const { isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  /**
   * Renderiza menu suspenso para usuário autenticado.
   * @returns {JSX.Element}
   */
  if (isAuthenticated) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition shadow-sm"
          onClick={() => setOpen((v) => !v)}
        >
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-800">Minha Conta</span>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg py-2 z-50 animate-fade-in">
            <Link href="/perfil" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition text-gray-700" onClick={() => setOpen(false)}>
              <User className="w-4 h-4" /> Perfil
            </Link>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 transition"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        )}
      </div>
    );
  }
  /**
   * Renderiza botões de login/criar conta para visitante.
   * @returns {JSX.Element}
   */
  return (
    <div className="flex gap-2">
      <Link href="/login" className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm">
        <LogIn className="w-4 h-4" /> Login
      </Link>
      <Link href="/criar-conta" className="flex items-center gap-1 px-3 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition shadow-sm">
        <UserPlus className="w-4 h-4" /> Criar Conta
      </Link>
    </div>
  );
}
