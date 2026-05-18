import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap, AttributionControl } from 'react-leaflet'
import L from 'leaflet'
import { NIVEAU_SCORE, haversineM, scoreToColor, scoreToLabel } from '../lib/geo'
import { EVENT_TYPES, isActiveEvent } from '../lib/officialData'

// ─── Colour stops (fill opacity only — color comes from geo.js) ───────────────

const OPACITY_BY_SCORE = (score) => {
  const s = Math.max(0, Math.min(3, score))
  return 0.3 + (s / 3) * 0.3 // 0.3 → 0.6
}

// ─── Clustering spatial (rayon 50 m) ─────────────────────────────────────────

function clusterReports(reports) {
  const clusters = []
  for (const report of reports) {
    let merged = false
    for (const cluster of clusters) {
      if (haversineM(report.latitude, report.longitude, cluster.lat, cluster.lng) <= 50) {
        cluster.reports.push(report)
        cluster.lat = cluster.reports.reduce((s, r) => s + r.latitude,  0) / cluster.reports.length
        cluster.lng = cluster.reports.reduce((s, r) => s + r.longitude, 0) / cluster.reports.length
        merged = true
        break
      }
    }
    if (!merged) clusters.push({ lat: report.latitude, lng: report.longitude, reports: [report] })
  }
  return clusters.map((c) => {
    const avgScore = c.reports.reduce((s, r) => s + (NIVEAU_SCORE[r.niveau] ?? 0), 0) / c.reports.length
    return { ...c, avgScore, color: scoreToColor(avgScore), opacity: OPACITY_BY_SCORE(avgScore) }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LocationTracker({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 17, { duration: 1.5 })
  }, [position, map])

  if (!position) return null

  const icon = L.divIcon({
    className: '',
    html: '<div class="user-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
  return (
    <Marker position={[position.lat, position.lng]} icon={icon}>
      <Popup>Vous êtes ici</Popup>
    </Marker>
  )
}

function PlanController({ planResult }) {
  const map = useMap()
  useEffect(() => {
    if (planResult) map.flyTo([planResult.lat, planResult.lng], 15, { duration: 1.2 })
  }, [planResult, map])
  return null
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export default function Map({ reports, position, planResult, officialEvents = [], showOfficial = false, mosquitoAlertData = [] }) {
  const clusters      = useMemo(() => clusterReports(reports), [reports])
  const activeOfficial = useMemo(
    () => showOfficial ? officialEvents.filter(isActiveEvent) : [],
    [officialEvents, showOfficial]
  )
  const maIcon = useMemo(() => L.divIcon({
    className: '',
    html: '<div class="ma-marker">🦟</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  }), [])

  return (
    <MapContainer
      center={[46.2276, 2.2137]}
      zoom={6}
      className="map-container"
      zoomControl={false}
      attributionControl={false}
    >
      <AttributionControl prefix={false} />
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* Cercle de repère plan (100m diamètre, même style que les signalements) */}
      {planResult && (
        <Circle
          center={[planResult.lat, planResult.lng]}
          radius={50}
          pathOptions={{
            color:       '#1565C0',
            fillColor:   '#1565C0',
            fillOpacity: 0.3,
            weight:      1.5,
          }}
        />
      )}

      {/* Signalements (filtrés ou tous) */}
      {clusters.map((cluster, i) => (
        <Circle
          key={i}
          center={[cluster.lat, cluster.lng]}
          radius={50}
          pathOptions={{
            color:       cluster.color,
            fillColor:   cluster.color,
            fillOpacity: cluster.opacity,
            weight:      1.5,
          }}
        >
          <Popup>
            <strong>{scoreToLabel(cluster.avgScore)}</strong>
            {cluster.reports.length > 1 && (
              <><br /><small>{cluster.reports.length} signalements</small></>
            )}
            <br />
            <small>{new Date(cluster.reports[0].created_at).toLocaleDateString('fr-FR')}</small>
          </Popup>
        </Circle>
      ))}

      {/* ── Données officielles ── */}
      {activeOfficial.map((ev) => {
        const t = EVENT_TYPES[ev.type] ?? EVENT_TYPES.information
        const icon = L.divIcon({
          className: '',
          html: `<div class="official-marker" style="background:${t.color}">${t.icon}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
        return (
          <Marker key={ev.id} position={[ev.latitude, ev.longitude]} icon={icon}>
            <Circle
              center={[ev.latitude, ev.longitude]}
              radius={ev.radius ?? 500}
              pathOptions={{
                color: t.color, fillColor: t.color,
                fillOpacity: 0.08, weight: 1.5, dashArray: '6,4',
              }}
            />
            <Popup>
              <strong>{t.icon} {t.label}</strong><br />
              {ev.title}<br />
              {ev.description && <><small>{ev.description}</small><br /></>}
              {ev.source_name && (
                <small>
                  Source :{' '}
                  {ev.source_url
                    ? <a href={ev.source_url} target="_blank" rel="noopener noreferrer">{ev.source_name}</a>
                    : ev.source_name}
                </small>
              )}
              <br />
              <small>{ev.start_date}{ev.end_date ? ` → ${ev.end_date}` : ''}</small>
            </Popup>
          </Marker>
        )
      })}

      {/* ── Mosquito Alert (observations Europe validées) ── */}
      {showOfficial && mosquitoAlertData.map((obs) => (
        <Marker key={obs.id} position={[obs.lat, obs.lon]} icon={maIcon}>
          <Popup>
            <strong>🦟 Moustique tigre observé</strong><br />
            <small>{obs.city}</small><br />
            <small>📅 {obs.date}</small><br />
            {obs.photoUrl && (
              <><img src={obs.photoUrl} alt="Photo" style={{ width: 120, borderRadius: 6, marginTop: 4 }} /><br /></>
            )}
            <small style={{ color: '#6b7280' }}>
              Source :{' '}
              <a href="https://www.mosquitoalert.com" target="_blank" rel="noopener noreferrer">
                Mosquito Alert
              </a>
            </small>
          </Popup>
        </Marker>
      ))}

      <LocationTracker position={position} />
      <PlanController planResult={planResult} />
    </MapContainer>
  )
}
