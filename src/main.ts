import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/App.vue';
import { router } from '@/router';
import { useEventsStore } from '@/stores/events.store';
import {
    getTelegramStartPayload,
    isTelegramLaunchUrl,
} from '@/utils/telegramStartParam';

import '@/assets/styles/main.scss';

const initialTelegramPayload = getTelegramStartPayload();
const initialIsTelegramLaunchUrl = isTelegramLaunchUrl();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

useEventsStore(pinia).hydrate();

router.isReady().then(() => {
    if (initialTelegramPayload?.type === 'event') {
        router.replace({
            name: 'event',
            params: {
                id: initialTelegramPayload.id,
            },
        });

        return;
    }

    if (initialTelegramPayload?.type === 'session') {
        router.replace({
            name: 'home',
            query: {
                sessionId: initialTelegramPayload.id,
            },
        });

        return;
    }

    if (initialIsTelegramLaunchUrl || router.currentRoute.value.name === 'not-found') {
        router.replace({
            name: 'home',
        });
    }
});

app.mount('#app');