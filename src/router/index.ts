import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import WorkspaceLayout from '../views/workspace/WorkspaceLayout.vue'
import KnowledgeListView from '../views/workspace/KnowledgeListView.vue'
import KnowledgeDetailView from '../views/workspace/KnowledgeDetailView.vue'
import PromptsView from '../views/workspace/PromptsView.vue'
import ModelsView from '../views/workspace/ModelsView.vue'
import ToolsView from '../views/workspace/ToolsView.vue'
import DatabasesView from '../views/workspace/DatabasesView.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import UsersView from '../views/admin/UsersView.vue'
import AnalyticsView from '../views/admin/AnalyticsView.vue'
import SettingsView from '../views/admin/SettingsView.vue'
import EventsView from '../views/EventsView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView,
            meta: { layout: 'auth' }
        },
        {
            path: '/chat',
            name: 'chat',
            component: ChatView,
            meta: { layout: 'main', requiresAuth: true }
        },
        {
            path: '/events',
            name: 'events',
            component: EventsView,
            meta: { layout: 'main', requiresAuth: true }
        },
        {
            path: '/workspace',
            component: WorkspaceLayout,
            meta: { layout: 'main', requiresAuth: true },
            redirect: '/workspace/models',
            children: [
                {
                    path: 'knowledge',
                    name: 'knowledge-list',
                    component: KnowledgeListView
                },
                {
                    path: 'knowledge/:id',
                    name: 'knowledge-detail',
                    component: KnowledgeDetailView,
                    props: true
                },
                {
                    path: 'prompts',
                    name: 'prompts-list',
                    component: PromptsView
                },
                {
                    path: 'models',
                    name: 'models-list',
                    component: ModelsView
                },
                {
                    path: 'databases',
                    name: 'workspace-databases',
                    component: DatabasesView
                },
                {
                    path: 'tools',
                    name: 'workspace-tools',
                    component: ToolsView
                }
            ]
        },
        {
            path: '/admin',
            component: AdminLayout,
            meta: { layout: 'main', requiresAuth: true },
            redirect: '/admin/users',
            children: [
                {
                    path: 'users',
                    name: 'admin-users',
                    component: UsersView
                },
                {
                    path: 'analytics',
                    name: 'admin-analytics',
                    component: AnalyticsView
                },
                {
                    path: 'settings',
                    name: 'admin-settings',
                    component: SettingsView
                }
            ]
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
    } else if ((to.name === 'login' || to.name === 'register' || to.name === 'home') && token) {
        // Already logged in → redirect to chat
        next({ name: 'chat' })
    } else {
        next()
    }
})

export default router
