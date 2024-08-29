<template>
  <div class="flex flex-col min-h-screen">
    <Header />
    <router-view class="flex-grow" />
    <Footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';

export default defineComponent({
  components: {
    Header,
    Footer
  }
});
</script>

<style scoped>
/* Add any global styles here */
</style>