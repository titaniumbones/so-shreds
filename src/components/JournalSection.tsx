import { useEffect, useState } from 'react'
import type { River } from '../types'
import discussions from '../data/discussions.json'
import {
  deleteEntry,
  fetchReports,
  loadJournal,
  newId,
  saveEntry,
  shareUrl,
  type CommunityReport,
  type JournalEntry,
} from '../lib/journal'

const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function JournalSection({
  river,
  currentLevel,
}: {
  river: River
  currentLevel: number | null
}) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [community, setCommunity] = useState<{
    url: string
    reports: CommunityReport[]
  } | null>(null)

  useEffect(() => {
    setEntries(loadJournal())
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchReports()
      .then((r) => {
        if (!cancelled) setCommunity(r.rivers[river.slug] ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [river.slug])

  const mine = entries.filter((e) => e.river === river.slug)
  const discussionNumber = (discussions as Record<string, number>)[river.slug]
  const discussionUrl =
    community?.url ??
    (discussionNumber
      ? `https://github.com/titaniumbones/so-shreds/discussions/${discussionNumber}`
      : null)

  function submit(form: FormData) {
    const levelRaw = form.get('level') as string
    const entry: JournalEntry = {
      id: newId(),
      river: river.slug,
      date: (form.get('date') as string) || todayISO(),
      level: levelRaw ? Number(levelRaw) : null,
      units: river.units,
      rating: Number(form.get('rating') ?? 3),
      notes: ((form.get('notes') as string) ?? '').trim(),
      author: ((form.get('author') as string) ?? '').trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    setEntries(saveEntry(entry))
    setShowForm(false)
  }

  function copyShare(e: JournalEntry) {
    navigator.clipboard.writeText(shareUrl(e)).then(() => {
      setCopied(e.id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <section className="journal">
      <h2>Run journal</h2>

      {/* ------------------------------------------------ my private log */}
      <div className="journal-mine">
        <div className="journal-head">
          <h3>My runs</h3>
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Record a run'}
          </button>
        </div>

        {showForm && (
          <form
            className="journal-form"
            onSubmit={(ev) => {
              ev.preventDefault()
              submit(new FormData(ev.currentTarget))
            }}
          >
            <div className="row">
              <label>
                Date
                <input name="date" type="date" defaultValue={todayISO()} max={todayISO()} />
              </label>
              <label>
                Level ({river.units})
                <input
                  name="level"
                  type="number"
                  step="any"
                  defaultValue={currentLevel ?? undefined}
                />
              </label>
              <label>
                Rating
                <select name="rating" defaultValue="3">
                  <option value="1">1 — scrape-fest</option>
                  <option value="2">2 — meh</option>
                  <option value="3">3 — good day</option>
                  <option value="4">4 — great</option>
                  <option value="5">5 — all-time</option>
                </select>
              </label>
            </div>
            <label>
              Notes — how did it feel at this level? hazards? wood?
              <textarea name="notes" rows={4} required />
            </label>
            <label>
              Name (only used if you share this entry)
              <input name="author" type="text" autoComplete="nickname" />
            </label>
            <button className="btn primary" type="submit">
              Save to my journal
            </button>
            <p className="hint">
              Saved privately in this browser. Use "share" to send an entry to
              a friend, or post it publicly in the community thread below.
            </p>
          </form>
        )}

        {mine.length === 0 && !showForm && (
          <p className="hint">
            Nothing yet. Record what a level actually paddled like — future-you
            checks this before every drive.
          </p>
        )}

        <ul className="journal-list">
          {mine.map((e) => (
            <li key={e.id} className="journal-entry">
              <div className="entry-head">
                <strong>{e.date}</strong>
                {e.level != null && (
                  <span className="entry-level">
                    {e.level} {e.units}
                  </span>
                )}
                <span className="entry-stars" aria-label={`rating ${e.rating} of 5`}>
                  {'★'.repeat(e.rating)}
                  {'☆'.repeat(5 - e.rating)}
                </span>
                <span className="entry-actions">
                  <button className="btn small" onClick={() => copyShare(e)}>
                    {copied === e.id ? 'copied!' : 'share'}
                  </button>
                  <button
                    className="btn small"
                    onClick={() => setEntries(deleteEntry(e.id))}
                  >
                    delete
                  </button>
                </span>
              </div>
              <p className="entry-notes">{e.notes}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------------------- community reports */}
      <div className="journal-community">
        <div className="journal-head">
          <h3>Community reports</h3>
          {discussionUrl && (
            <a
              className="btn"
              href={discussionUrl}
              target="_blank"
              rel="noreferrer"
            >
              Post a report on GitHub
            </a>
          )}
        </div>
        {!community || community.reports.length === 0 ? (
          <p className="hint">
            No reports yet for this river. Posting takes a GitHub account —
            reports show up here within a few minutes.
          </p>
        ) : (
          <ul className="journal-list">
            {[...community.reports].reverse().map((r) => (
              <li key={r.url} className="journal-entry">
                <div className="entry-head">
                  {r.avatar && <img className="avatar" src={r.avatar} alt="" />}
                  <strong>{r.author}</strong>
                  <span className="entry-level">
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {r.upvotes > 0 && <span className="entry-level">👍 {r.upvotes}</span>}
                  <span className="entry-actions">
                    <a className="btn small" href={r.url} target="_blank" rel="noreferrer">
                      reply
                    </a>
                  </span>
                </div>
                <p className="entry-notes">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
