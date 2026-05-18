import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '@/App.vue';
import { router } from '@/router';
import { useEventsStore } from '@/stores/events.store';
import { getTelegramStartParam } from '@/utils/telegramStartParam';
import '@/assets/styles/main.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

useEventsStore(pinia).hydrate();

const telegramStartParam = getTelegramStartParam();

if (telegramStartParam) {
    router.replace({
        name: 'event',
        params: {
            id: telegramStartParam,
        },
    });
}

app.mount('#app');