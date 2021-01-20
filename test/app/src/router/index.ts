import { createRouter, createWebHistory } from 'vue-router'
import { LoginCallback, navigationGuard } from '@okta/okta-vue'
import Protected from '@/components/Protected.vue';
import SessionTokenLogin from '@/components/SessionTokenLogin.vue';

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    { path: '/implicit/callback', component: LoginCallback },
    { path: '/pkce/callback', component: LoginCallback },
    { path: '/protected', component: Protected, meta: { requiresAuth: true } },
    { path: '/sessionToken', component: SessionTokenLogin }
  ]
})

router.beforeEach(navigationGuard)

export default router
