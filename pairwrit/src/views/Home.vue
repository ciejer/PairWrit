<template>
    <div>
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  
  export default defineComponent({
    name: 'Home'
  });
  </script>
  
  <style scoped>
  h1 {
    color: #42b983;
  }
  </style>