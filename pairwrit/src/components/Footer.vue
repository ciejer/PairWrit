<template>
    <footer class="bg-gray-800 text-white p-4 mt-auto">
      <p>&copy; 2024 PairWrit. All rights reserved.</p>
    </footer>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'Footer'
  });
  </script>
  
  <style scoped>
  footer {
    background-color: #1f2937;
    color: white;
  }
  </style><template>
  <footer class="bg-gray-800 text-white p-4 mt-8 shadow-inner">
    <div class="container mx-auto text-center">
      <p>&copy; 2024 My Application. All rights reserved.</p>
      <div class="flex justify-center space-x-4 mt-2">
        <a href="#" class="hover:text-gray-400">Privacy Policy</a>
        <a href="#" class="hover:text-gray-400">Terms of Service</a>
      </div>
    </div>
  </footer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped>
</style>
