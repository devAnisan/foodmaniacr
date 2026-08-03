const MS_DIA = 24 * 60 * 60 * 1000
const OFFSET_CR_MS = 6 * 60 * 60 * 1000

function fechaLocalCR(fecha) {
  return new Date(fecha.getTime() - OFFSET_CR_MS)
}

function formatearFecha(fechaUTC) {
  const y = fechaUTC.getUTCFullYear()
  const m = String(fechaUTC.getUTCMonth() + 1).padStart(2, '0')
  const d = String(fechaUTC.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function soloFechaUTC(fecha) {
  const crDate = fechaLocalCR(fecha)
  return new Date(Date.UTC(crDate.getUTCFullYear(), crDate.getUTCMonth(), crDate.getUTCDate()))
}

function lunesDeLaSemana(fechaUTC) {
  const diaSemana = fechaUTC.getUTCDay() || 7 // domingo (0) → 7, para que lunes sea 1
  const lunes = new Date(fechaUTC)
  lunes.setUTCDate(lunes.getUTCDate() - diaSemana + 1)
  return lunes
}

function fechaVentaCR(fecha = new Date()) {
  return formatearFecha(fechaLocalCR(fecha))
}

function inicioSemanaCR(fecha = new Date()) {
  return formatearFecha(lunesDeLaSemana(soloFechaUTC(fecha)))
}

function diasDeSemanaCR(fecha = new Date()) {
  const lunes = lunesDeLaSemana(soloFechaUTC(fecha))
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(lunes)
    dia.setUTCDate(dia.getUTCDate() + i)
    return formatearFecha(dia)
  })
}

function semanaIdCR(fecha = new Date()) {
  const jueves = lunesDeLaSemana(soloFechaUTC(fecha))
  jueves.setUTCDate(jueves.getUTCDate() + 3) // jueves ISO de esa semana, determina el año de la semana
  const inicioAno = new Date(Date.UTC(jueves.getUTCFullYear(), 0, 1))
  const numeroSemana = Math.ceil((((jueves - inicioAno) / MS_DIA) + 1) / 7)
  return `${jueves.getUTCFullYear()}-W${String(numeroSemana).padStart(2, '0')}`
}

module.exports = {
  fechaVentaCR,
  inicioSemanaCR,
  diasDeSemanaCR,
  semanaIdCR,
}
