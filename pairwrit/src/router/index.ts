import { createRouter, createWebHistory } from 'vue-router';
   import Home from '../views/Home.vue';
   import HelloWorld from '../components/HelloWorld.vue';
    import DocumentEditor from '../components/DocumentEditor.vue';

   const routes = [
     {
       path: '/',
       name: 'PairWrit',
       component: DocumentEditor
     },
     {
       path: '/hello',
       name: 'HelloWorld',
       component: HelloWorld
     }
   ];

   const router = createRouter({
     history: createWebHistory(process.env.BASE_URL),
     routes
   });

   export default router;