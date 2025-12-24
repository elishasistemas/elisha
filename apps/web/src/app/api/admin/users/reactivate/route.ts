import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logEvent } from '@/lib/logsnag'

/**
 * API para reativar usuário (apenas admin/supervisor)
 */
export async function POST(request: Request) {
    try {
        const { userId, email } = await request.json()

        if (!userId && !email) {
            return NextResponse.json(
                { error: 'userId ou email é obrigatório' },
                { status: 400 }
            )
        }

        // Service role client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Buscar profile para confirmar existência e pegar user_id
        let query = supabase.from('profiles').select('id, user_id, nome, role')

        if (userId) {
            query = query.or(`id.eq.${userId},user_id.eq.${userId}`)
        } else {
            // Se não tem ID, precisamos buscar o ID pelo email no Auth primeiro
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
            if (!authUser) {
                return NextResponse.json({ error: 'Usuário não encontrado no Auth' }, { status: 404 })
            }
            query = query.eq('user_id', authUser.id)
        }

        const { data: profile, error: profileError } = await query.maybeSingle()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // 2. Reativar no profile
        const { error: activateError } = await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('user_id', profile.user_id)

        if (activateError) {
            console.error('[admin/users/reactivate] Erro ao reativar profile:', activateError)
            return NextResponse.json(
                { error: `Erro ao reativar profile: ${activateError.message}` },
                { status: 500 }
            )
        }

        // 3. Remover ban no Auth (setar ban_duration para 0 ou 'none')
        // Na verdade, no Supabase Auth Admin, para desbanir você seta ban_duration para 'none'
        const { error: unbanError } = await supabase.auth.admin.updateUserById(profile.user_id, {
            ban_duration: 'none'
        })

        if (unbanError) {
            console.error('[admin/users/reactivate] Erro ao desbanir usuário:', unbanError)
            return NextResponse.json(
                { error: `Erro ao desbanir usuário: ${unbanError.message}` },
                { status: 500 }
            )
        }

        // Telemetry: user reactivated
        logEvent({
            channel: 'users',
            event: 'User Reactivated',
            icon: '✅',
            tags: { user_id: userId, name: profile.nome || '' },
            notify: false,
        }).catch(() => { })

        return NextResponse.json({ success: true, message: 'Usuário reativado com sucesso' })

    } catch (error) {
        console.error('[admin/users/reactivate] Erro interno:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
