<template>
  <div>
    <h1>{{ message }}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
  data() {
    return {
      message: ''
    };
  },
  mounted() {
    axios.get('http://localhost:3000/api/message')
      .then(response => {
        this.message = response.data.message;
      })
      .catch(error => {
        console.error('Error fetching message:', error);
      });
  }
});
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>