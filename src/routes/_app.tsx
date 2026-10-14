import { createFileRoute, Link, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, MessagesSquare, Mail, NotebookPen, CalendarCheck, Search, FolderOpen, Settings, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_app")({ component: AppLayout });

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: MessagesSquare },
  { to: "/email", label: "Smart Email Generator", icon: Mail },
  { to: "/meetings", label: "Meeting Notes Summarizer", icon: NotebookPen },
  { to: "/planner", label: "Task Planner", icon: CalendarCheck },
  { to: "/research", label: "AI Research Assistant", icon: Search },
  { to: "/resources", label: "Business Resources", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const { session, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (loading) return <div className="min-h-screen" />;
  if (!session) return <Navigate to="/auth" />;
  const email = session.user.email ?? "";
  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="m-4 rounded-xl bg-card p-3">
          <img src={logo} alt="Malibongwe Poultries" width={240} height={120} className="mx-auto h-16 w-auto" />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-85 transition hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent !opacity-100 shadow-[inset_3px_0_0_var(--gold)]" }}
            >
              <Icon className="size-4 text-sidebar-primary" />
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100">
          <LogOut className="size-4" /> Log out
        </button>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/90 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
          <span className="hidden text-sm text-muted-foreground lg:block">Malibongwe Poultries · Workplace Assistant</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold uppercase text-primary-foreground">
              {email.slice(0, 1)}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal text-muted-foreground">{email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>Profile & settings</DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
