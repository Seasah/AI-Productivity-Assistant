import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Malibongwe Poultries — Business Assistant" },
      { name: "description", content: "Smarter poultry business operations with AI tools for emails, meetings, tasks and research." },
      { property: "og:title", content: "Malibongwe Poultries — Business Assistant" },
      { property: "og:description", content: "Smarter poultry business operations with AI tools." },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <img src={logo} alt="Malibongwe Poultries" width={280} height={140} className="animate-pulse" />
      </div>
    );
  return <Navigate to={session ? "/dashboard" : "/auth"} />;
}
