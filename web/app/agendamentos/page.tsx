"use client";

import AppLayout from "@/components/AppLayout";
import { Toaster } from "react-hot-toast";
import FormularioDeAgendamento from "@/components/FormularioDeAgendamento";
import CalendarioMensal from "@/components/CalendarioMensal";
import ListaDeAgendamentos from "@/components/ListaDeAgendamentos";

export default function Page() {
  return (
    <AppLayout>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <FormularioDeAgendamento />
        <CalendarioMensal />
        <ListaDeAgendamentos />
      </div>
    </AppLayout>
  );
}
