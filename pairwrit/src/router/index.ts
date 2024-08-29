import { createRouter, createWebHistory } from 'vue-router';

const DocumentEditor = () => import('../components/DocumentEditor.vue');

const routes = [
  {
    path: '/',
    name: 'PairWrit',
    component: DocumentEditor
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;