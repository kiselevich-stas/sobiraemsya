import { createRouter, createWebHistory } from 'vue-router';
import CreateEventView from '@/views/CreateEventView.vue';
import EventView from '@/views/EventView.vue';
import HomeView from '@/views/HomeView.vue';
import NotFoundView from '@/views/NotFoundView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/create',
      name: 'create-event',
      component: CreateEventView,
    },
    {
      path: '/event/:id',
      name: 'event',
      component: EventView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});
