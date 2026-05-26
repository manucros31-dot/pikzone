export const NIVEAU_SCORE = { infeste: 3, beaucoup: 2, peu: 1, aucun: 0 }

export function haversineM(lat1, lon1, lat2, lon2) {
  const R  = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Retourne un Set des numéros de mois (1-12) couverts par la plage
export function getMonthsForRange(startDate, endDate) {
  const months = new Set()
  const cur = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate   + 'T00:00:00')
  cur.setDate(1)
  end.setDate(1)
  while (cur <= end) {
    months.add(cur.getMonth() + 1)
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

export function scoreToLabel(score) {
  if (score >= 2.5) return 'Infesté'
  if (score >= 1.5) return 'Beaucoup'
  if (score >= 0.5) return 'Peu'
  return 'Aucun'
}

export function getPeriode() {
  const h = new Date().getHours()
  if (h >= 5 && h < 13) return 'matin'
  if (h >= 13 && h < 18) return 'aprem'
  return 'soir'
}

export function scoreToColor(score) {
  const stops = [
    { s: 0, rgb: [59,  109, 17]  },
    { s: 1, rgb: [99,  153, 34]  },
    { s: 2, rgb: [186, 117, 23]  },
    { s: 3, rgb: [163, 45,  45]  },
  ]
  const clamped = Math.max(0, Math.min(3, score))
  const lo = Math.floor(clamped)
  const hi = Math.min(3, lo + 1)
  const t  = clamped - lo
  const a  = stops[lo].rgb
  const b  = stops[hi].rgb
  const r  = Math.round(a[0] + t * (b[0] - a[0]))
  const g  = Math.round(a[1] + t * (b[1] - a[1]))
  const bl = Math.round(a[2] + t * (b[2] - a[2]))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`
}
