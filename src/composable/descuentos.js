// Las promociones ya traen su propio descuento incluido en el precio — nunca
// se les aplica el % de descuento global encima, para no descontarlas dos veces.
export const esPromocion = (item) => item?._coleccionOrigen === 'promociones'

export const precioItemConDescuento = (item, descuentoGlobal) => {
  const precio = Number(item?.precio) || 0
  if (descuentoGlobal?.activo) return precio
  const descuento = Number(item?.descuento) || 0
  if (descuento <= 0) return precio
  return Math.round(precio * (1 - descuento / 100))
}

export const aplicarDescuentoGlobal = (monto, descuentoGlobal) => {
  if (!descuentoGlobal?.activo) return monto
  const porcentaje = Number(descuentoGlobal.porcentaje) || 0
  if (porcentaje <= 0) return monto
  return Math.round(monto * (1 - porcentaje / 100))
}
