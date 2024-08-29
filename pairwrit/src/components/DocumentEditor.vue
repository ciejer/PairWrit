<template>
  <div class="p-4">
    <div 
      contenteditable="true" 
      @keydown.space="handleSpacebar"
      @input="updateTextContent"
      class="editable-text p-2 border rounded"
    >
      <span v-for="(chunk, index) in textChunks" :key="index" :class="chunk.pinned ? 'text-black' : 'text-grey'">
        {{ chunk.text }}
      </span>
    </div>
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
import { defineComponent, nextTick } from 'vue';
import { mapState, mapActions } from 'vuex';
import axios from 'axios';

interface TextChunk {
  text: string;
  pinned: boolean;
}

export default defineComponent({
  data() {
    return {
      loading: false,
      error: '',
      textChunks: [] as TextChunk[],
      cursorPosition: { nodeIndex: 0, offset: 0 }
    };
  },
  computed: {
    ...mapState(['documentContent'])
  },
  methods: {
    ...mapActions(['saveDocument', 'loadDocument']),
    async generateContent() {
      const textContent = this.textChunks.map(chunk => chunk.text).join('');
      if (!textContent) {
        this.error = 'Document content is empty';
        return;
      }
      this.loading = true;
      this.error = '';
      const prompt = encodeURIComponent(textContent);
      try {
        const response = await axios.get(`http://localhost:3000/api/generate?prompt=${prompt}`);
        const generatedContent = response.data.content;
        this.textChunks = this.mergeGeneratedContent(this.textChunks, generatedContent);
        this.cleanupChunks();
        this.$store.commit('setDocumentContent', this.textChunks.map(chunk => chunk.text).join(''));
        this.saveDocument();
      } catch (error) {
        console.error('Error generating content:', error);
        this.error = 'Failed to generate content. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    saveDocument() {
      this.$store.commit('setDocumentContent', this.textChunks.map(chunk => chunk.text).join(''));
      this.$store.dispatch('saveDocument');
    },
    handleSpacebar(event: KeyboardEvent) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString()) {
        event.preventDefault();
        this.togglePin();
      }
    },
    togglePin() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      if (!selectedText) return;

      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      let currentIndex = 0;
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < this.textChunks.length; i++) {
        const chunk = this.textChunks[i];
        const chunkLength = chunk.text.length;

        if (startContainer.textContent === chunk.text && startIndex === -1) {
          startIndex = currentIndex + startOffset;
        }
        if (endContainer.textContent === chunk.text && endIndex === -1) {
          endIndex = currentIndex + endOffset;
        }
        currentIndex += chunkLength;
      }

      if (startIndex === -1 || endIndex === -1) return;

      let newChunks: TextChunk[] = [];
      currentIndex = 0;

      for (let i = 0; i < this.textChunks.length; i++) {
        const chunk = this.textChunks[i];
        const chunkLength = chunk.text.length;

        if (currentIndex + chunkLength <= startIndex || currentIndex >= endIndex) {
          newChunks.push(chunk);
        } else {
          if (currentIndex < startIndex) {
            const before = chunk.text.slice(0, startIndex - currentIndex);
            newChunks.push({ text: before, pinned: chunk.pinned });
          }

          const overlapStart = Math.max(startIndex, currentIndex);
          const overlapEnd = Math.min(endIndex, currentIndex + chunkLength);
          const overlapText = chunk.text.slice(overlapStart - currentIndex, overlapEnd - currentIndex);
          newChunks.push({ text: overlapText, pinned: !chunk.pinned });

          if (currentIndex + chunkLength > endIndex) {
            const after = chunk.text.slice(endIndex - currentIndex);
            newChunks.push({ text: after, pinned: chunk.pinned });
          }
        }

        currentIndex += chunkLength;
      }

      this.textChunks = newChunks;
      this.cleanupChunks();
    },
    updateTextContent(event: Event) {
      const textContent = (event.target as HTMLElement).innerText;
      this.textChunks = [{ text: textContent, pinned: false }];
      this.saveCursorPosition();
    },
    mergeGeneratedContent(chunks: TextChunk[], generatedContent: string) {
      const newChunks = generatedContent.split(/(\s+)/).map(segment => ({
        text: segment,
        pinned: false,
      }));
      return chunks.map((chunk, index) => chunk.pinned ? chunk : newChunks[index] || chunk);
    },
    saveCursorPosition() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      const offset = range.startOffset;

      // Find the index of the node within the editable text container
      const editableText = this.$el.querySelector('.editable-text');
      if (editableText) {
        const nodes = Array.from(editableText.childNodes);
        const nodeIndex = nodes.findIndex(n => n.contains(node));
        this.cursorPosition = { nodeIndex, offset };
      }
    },
    restoreCursorPosition() {
      nextTick(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = document.createRange();
        const editableText = this.$el.querySelector('.editable-text');
        if (editableText) {
          const nodes = Array.from(editableText.childNodes);
          const node = nodes[this.cursorPosition.nodeIndex];
          if (node && node.nodeType === Node.TEXT_NODE) {
            const offset = Math.min(this.cursorPosition.offset, node.textContent?.length || 0);
            range.setStart(node, offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else if (node && node.nodeType === Node.ELEMENT_NODE && node.firstChild) {
            const offset = Math.min(this.cursorPosition.offset, node.firstChild.textContent?.length || 0);
            range.setStart(node.firstChild, offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      });
    },
    cleanupChunks() {
      let cleanedChunks: TextChunk[] = [];
      for (let i = 0; i < this.textChunks.length; i++) {
        const currentChunk = this.textChunks[i];
        // Skip empty chunks but keep spaces
        if (currentChunk.text.trim() === '' && currentChunk.text !== ' ') continue;
        if (cleanedChunks.length === 0) {
          cleanedChunks.push(currentChunk);
        } else {
          const lastChunk = cleanedChunks[cleanedChunks.length - 1];
          if (lastChunk.pinned === currentChunk.pinned) {
            lastChunk.text += currentChunk.text; // Merge with the last chunk
          } else {
            cleanedChunks.push(currentChunk);
          }
        }
      }
      this.textChunks = cleanedChunks;
    }
  },
  mounted() {
    this.loadDocument();
    this.textChunks = [{ text: this.documentContent, pinned: false }];
  },
  updated() {
    this.restoreCursorPosition();
  }
});
</script>

<style scoped>
.text-grey {
  color: #A9A9A9; /* Adjusted to a lighter grey for better contrast */
}
.text-black {
  color: #000000;
}
.editable-text {
  white-space: pre-wrap;
  min-height: 200px;
}
</style>