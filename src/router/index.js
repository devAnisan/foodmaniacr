import { createRouter, createWebHistory } from "vue-router";
import MainComponent from "../components/MainComponent.vue";
import NotFound from "../components/NotFound.vue";

const routes = [
  { path: "/", component: MainComponent, meta: { title: "Foodmania CR | Tu antojo, nuestra especialidad", description: "Pedí hamburguesas, pollo frito, alas, tacos y más. Delivery y retiro en sucursal." } },
  { path: "/menu", component: () => import("../components/MenuFoodmania.vue"), meta: { title: "Menú | Foodmania CR", description: "Explorá nuestro menú: hamburguesas, pollo frito, combos, alitas, tacos y bebidas." } },
  { path: "/adminControl", component: () => import("../components/AdminControl.vue"), meta: { title: "Admin | Foodmania CR", description: "Panel de administración de Foodmania CR." } },
  { path: "/:pathMatch(.*)*", component: NotFound, meta: { title: "Página no encontrada | Foodmania CR", description: "La página que buscas no existe." } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  document.title = to.meta.title || "Foodmania CR | Tu antojo, nuestra especialidad"
  const description = to.meta.description
  if (description) {
    let meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
  }
})

export default router;
