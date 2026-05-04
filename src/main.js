import { createApp } from "vue";
import "./style.css";
import App from "./views/App.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import router from "./router";
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
createApp(App).use(pinia).use(router).mount("#app");
