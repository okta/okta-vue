import Vue from 'vue';
import VueRouter from 'vue-router';
import { LoginCallback } from '@okta/okta-vue';
import Protected from '@/components/Protected.vue';
import SessionTokenLogin from '@/components/SessionTokenLogin.vue';

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes: [
    { path: '/login/callback', component: LoginCallback },
    { path: '/protected', component: Protected, meta: { requiresAuth: true } },
    { path: '/sessionToken', component: SessionTokenLogin }
  ]
});

export default router;
