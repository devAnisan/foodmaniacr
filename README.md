# Foodmania CR

Aplicación web progresiva (PWA) para pedidos de comida — hamburguesas, pollo frito, alitas, tacos y más. Delivery y retiro en sucursal.

## Tecnologías

- **Vue 3** + Composition API + `<script setup>`
- **Vue Router** con lazy loading
- **Pinia** + persistencia (localStorage)
- **Tailwind CSS v4** + Vite
- **Firebase** (Auth, Firestore, Storage, Functions, Messaging)
- **PWA** con Service Worker + manifest

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualizar build local |
| `npm test` | Correr tests (Vitest) |

## Variables de entorno

Crear un archivo `.env` en la raíz con las credenciales de Firebase:

```
VITE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_MESSAGING_SENDER_ID=
VITE_APP_ID=
VITE_VAPID_KEY=
```

## Estructura

```
src/
├── composable/       # Lógica reutilizable (auth, notificaciones, distancia)
├── components/       # Componentes Vue
│   ├── MainComponent.vue      # Landing principal
│   ├── MenuFoodmania.vue      # Menú / pedidos (lazy)
│   ├── AdminControl.vue       # Panel admin (lazy)
│   ├── Checkoutmodal.vue      # Modal de checkout
│   ├── NotFound.vue           # Página 404
│   └── ...
├── stores/           # Pinia stores
├── router/           # Configuración de rutas
├── utils/            # Utilidades (formateo, cumpleaños)
├── views/            # Layout raíz
├── firebase.js       # Config Firebase
├── main.js           # Entry point + error handler global
└── style.css         # Tailwind + fuentes + variables CSS
```

## Funcionalidades

- Catálogo de productos con categorías, personalización (salsas, ingredientes, frescos)
- Carrito de compras con persistencia local
- Checkout con cálculo de envío y ManiaCoins
- Autenticación (email/contraseña) + verificación por código
- Programa de fidelidad ManiaCoins (doble puntos los martes)
- Sucursales con geolocalización de la más cercana
- Dónde comprar (enlaces a Uber Eats, PedidosYa, etc.)
- Notificaciones push (Firebase Cloud Messaging)
- PWA instalable
