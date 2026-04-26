import { createRouter, createWebHistory } from "vue-router";
import MainComponent from "../components/MainComponent.vue";
import MenuFoodmania from "../components/MenuFoodmania.vue";

const routes = [
  { path: "/", component: MainComponent },
  { path: "/menu", component: MenuFoodmania },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
