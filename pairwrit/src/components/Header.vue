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
  </style><template>
  <header class="bg-gray-800 text-white p-4 shadow-md">
    <div class="container mx-auto flex justify-between items-center">
      <h1 class="text-2xl font-bold">My Application</h1>
      <nav>
        <ul class="flex space-x-4">
          <li><a href="#" class="hover:text-gray-400">Home</a></li>
          <li><a href="#" class="hover:text-gray-400">About</a></li>
          <li><a href="#" class="hover:text-gray-400">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped>
</style>
