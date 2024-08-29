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
  </style>