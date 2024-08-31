import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './index.css'; // Import Tailwind CSS
import './output.css'; // Import Tailwind CSS

const app = createApp(App);

app.use(router);
app.use(store);

router.isReady().then(() => {
  app.mount('#app');
});
