<template>
  <div class="p-6 bg-gray-100 min-h-screen">
    <div class="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <Toolbar @generateContent="generateContent" />
      <div 
        contenteditable="true" 
        @keydown.space="handleSpacebar"
        @input="updateTextContent"
        class="editable-text p-4 border-t border-gray-200"
      >
        <span v-for="(chunk, index) in textChunks" :key="index" :class="chunk.pinned ? 'text-black' : 'text-grey'">
          {{ chunk.text }}
        </span>
      </div>
      <div v-if="loading" class="p-4 text-blue-500">Generating content...</div>
      <div v-if="error" class="p-4 text-red-500">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import Toolbar from './Toolbar.vue';
import { useStore } from 'vuex';
import { mapState, mapActions } from 'vuex';
import axios from 'axios';

interface TextChunk {
  text: string;
  pinned: boolean;
}

export default defineComponent({
  components: {
    Toolbar
  },
  data() {
    return {
      loading: false,
      error: '',
      textChunks: [] as TextChunk[],
      cursorPosition: { nodeIndex: 0, offset: 0 },
      store: useStore()
    };
  },
  computed: {
    ...mapState(['documentContent'])
  },
  methods: {
    ...mapActions(['saveDocument', 'loadDocument']),
    async generateContent() {
      console.log('Generate Content button clicked');
      const prompt = this.encodeTextChunks();
      console.log('Encoded prompt:', prompt);
      if (prompt.length === 0) {
        this.error = 'Document content is empty';
        return;
      }
      this.loading = true;
      this.error = '';
      try {
        console.log('Sending request to backend with prompt:', prompt);
        const response = await axios.post('http://localhost:3000/api/generate', prompt);
        console.log('API call made successfully');
        const generatedContent = response.data.content;
        console.log('Generated content:', generatedContent);
        console.log('Received generated content:', response.data);
        console.log('Merging generated content with existing text chunks');
        this.textChunks = this.mergeGeneratedContent(this.textChunks, generatedContent.trim());
        console.log('Updated text chunks:', this.textChunks);
        this.cleanupChunks();
        this.store.commit('setDocumentContent', this.textChunks.map(chunk => chunk.text).join(''));
        this.saveDocument();
      } catch (error) {
        console.error('Error generating content:', (error as any).message);
        console.error('Error details:', error);
        this.error = 'Failed to generate content. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    saveDocument() {
      this.store.commit('setDocumentContent', this.textChunks.map(chunk => chunk.text).join(''));
      this.store.dispatch('saveDocument');
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
      this.saveCursorPosition();
    },
    updateTextContent(event: InputEvent) {
      const textContent = (event.target as HTMLElement).innerText;
      let currentIndex = 0;
      const newChunks: TextChunk[] = [];

      for (const chunk of this.textChunks) {
        const chunkLength = chunk.text.length;
        const newText = textContent.slice(currentIndex, currentIndex + chunkLength);

        if (newText.length > 0) {
          newChunks.push({ text: newText, pinned: chunk.pinned });
        }

        currentIndex += chunkLength;
      }

      this.textChunks = newChunks;
      this.store.commit('setDocumentContent', this.textChunks.map(chunk => chunk.text).join(''));
      this.saveDocument();
    },
    mergeGeneratedContent(chunks: TextChunk[], generatedContent: string): TextChunk[] {
      const parsedContent = JSON.parse(generatedContent);
      const newChunks: TextChunk[] = [];

      parsedContent.forEach((content: any) => {
        if (content.pinned) {
          newChunks.push({ text: content.pinned, pinned: true });
        } else if (content.draft) {
          newChunks.push({ text: content.draft, pinned: false });
        }
      });

      return newChunks;
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
        const nodeIndex = nodes.findIndex((n) => (n as Node).contains(node));
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
          if (node && (node as Node).nodeType === Node.TEXT_NODE) {
            const offset = Math.min(this.cursorPosition.offset, (node as Node).textContent?.length || 0);
            range.setStart(node as Node, offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else if (node && (node as Node).nodeType === Node.ELEMENT_NODE && (node as Node).firstChild) {
            const offset = Math.min(this.cursorPosition.offset, (node as Node).firstChild?.textContent?.length || 0);
            range.setStart((node as Node).firstChild as Node, offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      });
    },
    encodeTextChunks(): Array<{ placeholder?: number; pinned?: string; unpinned?: string }> {
      const encodedChunks: Array<{ placeholder?: number; pinned?: string; unpinned?: string }> = [];
      let unpinnedTextLength = 0;

      this.textChunks.forEach(chunk => {
        if (chunk.pinned) {
          if (unpinnedTextLength > 0) {
            encodedChunks.push({ placeholder: unpinnedTextLength });
            unpinnedTextLength = 0;
          }
          encodedChunks.push({ pinned: chunk.text });
        } else {
          unpinnedTextLength += chunk.text.length;
        }
      });

      if (unpinnedTextLength > 0) {
        encodedChunks.push({ placeholder: unpinnedTextLength });
      }

      return encodedChunks;
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
