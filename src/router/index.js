import { createRouter, createWebHistory } from "vue-router";
import MainComponent from "../components/MainComponent.vue";
import MenuFoodmania from "../components/MenuFoodmania.vue";
import AdminControl from "../components/AdminControl.vue";
const routes = [
  { path: "/", component: MainComponent },
  { path: "/menu", component: MenuFoodmania },
  { path: "/adminControl", component: AdminControl}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
