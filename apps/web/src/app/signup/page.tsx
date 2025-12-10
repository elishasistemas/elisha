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
import { Loader2, Eye, EyeOff } from "lucide-react"; // Loading spinner icon
import { PasswordStrength } from "@/components/password-strength";

interface InviteData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  empresa_id: string;
  empresa_nome?: string;
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
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [funcao, setFuncao] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phone mask utility
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      // (00) 0000-0000
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    } else {
      // (00) 00000-0000
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };

  const handlePhoneChange = (value: string, setter: (val: string) => void) => {
    const formatted = formatPhone(value);
    setter(formatted);
  };

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

      // Buscar dados do convite
      console.log('[Signup] Buscando convite:', token);
      const { data: inviteData, error: inviteError } = await supabase
        .from("invites")
        .select("*")
        .eq("token", token)
        .single();

      console.log('[Signup] Resultado convite:', { inviteData, inviteError });

      if (inviteError || !inviteData) {
        console.error("[Signup] Erro ao buscar convite:", inviteError);
        setError("Convite inválido ou não encontrado");
        setLoading(false);
        return;
      }

      // Buscar nome da empresa separadamente
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("nome")
        .eq("id", inviteData.empresa_id)
        .single();

      console.log('[Signup] Nome da empresa:', empresaData);

      // Adicionar nome da empresa ao invite
      const inviteWithEmpresa = {
        ...inviteData,
        empresa_nome: empresaData?.nome || 'Empresa'
      }

      console.log('[Signup] Convite completo:', inviteWithEmpresa);

      // Verificar se o convite expirou
      if (new Date(inviteWithEmpresa.expires_at) < new Date()) {
        setError("Este convite expirou. Entre em contato com o administrador.");
        setLoading(false);
        return;
      }

      // Verificar se o convite já foi aceito
      if (inviteWithEmpresa.status !== "pending") {
        setError("Este convite já foi utilizado ou revogado.");
        setLoading(false);
        return;
      }

      setInvite(inviteWithEmpresa);
      setEmail(inviteWithEmpresa.email);

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
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!nome || !whatsappNumero) {
      toast.error("Nome e WhatsApp são obrigatórios");
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
      toast.error("As senhas não coincidem");
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
        const { translateAuthErrorMessage } = await import('@/utils/auth-error-pt')
        toast.error(translateAuthErrorMessage(signUpError));
        return;
      }

      if (signUpData.user) {
        // Telemetry: signup iniciado
        fetch('/api/telemetry/logsnag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'auth',
            event: 'Signup Success',
            icon: '🎉',
            tags: { source: 'invite' },
          }),
        }).catch(() => {})
        // Aguardar um pouco para garantir que a sessão foi estabelecida
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se o usuário está autenticado
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Aceitar convite
          await acceptInvite();
        } else {
          toast.success("Conta criada! Verifique seu email para confirmar.");
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Erro ao criar conta:", err);
      const { translateAuthErrorMessage } = await import('@/utils/auth-error-pt')
      toast.error(translateAuthErrorMessage(err));
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
        const { translateAuthErrorMessage } = await import('@/utils/auth-error-pt')
        toast.error(translateAuthErrorMessage(error));
        return;
      }

      if (data.user) {
        // Aceitar convite
        await acceptInvite();
      }
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      const { translateAuthErrorMessage } = await import('@/utils/auth-error-pt')
      toast.error(translateAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const acceptInvite = async () => {
    if (!token) return;

    try {
      const supabase = createSupabaseBrowser();

      console.log('[Signup] Aceitando convite...', token);
      const { data, error } = await supabase.rpc("accept_invite", {
        p_token: token,
        p_nome: nome || null,
        p_telefone: telefone || null,
        p_whatsapp_numero: whatsappNumero || null,
        p_funcao: funcao || null,
      });

      console.log('[Signup] Resultado accept_invite:', { data, error });

      if (error) {
        console.error("Erro ao aceitar convite:", error);
        const errorMessage = error.message === "User not authenticated" 
          ? "Sessão expirou. Faça login novamente para aceitar o convite."
          : (error.message || "Erro ao aceitar convite");
        toast.error(errorMessage);
        
        // Se não autenticado, redirecionar para login
        if (error.message === "User not authenticated") {
          setTimeout(() => {
            router.push(`/login?redirect=/signup?token=${token}`);
          }, 2000);
        }
        return;
      }

      console.log('[Signup] Convite aceito com sucesso! Dados:', data);
      // Telemetry: convite aceito
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'auth',
          event: 'Invite Accepted',
          icon: '✅',
          tags: { token: token?.slice(0, 6) + '…' },
        }),
      }).catch(() => {})
      toast.success("Convite aceito! Bem-vindo(a)!");
      
      // Redirect para dashboard
      setTimeout(() => {
        console.log('[Signup] Redirecionando para dashboard...');
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      console.error("Erro ao aceitar convite:", err);
      toast.error(err.message || "Erro ao aceitar convite");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Admin",
      supervisor: "Supervisor",
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
            <CardTitle>🎉 Olá, este é um convite exclusivo para você! </CardTitle>
            <CardDescription>
              <strong>{invite.empresa_nome}</strong> convidou você para acessar 
              o sistema como <Badge variant="secondary" className="ml-1">{getRoleLabel(invite.role)}</Badge>
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

              {!isAuthenticated && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">
                      Nome Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      disabled={submitting}
                      required
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">
                      WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={whatsappNumero}
                      onChange={(e) => handlePhoneChange(e.target.value, setWhatsappNumero)}
                      disabled={submitting}
                      required
                      placeholder="(81) 99999-9999"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={telefone}
                      onChange={(e) => handlePhoneChange(e.target.value, setTelefone)}
                      disabled={submitting}
                      placeholder="(81) 3333-4444"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função/Cargo</Label>
                    <Input
                      id="funcao"
                      type="text"
                      value={funcao}
                      onChange={(e) => setFuncao(e.target.value)}
                      disabled={submitting}
                      placeholder="Ex: Técnico de Manutenção"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  {isAuthenticated ? "Senha" : "Criar senha"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={submitting}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {!isAuthenticated && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmar senha <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={submitting}
                        required
                        minLength={6}
                        placeholder="Digite a senha novamente"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={submitting}
                        title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <PasswordStrength password={password} />
                </>
              )}

              {isAuthenticated && <PasswordStrength password={password} />}

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
