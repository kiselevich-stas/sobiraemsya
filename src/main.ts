import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import { router } from '@/router';
import { useEventsStore } from '@/stores/events.store';
import '@/assets/styles/main.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

useEventsStore(pinia).hydrate();

app.mount('#app');
