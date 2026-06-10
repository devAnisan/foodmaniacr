# FoodManiaCR

Plataforma web de pedidos para FoodMania Costa Rica. Construida con Vue 3 + Vite + Firebase.

## Características

- Menú interactivo con categorías (Comida China, Rápida, Hamburguesas, Pollo Frito, Promociones, Supremos, Surtidos, Bebidas)
- Personalizador de productos (bebida, papas con salsa, salsas para alitas)
- Carrito de compras con precios dinámicos
- Autenticación por SMS con verificación de código + perfil
- Checkout con cálculo de envío por distancia y confirmación por email (Brevo SMTP)
- **Sistema ManiaCoins 🪙**: programa de fidelidad
- **Panel admin en tiempo real** con notificación sonora de nuevas órdenes

## Sistema ManiaCoins

### Acumulación
- 1 🪙 por cada ₡100 gastados
- Primera compra: puntos duplicados (campo `primeraCompra` en Firestore)
- Se calcula sobre `precio * cantidad` de ítems de pago (excluye canje)

### Niveles
| Nivel | 🪙 Requeridos | Mantenimiento |
|-------|---------------|---------------|
| Rookie | 0+ | Siempre activo |
| Maniatico | 1000+ | 30 días sin comprar → Rookie |
| Supremo | 2000+ | 15 días sin comprar → Rookie |
| Rey FoodMania | 3000+ | 7 días sin comprar → Rookie |

El nivel se mantiene si hay una compra dentro del plazo. La fecha de `ultimaCompra` se actualiza desde la cloud function `createOrder`.

### Canje
- Categoría virtual **"Canjear 🪙"**: muestra productos de cualquier colección con `ValidoParaCambio === true` y `puntosCanje > 0`
- También se puede canjear 🪙 por bebidas y agrandar papas desde el checkout (toggle por ítem)
- Para canjear 🪙, el cliente debe incluir al menos un ítem de pago en efectivo
- Productos sin `precio` (solo canje) se ocultan de su categoría original

### Expiración
- Los 🪙 expiran a los 6 meses desde `ultimaGananciaCoins`
- Si `ultimaGanaanciaCoins` es null (usuarios antiguos), se consideran válidos

### Cloud Functions

| Función | Descripción |
|---------|-------------|
| **createOrder** | Crea el pedido en Firestore, envía email de confirmación (Brevo SMTP), actualiza `ultimaCompra`, calcula y asigna ManiaCoins, duplica en primera compra |
| **sendVerificationCode** | Envía código de 6 dígitos al correo para verificar cuenta |
| **verifyCode** | Valida el código ingresado y marca `emailVerified: true` en Firebase Auth |
| **calculateOrderTotals** | Calcula totales del pedido (subtotal, envío, extras, puntos) |

### Email (Brevo SMTP)
- Host: `smtp-relay.brevo.com:587` (STARTTLS)
- Credenciales almacenadas en Firebase Secret Manager (`FUNCTIONS_CONFIG_EXPORT`)
- Correos: `pedidos@foodmania.cr` — verificación de cuenta y confirmación de pedido

### Reglas Firestore
- Lectura pública para colecciones del menú (`comidachina`, `hamburguesas`, etc.)
- Escritura de pedidos solo para usuarios autenticados (validate propio UID)
- Admin puede actualizar solo: `puntos`, `ultimaCompra`, `ultimaGananciaCoins`

## Estructura del proyecto

```
src/
├── components/
│   ├── MenuFoodmania.vue       # Menú principal, categorías, ProductCard, personalizador
│   ├── Checkoutmodal.vue       # Checkout, canje, resumen, mapa, WhatsApp + email
│   ├── AdminControl.vue        # Panel admin en tiempo real con notificación sonora
│   ├── Footer.vue
│   └── EditProfileModal.vue
├── composable/
│   ├── useAuth.js               # Auth con verificación por código + perfil
│   ├── promociones.js           # Lógica de promociones activas
│   └── saberDistancia.ts        # Cálculo de distancia y envío
├── stores/
│   └── cartStores.js            # Pinia store del carrito
├── utils/
│   ├── maniacoins.js            # Lógica de niveles, costos, expiración
│   └── __tests__/
│       └── maniacoins.test.js   # 53 tests
└── firebase.js                  # Configuración Firebase
functions/
├── index.js                     # Cloud Functions (createOrder, verifyCode, etc.)
├── calculos.js                  # Lógica de cálculos del pedido
└── package.json
firestore.rules                  # Reglas de seguridad
```

## Desarrollo

```bash
npm install
npm run dev      # Servidor local
npm run build    # Build producción
npm test         # Tests (Vitest)
```

## Despliegue

```bash
# Firebase
firebase deploy --only functions:createOrder
firebase deploy --only firestore:rules
firebase deploy --only hosting

# Build manual
npm run build
```

## Panel de Administración

### Órdenes en Tiempo Real
El panel (`AdminControl.vue`) usa Firestore `onSnapshot` para escuchar cambios en la colección `pedidos` en tiempo real. Las órdenes se filtran por sucursal asignada al admin.

### Notificación Sonora
Cuando llega una orden nueva en estado `pendiente` para la sucursal del admin, se reproduce un pitido de alerta usando la Web Audio API (no requiere archivos externos). En la carga inicial no suena — solo detecta órdenes posteriores.

### Historial de Versiones
- **v1.0.0** — Email transaccional con Brevo SMTP, verificación automática de email, notificación sonora en panel admin
