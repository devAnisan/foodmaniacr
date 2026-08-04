const NOMBRES_DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export const esPromocionActivaHoy = (diasActivos) => {
  if (!diasActivos || diasActivos.length === 0) return true
  return diasActivos.includes(new Date().getDay())
}

const pluralDia = (nombre) => nombre.endsWith('s') ? nombre : `${nombre}s`

export const descripcionDias = (diasActivos) => {
  if (!diasActivos || diasActivos.length === 0) return 'Todos los días'
  const nombres = [...diasActivos].sort((a, b) => a - b).map(d => NOMBRES_DIAS[d])
  if (nombres.length === 1) return `Solo los ${pluralDia(nombres[0])}`
  return `Solo ${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}
