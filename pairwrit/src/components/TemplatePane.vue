<template>
    <div>
      <select v-model="selectedTemplate" @change="applyTemplate">
        <option v-for="template in templates" :key="template.id" :value="template.content">
          {{ template.name }}
        </option>
      </select>
      <textarea v-model="documentContent" @input="saveDocument"></textarea>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { mapActions } from 'vuex';
  
  export default defineComponent({
    data() {
      return {
        documentContent: '',
        selectedTemplate: '',
        templates: [
          { id: 1, name: 'Template 1', content: 'Template Content 1' },
          { id: 2, name: 'Template 2', content: 'Template Content 2' }
        ]
      };
    },
    methods: {
      ...mapActions(['saveDocument', 'loadDocument']),
      saveDocument() {
        this.saveDocument(this.documentContent);
      },
      applyTemplate() {
        this.documentContent = this.selectedTemplate;
        this.saveDocument();
      }
    }
  });
  </script>
  
  <style scoped>
  textarea {
    width: 100%;
    height: 300px;
  }
  </style>
