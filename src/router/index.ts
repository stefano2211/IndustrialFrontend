import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'chat',
            component: ChatView,
            meta: { layout: 'main', requiresAuth: true }
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { layout: 'auth' }
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView,
            meta: { layout: 'auth' }
        }
    ],
})

// Auth guard
router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth && !token) {
        // Not authenticated → redirect to login
        next({ name: 'login' })
    } else if ((to.name === 'login' || to.name === 'register') && token) {
        // Already logged in → redirect to chat
        next({ name: 'chat' })
    } else {
        next()
    }
})

export default router
