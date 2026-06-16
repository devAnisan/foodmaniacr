import { createApp } from "vue";
import "./style.css";
import App from "./views/App.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import router from "./router";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);

app.config.errorHandler = (err, instance, info) => {
  console.error("Error no capturado:", err)
}

app.mount("#app");
