import { createRouter, createWebHistory } from "vue-router";
import MainComponent from "../components/MainComponent.vue";
import MenuFoodmania from "../components/MenuFoodmania.vue";
import AdminControl from "../components/AdminControl.vue";
const routes = [
  { path: "/", component: MainComponent, meta: { title: "Foodmania CR | Tu antojo, nuestra especialidad", description: "Pedí hamburguesas, pollo frito, alas, tacos y más. Delivery y retiro en sucursal." } },
  { path: "/menu", component: MenuFoodmania, meta: { title: "Menú | Foodmania CR", description: "Explorá nuestro menú: hamburguesas, pollo frito, combos, alitas, tacos y bebidas." } },
  { path: "/adminControl", component: AdminControl, meta: { title: "Admin | Foodmania CR", description: "Panel de administración de Foodmania CR." } }
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
