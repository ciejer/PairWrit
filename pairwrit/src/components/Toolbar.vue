<template>
  <div class="bg-blue-500 text-white p-4 flex justify-between items-center">
    <h1 class="text-lg font-bold">Document Editor</h1>
    <button 
      @click="$emit('generateContent')" 
      class="px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-200"
    >
      Generate Content
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped>
</style>
