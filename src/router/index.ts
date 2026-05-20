import { createRouter, createWebHashHistory } from 'vue-router';

import CreateEventView from '@/views/CreateEventView.vue';
import EventView from '@/views/EventView.vue';
import EventsView from '@/views/EventsView.vue';
import HomeView from '@/views/HomeView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import ProfileView from '@/views/ProfileView.vue';

export const router = createRouter({
  history: createWebHashHistory(),

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
      path: '/events',
      name: 'events',
      component: EventsView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/event/:id/edit',
      name: 'edit-event',
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
});
