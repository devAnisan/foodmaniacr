# FoodManiaCR

Plataforma web de pedidos para FoodMania Costa Rica. Construida con Vue 3 + Vite + Firebase.

## Características

- Menú interactivo con categorías (Comida China, Rápida, Hamburguesas, Pollo Frito, Promociones, Supremos, Surtidos, Bebidas)
- Personalizador de productos (bebida, papas con salsa, salsas para alitas)
- Carrito de compras con precios dinámicos
- Autenticación por SMS (verificación de código + perfil)
- Checkout con cálculo de envío por distancia
- **Sistema ManiaCoins 🪙**: programa de fidelidad

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
- **createOrder**: crea el pedido en Firestore, actualiza `ultimaCompra`, calcula y asigna puntos, duplica en primera compra, marca `primeraCompra: false`

### Reglas Firestore
- Lectura pública para colecciones del menú (`comidachina`, `hamburguesas`, etc.)
- Escritura de pedidos solo para usuarios autenticados (validate propio UID)
- Admin puede actualizar solo: `puntos`, `ultimaCompra`, `ultimaGananciaCoins`

## Estructura del proyecto

```
src/
├── components/
│   ├── MenuFoodmania.vue       # Menú principal, categorías, ProductCard, personalizador
│   ├── Checkoutmodal.vue        # Checkout, canje, resumen, mapa
│   ├── AdminControl.vue         # Panel admin (otorgar puntos)
│   ├── Footer.vue
│   └── EditProfileModal.vue
├── composable/
│   ├── useAuth.js               # Auth con SMS, registro, perfil
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
├── index.js                     # Cloud Functions (createOrder)
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
