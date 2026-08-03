# Foodmania CR — Instrucciones del proyecto

## Clasificación de solicitudes de cambio (fix / feature / funcionalidad nueva)

Antes de implementar cualquier solicitud de cambio sobre este proyecto, clasificarla según el marco
definido en `docs/CLASIFICACION_CAMBIOS.md` (detalle completo con ejemplos en
`docs/informe-foodmania-cr.pdf`):

- **Fix** — algo que ya existe no funciona según lo pactado originalmente. No se cobra.
- **Feature** — ajuste, extensión o mejora sobre algo que ya existe y funciona. El cobro depende del
  alcance, se evalúa caso por caso.
- **Funcionalidad nueva** — se construye un módulo/flujo que no existe en el sistema. Se cobra
  aparte, como desarrollo adicional.

Al recibir una solicitud:

1. Verificar si la funcionalidad ya existe en el proyecto (revisar el código actual y, si hace
   falta, el inventario en `docs/CLASIFICACION_CAMBIOS.md`) antes de asumir la categoría.
2. Determinar la clasificación: Fix, Feature o Funcionalidad nueva.
3. Decírselo al usuario explícitamente antes de empezar a programar (por ejemplo: "esto sería un
   Feature porque ya existe el flujo de X y solo se está ajustando Y").
4. Si hay duda razonable entre dos categorías, decirlo explícitamente en vez de asumir una.

**Excepción:** el panel de Super Administración (`SuperAdminControl.vue`) es una herramienta de uso
exclusivo del desarrollador, no forma parte del producto entregado al negocio. Los cambios ahí no se
clasifican ni se cobran bajo este marco.
