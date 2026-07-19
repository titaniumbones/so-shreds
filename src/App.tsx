import { useEffect, useState } from 'react'
import { rivers, riverBySlug } from './data/rivers'
import { RiverCard } from './components/RiverCard'
import { RiverDetail } from './components/RiverDetail'

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash.replace(/^#\/?/, '')
}

export default function App() {
  const route = useHashRoute()
  const river = route ? riverBySlug(route) : undefined

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  return (
    <>
      <header className="site-header">
        <h1 className="site-title">
          <span className="title-so">Southern Ontario</span>
          Shreds
        </h1>
        <p className="site-tagline">
          Live whitewater levels for Ontario rivers, straight from the federal
          gauges. Is it running? Find out before you drive.
        </p>
      </header>

      {river ? (
        <RiverDetail river={river} />
      ) : (
        <main>
          <p className="updated-line">
            Readings are provisional and update roughly hourly. Bands are
            advisory — always scout.
          </p>
          <ul className="river-list">
            {rivers.map((r) => (
              <RiverCard key={r.slug} river={r} />
            ))}
          </ul>
        </main>
      )}

      <footer className="site-footer">
        <p>
          Data: <a href="https://api.weather.gc.ca/">Environment and Climate
          Change Canada GeoMet</a> / Water Survey of Canada real-time hydrometric
          network. Contains information licensed under the Open Government
          Licence – Canada.
        </p>
        <p>
          Levels are provisional and can be wrong; band thresholds are folk
          knowledge, not safety advice. Wear a drysuit, bring a friend.
        </p>
        <p>
          <a href="https://github.com/titaniumbones/so-shreds">Source on GitHub</a>
        </p>
      </footer>
    </>
  )
}
