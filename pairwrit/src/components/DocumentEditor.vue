<template>
  <div class="p-4">
    <textarea 
      v-model="localDocumentContent" 
      @input="saveDocument" 
      class="w-full h-64 p-2 border rounded"
    ></textarea>
    <button 
      @click="generateContent" 
      class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
    >
      Generate Content
    </button>
    <div v-if="loading" class="mt-2 text-blue-500">Generating content...</div>
    <div v-if="error" class="mt-2 text-red-500">{{ error }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'vuex';
import axios from 'axios';

export default defineComponent({
  data() {
    return {
      localDocumentContent: '',
      loading: false,
      error: ''
    };
  },
  computed: {
    ...mapState(['documentContent'])
  },
  methods: {
    ...mapActions(['saveDocument', 'loadDocument']),
    async generateContent() {
      if (!this.localDocumentContent) {
        this.error = 'Document content is empty';
        return;
      }
      this.loading = true;
      this.error = ''; // Clear previous errors
      const prompt = encodeURIComponent(this.localDocumentContent);
      try {
        const response = await axios.get(`http://localhost:3000/api/generate?prompt=${prompt}`);
        this.localDocumentContent += response.data.content;
        this.$store.commit('setDocumentContent', this.localDocumentContent);
        this.saveDocument();
      } catch (error) {
        console.error('Error generating content:', error);
        this.error = 'Failed to generate content. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    saveDocument() {
      this.$store.commit('setDocumentContent', this.localDocumentContent);
      this.$store.dispatch('saveDocument');
    }
  },
  mounted() {
    this.loadDocument();
    this.localDocumentContent = this.documentContent;
  }
});
</script>

<style scoped>
textarea {
  width: 100%;
  height: 300px;
}
</style>