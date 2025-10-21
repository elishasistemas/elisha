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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash, RefreshDouble } from "iconoir-react";

interface Profile {
  id: string;
  empresa_id: string;
  role: string;
  created_at: string;
  email?: string; // pode não existir na tabela profiles
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
  // Search + pagination state
  const [searchUsers, setSearchUsers] = useState("");
  const [pageUsers, setPageUsers] = useState(1);
  const [pageSizeUsers, setPageSizeUsers] = useState(10);
  const [searchInvites, setSearchInvites] = useState("");
  const [pageInvites, setPageInvites] = useState(1);
  const [pageSizeInvites, setPageSizeInvites] = useState(10);

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
        .eq("id", user.id)
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
        .select("id, empresa_id, role, created_at")
        .eq("empresa_id", profile.empresa_id)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Erro ao buscar usuários:", profilesError);
        toast.error("Erro ao carregar usuários");
      } else {
        // Evitar uso de auth.admin no cliente (requer service role)
        // Exibe dados disponíveis do perfil; email pode ser N/A
        setProfiles((profilesData || []) as unknown as Profile[]);
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Usuários ativos</CardTitle>
              <CardDescription>
                Colaboradores com acesso ao sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por e-mail ou papel"
                value={searchUsers}
                onChange={(e) => { setSearchUsers(e.target.value); setPageUsers(1); }}
                className="w-[260px]"
              />
              <Select value={String(pageSizeUsers)} onValueChange={(v) => { setPageSizeUsers(Number(v)); setPageUsers(1); }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Por página" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / página</SelectItem>
                  <SelectItem value="20">20 / página</SelectItem>
                  <SelectItem value="50">50 / página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (() => {
            // Filter + paginate users
            const q = searchUsers.trim().toLowerCase();
            const filtered = !q ? profiles : profiles.filter((p) => {
              const email = (p.email || "N/A").toLowerCase();
              const role = (p.role || "").toLowerCase();
              return email.includes(q) || role.includes(q);
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSizeUsers));
            const currentPage = Math.min(pageUsers, totalPages);
            const start = (currentPage - 1) * pageSizeUsers;
            const end = start + pageSizeUsers;
            const pageRows = filtered.slice(start, end);

            return filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum usuário {q ? 'encontrado' : 'cadastrado'}
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
                {pageRows.map((profile) => (
                  <TableRow key={profile.id}>
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
            );
          })()}
          {(() => {
            const q = searchUsers.trim().toLowerCase();
            const filtered = !q ? profiles : profiles.filter((p) => {
              const email = (p.email || "N/A").toLowerCase();
              const role = (p.role || "").toLowerCase();
              return email.includes(q) || role.includes(q);
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSizeUsers));
            const currentPage = Math.min(pageUsers, totalPages);
            const start = (currentPage - 1) * pageSizeUsers;
            const end = start + pageSizeUsers;
            return filtered.length > 0 ? (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>
                  Mostrando {Math.min(end, total)} de {total}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPageUsers((p) => Math.max(1, p - 1))}>
                    Anterior
                  </Button>
                  <span>Página {currentPage} de {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPageUsers((p) => Math.min(totalPages, p + 1))}>
                    Próxima
                  </Button>
                </div>
              </div>
            ) : null;
          })()}
        </CardContent>
      </Card>

      {/* Convites */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Convites</CardTitle>
              <CardDescription>
                Convites enviados para novos colaboradores
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por e-mail ou status"
                value={searchInvites}
                onChange={(e) => { setSearchInvites(e.target.value); setPageInvites(1); }}
                className="w-[260px]"
              />
              <Select value={String(pageSizeInvites)} onValueChange={(v) => { setPageSizeInvites(Number(v)); setPageInvites(1); }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Por página" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / página</SelectItem>
                  <SelectItem value="20">20 / página</SelectItem>
                  <SelectItem value="50">50 / página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (() => {
            // Filter + paginate invites
            const q = searchInvites.trim().toLowerCase();
            const filtered = !q ? invites : invites.filter((i) => {
              const email = (i.email || "").toLowerCase();
              const status = (i.status || "").toLowerCase();
              const role = (i.role || "").toLowerCase();
              return email.includes(q) || status.includes(q) || role.includes(q);
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSizeInvites));
            const currentPage = Math.min(pageInvites, totalPages);
            const start = (currentPage - 1) * pageSizeInvites;
            const end = start + pageSizeInvites;
            const pageRows = filtered.slice(start, end);

            return filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum convite {q ? 'encontrado' : 'criado ainda'}
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
                {pageRows.map((invite) => (
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
            );
          })()}
          {(() => {
            const q = searchInvites.trim().toLowerCase();
            const filtered = !q ? invites : invites.filter((i) => {
              const email = (i.email || "").toLowerCase();
              const status = (i.status || "").toLowerCase();
              const role = (i.role || "").toLowerCase();
              return email.includes(q) || status.includes(q) || role.includes(q);
            });
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / pageSizeInvites));
            const currentPage = Math.min(pageInvites, totalPages);
            const start = (currentPage - 1) * pageSizeInvites;
            const end = start + pageSizeInvites;
            return filtered.length > 0 ? (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>
                  Mostrando {Math.min(end, total)} de {total}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPageInvites((p) => Math.max(1, p - 1))}>
                    Anterior
                  </Button>
                  <span>Página {currentPage} de {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPageInvites((p) => Math.min(totalPages, p + 1))}>
                    Próxima
                  </Button>
                </div>
              </div>
            ) : null;
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
