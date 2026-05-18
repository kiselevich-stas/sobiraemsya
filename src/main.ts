import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/App.vue';
import { router } from '@/router';
import { useEventsStore } from '@/stores/events.store';
import {
    getTelegramStartParam,
    isTelegramLaunchUrl,
} from '@/utils/telegramStartParam';

import '@/assets/styles/main.scss';

const initialTelegramEventId = getTelegramStartParam();
const initialIsTelegramLaunchUrl = isTelegramLaunchUrl();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

useEventsStore(pinia).hydrate();

router.isReady().then(() => {
    if (initialTelegramEventId) {
        router.replace({
            name: 'event',
            params: {
                id: initialTelegramEventId,
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