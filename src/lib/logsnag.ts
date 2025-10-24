// Lightweight LogSnag client (server-side only)
// Uses HTTP API to avoid requiring the SDK.

const LOG_API = 'https://api.logsnag.com/v1/log';
const INSIGHT_API = 'https://api.logsnag.com/v1/insight';

type LogEventInput = {
  channel: string;
  event: string;
  description?: string;
  icon?: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  notify?: boolean;
  user_id?: string;
};

function isEnabled() {
  return Boolean(process.env.LOGSNAG_TOKEN && process.env.LOGSNAG_PROJECT);
}

function currentEnv(): string {
  // Prefer Vercel envs, fallback to NODE_ENV, default to 'local'
  const vercel = process.env.VERCEL_ENV; // 'development' | 'preview' | 'production'
  if (vercel === 'production') return 'prod';
  if (vercel === 'preview') return 'preview';
  if (vercel === 'development') return 'dev';
  const node = process.env.NODE_ENV;
  if (node === 'production') return 'prod';
  if (node === 'development') return 'dev';
  return 'local';
}

export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    if (!isEnabled()) return;
    const token = process.env.LOGSNAG_TOKEN as string;
    const project = process.env.LOGSNAG_PROJECT as string;

    const res = await fetch(LOG_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        project,
        channel: input.channel,
        event: input.event,
        description: input.description,
        icon: input.icon,
        // Always include environment tag unless provided explicitly
        tags: { env: currentEnv(), ...(input.tags || {}) },
        notify: input.notify ?? false,
        user_id: input.user_id,
      }),
    });

    if (!res.ok) {
      // Do not throw, just log for diagnostics
      const text = await res.text().catch(() => '');
      console.warn('[logsnag] Failed:', res.status, text);
    }
  } catch (err) {
    console.warn('[logsnag] Error sending event', err);
  }
}

export function canAcceptClientEvents() {
  return process.env.LOGSNAG_ALLOW_CLIENT === 'true';
}

type InsightInput = { title: string; value: number | string; icon?: string };
export async function setInsight(input: InsightInput): Promise<void> {
  try {
    if (!isEnabled()) return;
    const token = process.env.LOGSNAG_TOKEN as string;
    const project = process.env.LOGSNAG_PROJECT as string;
    const env = currentEnv();
    // Keep insights distinct per environment by suffixing the title
    const title = `${input.title} · ${env}`;
    const res = await fetch(INSIGHT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ project, title, value: input.value, icon: input.icon })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[logsnag] Insight failed:', res.status, text);
    }
  } catch (err) {
    console.warn('[logsnag] Error setting insight', err);
  }
}
