export const esPromocionActiva = (nombreProducto) => {
  const hoy = new Date().getDay()

  const reglas = {
    '2X1 Tacos':        hoy === 2, // Martes
    '2X1 Nachos':       hoy === 1, // Lunes
    '2 Enteros':        true,       // Todos los días
    'Jueves de Alitas': hoy === 4, // Jueves
    '3X2 Enteros':      hoy === 3, // Miércoles
  }

  return reglas[nombreProducto] ?? false
}

export const diaPromocion = (nombreProducto) => {
  const dias = {
    '2X1 Tacos':        'Solo los martes',
    '2X1 Nachos':       'Solo los lunes',
    '2 Enteros':        'Todos los días',
    'Jueves de Alitas': 'Solo los jueves',
    '3X2 Enteros':      'Solo los miércoles',
  }
  return dias[nombreProducto] ?? ''
}
