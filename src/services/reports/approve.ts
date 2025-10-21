import type { Session } from '@supabase/supabase-js'
import { isSelfApproval, handleSelfApproval } from '@/utils/approval'

export type Report = {
  id: string
  creatorUserId: string
  executedByUserId: string
}

export async function approveReport(
  report: Report,
  session: Session | null,
  options: {
    empresa: { requireDualApproval?: boolean }
    hasAnotherGestor: boolean
    ip?: string
    doApprove: () => Promise<void>
    requestApprovalFromAnotherGestor: () => Promise<void>
    askClientSignature: () => Promise<void>
    askFinalPhoto: () => Promise<void>
    audit: (data: Record<string, unknown>) => Promise<void>
  }
) {
  if (isSelfApproval(report, session)) {
    await handleSelfApproval(
      {
        active_role: (session?.user?.user_metadata as any)?.active_role ?? null,
        empresa: options.empresa,
        hasAnotherGestor: options.hasAnotherGestor,
        ip: options.ip,
      },
      {
        showApprovalRequest: options.requestApprovalFromAnotherGestor,
        requireClientSignature: options.askClientSignature,
        requireFinalPhoto: options.askFinalPhoto,
        logAudit: options.audit,
        approve: options.doApprove,
      }
    )
    return
  }
  // fluxo normal (não é autoaprovação)
  await options.doApprove()
}

