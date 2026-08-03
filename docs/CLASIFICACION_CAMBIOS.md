# Clasificación de solicitudes de cambio — Foodmania CR

Marco de referencia para analizar cada solicitud de cambio del cliente/negocio y determinar si
corresponde a una **corrección (fix)**, una **mejora (feature)** o una **funcionalidad nueva**, y si
implica cobro adicional. Ver el detalle completo, con ejemplos e inventario funcional, en
`docs/informe-foodmania-cr.pdf`.

## Las tres categorías

### Corrección (Fix)
Una funcionalidad ya entregada no se comporta según lo originalmente definido y aceptado. Es un
defecto del desarrollo, no un cambio de alcance.

- Ejemplos: un botón que no responde, un cálculo que da un monto incorrecto, un dato que no se
  guarda en la base de datos.
- **Cobro: no genera cobro adicional.**

### Mejora (Feature)
Una funcionalidad existente funciona correctamente, pero se decide ajustarla, extenderla o pulirla
luego de verla en uso, sin construir un módulo nuevo.

- Ejemplos: cambiar un texto/color/espaciado, agregar un campo a un formulario ya existente, ajustar
  una regla de negocio dentro de un flujo actual.
- **Cobro: depende del alcance y tiempo invertido — se evalúa caso por caso.**

### Funcionalidad nueva
Se construye un módulo, flujo o capacidad que no existe en el sistema, con lógica de negocio y/o
estructuras de datos propias.

- Ejemplos: sistema de cupones, integración con pasarela de pago con tarjeta, módulo de reportes,
  programa de referidos.
- **Cobro: sí se cobra aparte, como desarrollo adicional al alcance original.**

## Criterio rápido

| Pregunta guía | Fix | Feature | Funcionalidad nueva |
|---|---|---|---|
| ¿Lo entregado hace hoy lo que se pactó originalmente? | No — está fallando | Sí | No aplica, no existe |
| ¿Es una extensión de algo que ya existe? | No aplica | Sí | No |
| ¿Requiere colecciones/estructuras de datos nuevas? | No | Rara vez | Frecuentemente |
| ¿Genera cobro adicional? | No | Depende del alcance | Sí |

## Proceso a seguir ante cada solicitud

1. Identificar la funcionalidad existente (o su ausencia) involucrada, usando el inventario del PDF
   como línea base.
2. Determinar la categoría: corrección, mejora o funcionalidad nueva.
3. Comunicar la clasificación y su implicación de costo **antes** de iniciar el desarrollo.
4. Dejar constancia de la solicitud y su clasificación para referencia futura.

## Fuera de alcance

El panel de **Super Administración** (`SuperAdminControl.vue`) es una herramienta de uso exclusivo
del desarrollador para administrar el catálogo. No es parte del producto entregado al negocio, por lo
que las solicitudes sobre ese panel no se rigen por este marco de clasificación ni por cobro al
cliente.

## Inventario funcional resumido (línea base para comparar "¿esto ya existe?")

- Catálogo por categorías con búsqueda y personalización de producto (talla, bebida, proteína,
  gaseosa, salsas, papas, agrandado).
- Carrito y checkout: datos del cliente, retiro en sucursal o domicilio, tarifa por distancia GPS,
  pago en efectivo o SINPE, comentarios del cliente, envío por WhatsApp, correo de confirmación.
- Programa de fidelización ManiaCoins: niveles, canje, día doble, bono de cumpleaños, doble en
  primera compra, vencimiento a 6 meses.
- Promociones por día de la semana y promo de lanzamiento (papas gratis primeros 100 pedidos).
- Autenticación de cliente: registro con verificación por código, recuperación de contraseña,
  edición de perfil.
- Panel de administración de sucursal: pedidos en tiempo real, cambio de estado, impresión de
  ticket térmico, notificaciones push por nivel, auditoría de cambios de estado.
- PWA con notificaciones push y banner promocional de días dobles.
- Landing page, sucursales y puntos de venta externos.

*Última actualización: 2 de agosto de 2026, sobre la versión 1.8.2 del proyecto. Si el proyecto
avanza significativamente, este resumen debe actualizarse para seguir siendo una línea base válida.*
