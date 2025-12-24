"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { CreateUserColaboradorDialog } from "@/components/create-user-colaborador-dialog";
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
import { Trash, RefreshDouble } from "iconoir-react";
import { isAdmin } from "@/utils/auth";
import { useAuth, useProfile } from "@/hooks/use-supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditUserDialog } from "@/components/edit-user-dialog";

interface Profile {
  id: string;
  empresa_id: string | null;
  role: string;
  roles?: string[];
  active_role?: string;
  created_at: string;
  email?: string; // pode não existir na tabela profiles
  nome?: string;
  is_elisha_admin?: boolean;
  impersonating_empresa_id?: string | null;

}



export default function UsersPage() {
  const { user, session } = useAuth();
  const { profile: userProfile } = useProfile(user?.id);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");
  // Search + pagination state
  const [searchUsers, setSearchUsers] = useState("");
  const [pageUsers, setPageUsers] = useState(1);
  const [pageSizeUsers, setPageSizeUsers] = useState(10);
  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar se é admin usando a função correta
  const canAdmin = isAdmin(session, userProfile);

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
        toast.error("Sessão expirada. Redirecionando para login...");
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, empresa_id, role, roles, active_role, created_at, is_elisha_admin, impersonating_empresa_id")
        .eq("user_id", user.id)
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

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };



  const handleDeleteUser = (userId: string) => {
    setDeleteId(userId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao excluir usuário");
      }

      toast.success("Usuário excluído com sucesso");
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      console.error("Erro ao excluir usuário:", err);
      toast.error(`Erro ao excluir usuário: ${err.message}`);
    } finally {
      setIsDeleting(false);
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



  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  };

  if (!canAdmin && !loading) {
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
            Usuários
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
          {canAdmin && empresaId && (
            <CreateUserColaboradorDialog
              empresaId={empresaId}
              onUserCreated={loadData}
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
                placeholder="Buscar por e-mail ou função"
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
                    <TableHead>Função</TableHead>
                    <TableHead className="w-[150px]">Criado em</TableHead>
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
                        {profile.nome || "-"}
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
                        <div className="flex items-center justify-end gap-1">
                          <EditUserDialog
                            user={profile}
                            onUserUpdated={loadData}
                          />
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
                        </div>
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


      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário
              e removerá seu acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir Usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

