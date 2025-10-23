"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Check, UserPlus } from "iconoir-react";

interface InviteDialogProps {
  empresaId: string;
  onInviteCreated?: () => void;
}

export function InviteDialog({ empresaId, onInviteCreated }: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "tecnico">("tecnico");
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !role) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("E-mail inválido");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      
      const { data, error } = await supabase.rpc("create_invite", {
        p_empresa_id: empresaId,
        p_email: email.trim().toLowerCase(),
        p_role: role,
        p_expires_days: 7,
      });

      if (error) {
        console.error("Erro ao criar convite:", error);
        toast.error(error.message || "Erro ao criar convite");
        return;
      }

      if (data) {
        console.log('[InviteDialog] Convite criado:', data);
        setInviteToken(data.token);
        toast.success("Convite criado com sucesso!");
        console.log('[InviteDialog] Chamando onInviteCreated...');
        onInviteCreated?.();
      }
    } catch (err: any) {
      console.error("Erro ao criar convite:", err);
      toast.error(err.message || "Erro ao criar convite");
    } finally {
      setLoading(false);
    }
  };

  const getInviteUrl = () => {
    if (!inviteToken) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/signup?token=${inviteToken}`;
  };

  const handleCopyLink = async () => {
    const url = getInviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar link");
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form após fechar
    setTimeout(() => {
      setEmail("");
      setRole("tecnico");
      setInviteToken(null);
      setCopied(false);
    }, 200);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Admin",
      tecnico: "Técnico",
    };
    return labels[role] || role;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convidar novo colaborador</DialogTitle>
          <DialogDescription>
            {inviteToken
              ? "Convite criado! Copie o link abaixo e envie para o colaborador."
              : "Preencha os dados para criar um convite de acesso."}
          </DialogDescription>
        </DialogHeader>

        {!inviteToken ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail do colaborador</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colaborador@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Papel / Função</Label>
                <Select
                  value={role}
                  onValueChange={(value: any) => setRole(value)}
                  disabled={loading}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {role === "admin" && "Acesso total ao sistema"}
                  {role === "tecnico" && "Acesso apenas às suas ordens de serviço"}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar convite"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">E-mail convidado</Label>
                <p className="font-medium">{email}</p>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Papel</Label>
                <p className="font-medium">{getRoleLabel(role)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link do convite</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={getInviteUrl()}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                O link expira em 7 dias e só pode ser usado uma vez.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

