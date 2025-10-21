"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react"; // Loading spinner icon

interface InviteData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  empresa_id: string;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Token de convite não fornecido");
      setLoading(false);
      return;
    }

    checkAuthAndInvite();
  }, [token]);

  const checkAuthAndInvite = async () => {
    const supabase = createSupabaseBrowser();

    try {
      // Verificar se o usuário está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // Buscar dados do convite (sem RLS, então fazemos uma query básica)
      const { data: inviteData, error: inviteError } = await supabase
        .from("invites")
        .select("*")
        .eq("token", token)
        .single();

      if (inviteError || !inviteData) {
        console.error("Erro ao buscar convite:", inviteError);
        setError("Convite inválido ou não encontrado");
        setLoading(false);
        return;
      }

      // Verificar se o convite expirou
      if (new Date(inviteData.expires_at) < new Date()) {
        setError("Este convite expirou. Entre em contato com o administrador.");
        setLoading(false);
        return;
      }

      // Verificar se o convite já foi aceito
      if (inviteData.status !== "pending") {
        setError("Este convite já foi utilizado ou revogado.");
        setLoading(false);
        return;
      }

      setInvite(inviteData);
      setEmail(inviteData.email);

      // Se já está autenticado, aceitar convite automaticamente
      if (user) {
        await acceptInvite();
      }
    } catch (err) {
      console.error("Erro ao verificar convite:", err);
      setError("Erro ao verificar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invite) {
      toast.error("Dados do convite não encontrados");
      return;
    }

    // Validações
    if (!email || !password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (email.toLowerCase() !== invite.email.toLowerCase()) {
      toast.error("O e-mail deve ser o mesmo do convite");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowser();

      // Criar conta
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup?token=${token}`,
        },
      });

      if (signUpError) {
        console.error("Erro ao criar conta:", signUpError);
        toast.error(signUpError.message || "Erro ao criar conta");
        return;
      }

      if (signUpData.user) {
        // Aceitar convite
        await acceptInvite();
      }
    } catch (err: any) {
      console.error("Erro ao criar conta:", err);
      toast.error(err.message || "Erro ao criar conta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha e-mail e senha");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowser();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Erro ao fazer login:", error);
        toast.error(error.message || "Erro ao fazer login");
        return;
      }

      if (data.user) {
        // Aceitar convite
        await acceptInvite();
      }
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      toast.error(err.message || "Erro ao fazer login");
    } finally {
      setSubmitting(false);
    }
  };

  const acceptInvite = async () => {
    if (!token) return;

    try {
      const supabase = createSupabaseBrowser();

      const { data, error } = await supabase.rpc("accept_invite", {
        p_token: token,
      });

      if (error) {
        console.error("Erro ao aceitar convite:", error);
        toast.error(error.message || "Erro ao aceitar convite");
        return;
      }

      toast.success("Convite aceito! Bem-vindo(a)!");
      
      // Redirect para dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      console.error("Erro ao aceitar convite:", err);
      toast.error(err.message || "Erro ao aceitar convite");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      gestor: "Gestor",
      tecnico: "Técnico",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Entre em contato com o administrador da empresa para obter um novo
              convite.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo-completa.svg"
            alt="Logo"
            width={180}
            height={60}
            priority
          />
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Aceitar convite</CardTitle>
            <CardDescription>
              Você foi convidado(a) para acessar o sistema
            </CardDescription>
            
            {/* Info do convite */}
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">E-mail:</span>
                <span className="text-sm font-medium">{invite.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Papel:</span>
                <Badge>{getRoleLabel(invite.role)}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={isAuthenticated ? handleSignIn : handleSignUp}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {isAuthenticated ? "Senha" : "Criar senha"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {!isAuthenticated && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                    placeholder="Digite a senha novamente"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? "Processando..."
                  : isAuthenticated
                  ? "Entrar e aceitar convite"
                  : "Criar conta e aceitar convite"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => router.push(`/login?redirect=/signup?token=${token}`)}
                >
                  Fazer login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}

