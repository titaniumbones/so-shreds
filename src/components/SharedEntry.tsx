import { useState } from 'react'
import { riverBySlug } from '../data/rivers'
import { decodeShare, newId, saveEntry } from '../lib/journal'

/** View for a journal entry someone shared as a link; offers import. */
export function SharedEntry({ blob }: { blob: string }) {
  const [saved, setSaved] = useState(false)
  const entry = decodeShare(blob)
  const river = entry ? riverBySlug(entry.river) : undefined

  if (!entry) {
    return (
      <main>
        <a className="detail-back" href="#/">
          ← All rivers
        </a>
        <p className="card-error">
          This share link is damaged or from an incompatible version.
        </p>
      </main>
    )
  }

  return (
    <main>
      <a className="detail-back" href="#/">
        ← All rivers
      </a>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
        Shared run report
      </h1>
      <div className="journal-entry" style={{ maxWidth: 640 }}>
        <div className="entry-head">
          <strong>{river?.name ?? entry.river}</strong>
          <span className="entry-level">{entry.date}</span>
          {entry.level != null && (
            <span className="entry-level">
              {entry.level} {entry.units}
            </span>
          )}
          <span className="entry-stars">
            {'★'.repeat(entry.rating)}
            {'☆'.repeat(5 - entry.rating)}
          </span>
        </div>
        {entry.author && <p className="hint">reported by {entry.author}</p>}
        <p className="entry-notes">{entry.notes}</p>
        <p>
          <button
            className="btn primary"
            disabled={saved}
            onClick={() => {
              saveEntry({ ...entry, id: newId(), createdAt: new Date().toISOString() })
              setSaved(true)
            }}
          >
            {saved ? 'Added to your journal ✓' : 'Add to my journal'}
          </button>{' '}
          {river && (
            <a className="btn" href={`#/${river.slug}`}>
              View {river.name}
            </a>
          )}
        </p>
      </div>
    </main>
  )
}
