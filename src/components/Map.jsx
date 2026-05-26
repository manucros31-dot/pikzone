import { useEffect, useMemo, useRef, useCallback } from 'react'
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

const PERIODE_LABEL = { matin: '🌅 Matin', aprem: '☀️ Après-midi', soir: '🌙 Soir' }

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
    const isDistant = c.reports.every(r => r.mode_signalement === 'distant')
    return { ...c, avgScore, color: scoreToColor(avgScore), opacity: OPACITY_BY_SCORE(avgScore), isDistant }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Affiche uniquement le marqueur GPS — sans recentrage automatique
function LocationMarker({ position }) {
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

// Gère : centrage initial, timer 5s auto-recenter, bouton recenter externe
function MapController({ position, onCenterChange, recenterRef }) {
  const map            = useMap()
  const initializedRef = useRef(false)
  const isProgrammatic = useRef(false)
  const positionRef    = useRef(position)

  // Garde positionRef à jour sans recréer les handlers
  useEffect(() => { positionRef.current = position }, [position])

  const flyToGPS = useCallback(() => {
    const pos = positionRef.current
    if (!pos) return
    isProgrammatic.current = true
    map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), 15), { duration: 1.5 })
  }, [map])

  // Expose flyToGPS au parent via ref
  useEffect(() => {
    if (recenterRef) recenterRef.current = flyToGPS
  }, [flyToGPS, recenterRef])

  // Centrage initial unique dès que le GPS est obtenu
  useEffect(() => {
    if (position && !initializedRef.current) {
      initializedRef.current = true
      isProgrammatic.current = true
      map.flyTo([position.lat, position.lng], 15, { duration: 1.5 })
    }
  }, [position, map])

  // Écoute les mouvements : notifie le centre au parent
  useEffect(() => {
    function onMoveEnd() {
      const c = map.getCenter()
      onCenterChange({ lat: c.lat, lng: c.lng })

      if (isProgrammatic.current) {
        isProgrammatic.current = false
      }
    }

    map.on('moveend', onMoveEnd)
    return () => { map.off('moveend', onMoveEnd) }
  }, [map, onCenterChange])

  return null
}

function PlanController({ planResult }) {
  const map = useMap()
  useEffect(() => {
    if (planResult) map.flyTo([planResult.lat, planResult.lng], 15, { duration: 1.2 })
  }, [planResult, map])
  return null
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export default function Map({ reports, position, planResult, officialEvents = [], showOfficial = false, mosquitoAlertData = [], onCenterChange, recenterRef }) {
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
      {clusters.map((cluster, i) => {
        const r0 = cluster.reports[0]
        const dateStr = r0.date_signalement
          ? new Date(r0.date_signalement + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : new Date(r0.created_at).toLocaleDateString('fr-FR')
        return (
          <Circle
            key={i}
            center={[cluster.lat, cluster.lng]}
            radius={50}
            pathOptions={{
              color:       cluster.color,
              fillColor:   cluster.color,
              fillOpacity: cluster.opacity,
              weight:      cluster.isDistant ? 1.5 : 1.5,
              dashArray:   cluster.isDistant ? '5,4' : undefined,
            }}
          >
            <Popup>
              <strong>{scoreToLabel(cluster.avgScore)}</strong>
              {cluster.reports.length > 1 && (
                <><br /><small>{cluster.reports.length} signalements</small></>
              )}
              <br />
              <small>📅 {dateStr}</small>
              {r0.periode && <><br /><small>{PERIODE_LABEL[r0.periode] ?? r0.periode}</small></>}
              {r0.mode_signalement && (
                <><br /><small>{r0.mode_signalement === 'distant' ? '📍 Distant' : '🎯 Sur place'}</small></>
              )}
            </Popup>
          </Circle>
        )
      })}

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

      <LocationMarker position={position} />
      <MapController position={position} onCenterChange={onCenterChange} recenterRef={recenterRef} />
      <PlanController planResult={planResult} />
    </MapContainer>
  )
}
