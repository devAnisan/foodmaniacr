<template>
  <Teleport to="head">
    <title>Página no encontrada | Foodmania CR</title>
    <meta name="description" content="La página que buscas no existe." />
  </Teleport>
  <section class="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gradient-to-b from-white to-purple-50">
    <span class="text-8xl mb-4">🍔</span>
    <h1 class="heading-font text-5xl md:text-6xl text-[var(--primary)] mb-4">404</h1>
    <p class="text-xl text-gray-600 mb-2">¡Ups! Esta página no está en el menú</p>
    <p class="text-gray-500 mb-8 max-w-md">Parece que te desviaste... probablemente esa dirección no existe o fue movida.</p>
    <RouterLink to="/"
      class="bg-[var(--primary)] text-white font-bold px-8 py-3 rounded-full hover:bg-[var(--primary-dark)] transition-colors shadow-lg hover:shadow-xl">
      Volver al inicio
    </RouterLink>
  </section>
</template>
