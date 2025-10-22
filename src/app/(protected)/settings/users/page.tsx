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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Trash, RefreshDouble, Copy } from "iconoir-react";

interface Profile {
  id: string;
  empresa_id: string | null;
  role: string;
  roles?: string[];
  active_role?: string;
  created_at: string;
  email?: string; // pode não existir na tabela profiles
  name?: string;
  is_elisha_admin?: boolean;
  impersonating_empresa_id?: string | null;
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
    console.log('[UsersPage] loadData() chamado');
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
        .select("id, empresa_id, role, roles, active_role, created_at, is_elisha_admin, impersonating_empresa_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        toast.error("Erro ao carregar perfil");
        return;
      }

      setCurrentProfile(profile);
      
      // Se for elisha_admin impersonando, usar impersonating_empresa_id
      // Caso contrário, usar empresa_id
      const targetEmpresaId = profile.is_elisha_admin && profile.impersonating_empresa_id 
        ? profile.impersonating_empresa_id 
        : profile.empresa_id;
      
      setEmpresaId(targetEmpresaId);

      // Validar se temos uma empresa para buscar
      if (!targetEmpresaId) {
        toast.error("Nenhuma empresa selecionada. Acesse via Super Admin para gerenciar empresas.");
        setLoading(false);
        return;
      }

      // Carregar usuários da empresa com emails (via API)
      try {
        const usersResponse = await fetch('/api/admin/users/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empresaId: targetEmpresaId })
        });

        const usersData = await usersResponse.json().catch(() => ({ error: 'Erro ao carregar usuários' }));
        if (!usersResponse.ok) {
          const msg = usersData?.error || 'Erro ao carregar usuários'
          throw new Error(msg)
        }
        setProfiles((usersData.users || []) as unknown as Profile[]);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        const message = err instanceof Error ? err.message : 'Erro ao carregar usuários'
        toast.error(message);
        setProfiles([]);
      }

      // Carregar convites da empresa (apenas pendentes)
      const { data: invitesData, error: invitesError } = await supabase
        .from("invites")
        .select("*")
        .eq("empresa_id", targetEmpresaId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (invitesError) {
        console.error("Erro ao buscar convites:", invitesError);
        toast.error("Erro ao carregar convites");
      } else {
        console.log('[UsersPage] Convites carregados:', invitesData?.length, invitesData);
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

  const handleCopyInviteLink = async (token: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${baseUrl}/signup?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copiado para a área de transferência!");
    } catch (err) {
      console.error("Erro ao copiar link:", err);
      toast.error("Erro ao copiar link");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Deseja realmente excluir este usuário? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao excluir usuário");
      }

      toast.success("Usuário excluído com sucesso");
      loadData();
    } catch (err: any) {
      console.error("Erro ao excluir usuário:", err);
      toast.error(`Erro ao excluir usuário: ${err.message}`);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      tecnico: "Técnico",
      elisha_admin: "Elisha Admin",
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      tecnico: "outline",
      elisha_admin: "secondary",
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

  // Verificar se o usuário é admin (verificar active_role ou roles)
  const isAdmin = 
    currentProfile?.active_role === "admin" || 
    currentProfile?.roles?.includes("admin") ||
    currentProfile?.is_elisha_admin;

  console.log('[UsersPage] Permission check:', {
    active_role: currentProfile?.active_role,
    roles: currentProfile?.roles,
    is_elisha_admin: currentProfile?.is_elisha_admin,
    isAdmin
  });

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
                  <TableHead>Nome</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.email || "N/A"}
                    </TableCell>
                    <TableCell>
                      {profile.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(profile.role)}>
                        {getRoleLabel(profile.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(profile.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUser(profile.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir usuário</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleCopyInviteLink(invite.token)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar link do convite</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleRevokeInvite(invite.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Revogar convite</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
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
