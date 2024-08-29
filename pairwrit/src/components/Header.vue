<template>
    <header class="bg-blue-500 text-white p-4">
      <h1 class="text-2xl">PairWrit</h1>
    </header>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'Header'
  });
  </script>
  
  <style scoped>
  header {
    background-color: #1e3a8a;
    color: white;
  }
  </style>