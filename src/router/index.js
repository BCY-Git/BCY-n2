import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('@/components/HelloWorld.vue') },
  { path: '/surroundings', component: () => import('@/views/Surroundings.vue') },
  { path: '/surroundings/pick', component: () => import('@/views/SurroundingsPick.vue') },
  { path: '/task', component: () => import('@/views/thinking.vue') },  
  { path: '/faBu', component: () => import('@/views/faBu.vue') },
  { path: '/image-annotator', component: () => import('@/views/ImageAnnotator/Index.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
