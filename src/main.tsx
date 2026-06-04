import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, RequireAuth } from "@/components/AuthProvider";
import { SistemasProvider } from "@/lib/sistemas";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import SetorPage from "@/pages/SetorPage";
import ProcedimentoPage from "@/pages/ProcedimentoPage";
import NovoProcedimento from "@/pages/NovoProcedimento";
import EditarProcedimento from "@/pages/EditarProcedimento";
import Permissoes from "@/pages/Permissoes";
import Treinamentos from "@/pages/Treinamentos";
import AdminSistemas from "@/pages/AdminSistemas";
import "@/index.css";

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <SistemasProvider>
            <Toaster theme="dark" position="top-right" richColors />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/setor/:setor" element={<SetorPage />} />
                <Route path="/setor/:setor/:subpasta" element={<SetorPage />} />
                <Route path="/procedimento/:id" element={<ProcedimentoPage />} />
                <Route path="/novo" element={<NovoProcedimento />} />
                <Route path="/procedimento/:id/editar" element={<EditarProcedimento />} />
                <Route path="/permissoes" element={<Permissoes />} />
                <Route path="/treinamentos" element={<Treinamentos />} />
                <Route path="/admin/sistemas" element={<AdminSistemas />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SistemasProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
