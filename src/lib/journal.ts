/*
 * Local-first run journal. Entries live in localStorage; sharing is a URL
 * with the entry encoded in the fragment (no server involved). Community
 * reports are separate — GitHub Discussions, snapshotted to reports.json.
 */

export interface JournalEntry {
  id: string
  river: string // slug
  date: string // YYYY-MM-DD (day paddled)
  level: number | null
  units: string
  rating: number // 1..5
  notes: string
  author?: string
  createdAt: string // ISO
}

const KEY = 'soshreds-journal-v1'

export function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as JournalEntry[]) : []
  } catch {
    return []
  }
}

export function saveEntry(entry: JournalEntry): JournalEntry[] {
  const all = loadJournal().filter((e) => e.id !== entry.id)
  all.push(entry)
  all.sort((a, b) => (a.date < b.date ? 1 : -1))
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}

export function deleteEntry(id: string): JournalEntry[] {
  const all = loadJournal().filter((e) => e.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
  return all
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/* ------------------------------------------------ share links (URL blobs) */

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

function b64urlDecode(s: string): string {
  const b64 = s.replaceAll('-', '+').replaceAll('_', '/')
  return decodeURIComponent(escape(atob(b64)))
}

export function encodeShare(entry: JournalEntry): string {
  const { id: _id, createdAt: _c, ...rest } = entry
  return b64urlEncode(JSON.stringify(rest))
}

export function decodeShare(blob: string): Omit<JournalEntry, 'id' | 'createdAt'> | null {
  try {
    const obj = JSON.parse(b64urlDecode(blob))
    if (typeof obj.river !== 'string' || typeof obj.date !== 'string') return null
    return {
      river: obj.river,
      date: obj.date,
      level: typeof obj.level === 'number' ? obj.level : null,
      units: typeof obj.units === 'string' ? obj.units : 'm³/s',
      rating: Math.min(5, Math.max(1, Number(obj.rating) || 3)),
      notes: typeof obj.notes === 'string' ? obj.notes.slice(0, 4000) : '',
      author: typeof obj.author === 'string' ? obj.author.slice(0, 80) : undefined,
    }
  } catch {
    return null
  }
}

// Share links must open for people who don't have the app: from the native
// shell (capacitor://localhost) or a dev server, point at the public site.
const CANONICAL_BASE = 'https://titaniumbones.github.io/so-shreds/'

export function shareUrl(entry: JournalEntry): string {
  const onPublicWeb =
    location.protocol.startsWith('http') &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1'
  const base = onPublicWeb ? `${location.origin}${location.pathname}` : CANONICAL_BASE
  return `${base}#/shared/${encodeShare(entry)}`
}

/* ------------------------------------------------------ community reports */

export interface CommunityReport {
  author: string
  avatar: string
  createdAt: string
  url: string
  body: string
  upvotes: number
}

export interface ReportsFile {
  generated: string | null
  rivers: Record<string, { url: string; reports: CommunityReport[] }>
}

let reportsCache: ReportsFile | null = null

export async function fetchReports(): Promise<ReportsFile> {
  if (reportsCache) return reportsCache
  const res = await fetch(`${import.meta.env.BASE_URL}reports.json`)
  if (!res.ok) throw new Error(`reports ${res.status}`)
  reportsCache = (await res.json()) as ReportsFile
  return reportsCache
}
