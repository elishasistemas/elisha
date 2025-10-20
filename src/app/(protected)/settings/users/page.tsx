"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { InviteDialog } from "@/components/invite-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash, RefreshDouble } from "iconoir-react";

interface Profile {
  user_id: string;
  empresa_id: string;
  role: string;
  created_at: string;
  email?: string;
  name?: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowser();

    try {
      // Buscar perfil do usuário logado
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        toast.error("Erro ao carregar perfil");
        return;
      }

      setCurrentProfile(profile);
      setEmpresaId(profile.empresa_id);

      // Carregar usuários da empresa
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, empresa_id, role, created_at")
        .eq("empresa_id", profile.empresa_id)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Erro ao buscar usuários:", profilesError);
        toast.error("Erro ao carregar usuários");
      } else {
        // Buscar emails dos usuários via auth.users (se disponível)
        const profilesWithEmails = await Promise.all(
          (profilesData || []).map(async (p) => {
            try {
              // Tentar buscar email do auth
              const { data: userData } = await supabase.auth.admin.getUserById(
                p.user_id
              );
              return {
                ...p,
                email: userData?.user?.email,
              };
            } catch {
              return p;
            }
          })
        );
        setProfiles(profilesWithEmails);
      }

      // Carregar convites da empresa
      const { data: invitesData, error: invitesError } = await supabase
        .from("invites")
        .select("*")
        .eq("empresa_id", profile.empresa_id)
        .order("created_at", { ascending: false });

      if (invitesError) {
        console.error("Erro ao buscar convites:", invitesError);
        toast.error("Erro ao carregar convites");
      } else {
        setInvites(invitesData || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Deseja realmente revogar este convite?")) return;

    const supabase = createSupabaseBrowser();

    try {
      const { error } = await supabase.rpc("revoke_invite", {
        p_invite_id: inviteId,
      });

      if (error) {
        console.error("Erro ao revogar convite:", error);
        toast.error(error.message || "Erro ao revogar convite");
        return;
      }

      toast.success("Convite revogado com sucesso");
      loadData();
    } catch (err: any) {
      console.error("Erro ao revogar convite:", err);
      toast.error(err.message || "Erro ao revogar convite");
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

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      gestor: "secondary",
      tecnico: "outline",
    };
    return variants[role] || "outline";
  };

  const getStatusBadge = (status: string, expiresAt?: string) => {
    const isExpired = expiresAt && new Date(expiresAt) < new Date();

    if (isExpired && status === "pending") {
      return <Badge variant="destructive">Expirado</Badge>;
    }

    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
    > = {
      pending: { label: "Pendente", variant: "secondary" },
      accepted: { label: "Aceito", variant: "default" },
      revoked: { label: "Revogado", variant: "destructive" },
      expired: { label: "Expirado", variant: "destructive" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  };

  // Verificar se o usuário é admin
  const isAdmin = currentProfile?.role === "admin";

  if (!isAdmin && !loading) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
            <CardDescription>
              Apenas administradores podem gerenciar usuários.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Usuários e Convites
          </h1>
          <p className="text-muted-foreground">
            Gerencie os colaboradores da sua empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshDouble className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {isAdmin && empresaId && (
            <InviteDialog
              empresaId={empresaId}
              onInviteCreated={loadData}
            />
          )}
        </div>
      </div>

      {/* Usuários Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários ativos</CardTitle>
          <CardDescription>
            Colaboradores com acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum usuário encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Data de cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.user_id}>
                    <TableCell className="font-medium">
                      {profile.email || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(profile.role)}>
                        {getRoleLabel(profile.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(profile.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Convites */}
      <Card>
        <CardHeader>
          <CardTitle>Convites</CardTitle>
          <CardDescription>
            Convites enviados para novos colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum convite criado ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(invite.role)}>
                        {getRoleLabel(invite.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invite.status, invite.expires_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invite.expires_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {invite.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvite(invite.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Revogar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

