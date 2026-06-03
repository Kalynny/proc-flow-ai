import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { SETORES, cn } from "@/lib/utils";
import { Truck, LayoutDashboard, FolderTree, PlusCircle, LogOut, Sparkles } from "lucide-react";

export default function AppLayout() {
  const { signOut, user, role } = useAuth();
  const nav = useNavigate();
  const canEdit = role === "admin" || role === "editor";

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border/60 bg-card/40 backdrop-blur-xl flex flex-col">
        <div className="p-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/15 grid place-items-center">
              <Truck className="size-5 text-primary" />
            </div>
            <div>
              <div className="font-bold leading-tight">Portal de Conhecimento</div>
              <div className="text-xs text-muted-foreground">Operacional IA</div>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard className="size-4" />} label="Dashboard" end />
          {canEdit && <NavItem to="/novo" icon={<Sparkles className="size-4" />} label="Novo c/ IA" />}
          <div className="pt-4 px-2 text-[11px] uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
            <FolderTree className="size-3" /> Sistemas
          </div>
          {(() => {
            const SISTEMAS: { nome: string; setores: string[] }[] = [
              { nome: "GW-WEBTRANS", setores: ["Faturamento", "Financeiro", "Operacional"] },
              { nome: "GW-FROTA", setores: [] },
              { nome: "GW-MOBILE", setores: [] },
              { nome: "GW-LOGIS", setores: [] },
              { nome: "A52", setores: [] },
              { nome: "NGO", setores: [] },
              { nome: "SOLIDES", setores: [] },
              { nome: "BEE VALE", setores: [] },
              { nome: "PROLOG", setores: [] },
            ];
            const usados = new Set(SISTEMAS.flatMap((s) => s.setores));
            const outros = SETORES.filter((s) => !usados.has(s));
            return (
              <>
                {SISTEMAS.map((sis) => (
                  <div key={sis.nome}>
                    <NavItem to={`/setor/${encodeURIComponent(sis.nome)}`} icon={<span className="size-1.5 rounded-full bg-accent" />} label={sis.nome} />
                    {sis.setores.map((s) => (
                      <NavLink key={s} to={`/setor/${encodeURIComponent(s)}`}
                        className={({ isActive }) => cn(
                          "flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-md text-xs transition",
                          isActive ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}>
                        <span className="size-1 rounded-full bg-primary" />
                        <span className="truncate">{s}</span>
                      </NavLink>
                    ))}
                  </div>
                ))}
                {outros.length > 0 && (
                  <>
                    <div className="pt-4 px-2 text-[11px] uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                      <FolderTree className="size-3" /> Setores
                    </div>
                    {outros.map((s) => (
                      <NavItem key={s} to={`/setor/${encodeURIComponent(s)}`} icon={<span className="size-1.5 rounded-full bg-primary" />} label={s} />
                    ))}
                  </>
                )}
              </>
            );
          })()}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="text-xs text-muted-foreground truncate px-2 mb-2">{user?.email}</div>
          <button
            onClick={async () => { await signOut(); nav("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/60 text-muted-foreground hover:text-foreground transition"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition",
        isActive ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}>
      <span className="grid place-items-center size-4">{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
