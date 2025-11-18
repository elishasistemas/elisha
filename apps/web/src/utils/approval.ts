import type { Session } from '@supabase/supabase-js'

export function isSelfApproval(report: { creatorUserId: string; executedByUserId: string }, session: Session | null) {
  const uid = session?.user?.id
  return !!uid && report.creatorUserId === uid && report.executedByUserId === uid
}

export type ApprovalContext = {
  active_role: 'admin' | 'tecnico' | null
  empresa: { requireDualApproval?: boolean }
  hasAnotherAdmin: boolean
  ip?: string
}

export async function handleSelfApproval(
  ctx: ApprovalContext,
  actions: {
    showApprovalRequest: () => Promise<void> | void
    requireClientSignature: () => Promise<void>
    requireFinalPhoto: () => Promise<void>
    logAudit: (data: Record<string, unknown>) => Promise<void>
    approve: () => Promise<void>
  }
) {
  const { active_role, empresa, hasAnotherAdmin, ip } = ctx
  if (empresa.requireDualApproval && hasAnotherAdmin) {
    await actions.showApprovalRequest()
    return
  }
  await actions.requireClientSignature()
  await actions.requireFinalPhoto()
  await actions.logAudit({ active_role, ip, ts: new Date().toISOString() })
  await actions.approve()
}

