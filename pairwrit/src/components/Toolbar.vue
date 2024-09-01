<template>
  <div class="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
    <h1 class="text-lg font-bold">Document Editor</h1>
    <input 
      v-model="title"
      type="text" 
      placeholder="Enter title here" 
      class="px-4 py-2 mr-4 bg-white text-blue-600 rounded shadow"
    />
    <button
      @click="$emit('generateContent')" 
      class="px-4 py-2 bg-white text-blue-600 rounded shadow hover:bg-gray-100 transition duration-300"
    >
      Generate Content
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true
    }
  },
  emits: ['updateTitle', 'generateContent'],
  watch: {
    title(newTitle) {
      this.$emit('updateTitle', newTitle);
    }
  }
});
</script>

<style scoped>
</style>
