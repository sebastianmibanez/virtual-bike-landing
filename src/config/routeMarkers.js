export const routeMarkers = [
  { km: 0,    label: 'Salida',           type: 'start' },
  { km: 4.5,  label: 'Giro →',           type: 'giro' },
  { km: 12.0, label: 'Ruta 68',    num: '①', type: 'giro68' },
  { km: 15.6, label: 'Meta V.',     num: '①', type: 'mv' },
  { km: 26.3, label: 'Lo Echevers', num: '①', type: 'echevers' },
  { km: 40.2, label: 'Ruta 68',     num: '②', type: 'giro68' },
  { km: 42.9, label: 'Meta V.',     num: '②', type: 'mv' },
  { km: 54.3, label: 'Lo Echevers', num: '②', type: 'echevers' },
  { km: 69.0, label: 'Ruta 68',     num: '③', type: 'giro68' },
  { km: 72.4, label: 'Meta V.',     num: '③', type: 'mv' },
  { km: 83.0, label: 'Lo Echevers', num: '③', type: 'echevers' },
  { km: 92.0, label: '→ Alto Noviciado',  type: 'giro' },
  { km: 96.6, label: 'Recta final',       type: 'final' },
  { km: 98.3, label: 'Meta',             type: 'start' },
]

export const markerColors = {
  start: '#4ade80',
  giro: 'rgba(255,255,255,0.35)',
  giro68: '#60a5fa',
  mv: '#f97316',
  echevers: '#c084fc',
  final: '#ef4444',
}
