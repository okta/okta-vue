import { createRouter, createWebHistory } from 'vue-router'
import { LoginCallback, navigationGuard } from '@okta/okta-vue'
import Protected from '@/components/Protected.vue';
import Home from '@/components/Home.vue';
import SessionTokenLogin from '@/components/SessionTokenLogin.vue';

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    { path: '/', component: Home },
    { path: '/login/callback', component: LoginCallback },
    { path: '/protected', component: Protected, meta: { requiresAuth: true } },
    { path: '/sessionToken', component: SessionTokenLogin, props: { withRedirect: true } }
  ]
})

router.beforeEach(navigationGuard)

export default router
