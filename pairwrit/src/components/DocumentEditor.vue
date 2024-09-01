<template>
  <div class="p-6 bg-gray-100 min-h-screen">
    <div class="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <Toolbar :title="title" @updateTitle="updateTitle" @generateContent="generateContent" />
      <div 
        ref="editableDiv"
        contenteditable="true" 
        @input="updateContent"
        @keydown.space.prevent="handleSpace"
        @click="handleClick"
        class="editable-text p-4 border-t border-gray-200"
      ></div>
      <div v-if="loading" class="p-4 text-blue-500">Generating content...</div>
      <div v-if="error" class="p-4 text-red-500">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import Toolbar from './Toolbar.vue';
import { useStore } from 'vuex';
import axios from 'axios';

interface ApiChunk {
  draft?: string;
  pinned?: string;
  placeholder?: number;
  unpinned?: string;
}

export default defineComponent({
  components: { Toolbar },
  setup() {
    const store = useStore();
    const editableDiv = ref<HTMLElement | null>(null);
    const content = ref('');
    const title = ref<string>('');
    const loading = ref(false);
    const error = ref('');

    let clickCount = 0;
    let lastClickTime = 0;

    const updateContent = () => {
      if (!editableDiv.value) return;
      cleanupEmptyStrikes();
      content.value = editableDiv.value.innerHTML;
      store.commit('setDocumentContent', content.value);
    };

    return {
      editableDiv,
      content,
      title,
      loading,
      error,
      updateContent,
      handleSpace,
      generateContent,
      handleClick,
      updateTitle,
    };

    const handleSpace = (event: KeyboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        // If no text is selected, insert a space
        document.execCommand('insertHTML', false, '&nbsp;');
      } else {
        // Toggle strike on selected text
        toggleStrike(range);
      }
      updateContent();
    };

    const toggleStrike = (range: Range) => {
      const startNode = range.startContainer;
      const endNode = range.endContainer;
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      const startInStrike = isInStrike(startNode);
      const endInStrike = isInStrike(endNode);

      if (startInStrike === endInStrike) {
        // Both start and end are either in strike or not in strike
        if (startInStrike) {
          // Remove strike
          removeStrike(range);
        } else {
          // Add strike
          addStrike(range);
        }
      } else {
        // Selection crosses strike boundary
        if (startInStrike) {
          // Extend strike to end
          extendStrikeToEnd(range);
        } else {
          // Extend non-strike to end
          extendNonStrikeToEnd(range);
        }
      }
    };

    const isInStrike = (node: Node): boolean => {
      while (node && node !== editableDiv.value) {
        if (node.nodeName === 'STRIKE') return true;
        node = node.parentNode!;
      }
      return false;
    };

    const removeStrike = (range: Range) => {
      const fragment = range.extractContents();
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(fragment);

      // Remove all strike tags within the selection
      const strikes = tempDiv.querySelectorAll('strike');
      strikes.forEach(strike => {
        while (strike.firstChild) {
          strike.parentNode!.insertBefore(strike.firstChild, strike);
        }
        strike.parentNode!.removeChild(strike);
      });

      // Check if we need to split an existing strike
      const startStrike = getParentStrike(range.startContainer);
      if (startStrike) {
        const beforeRange = document.createRange();
        beforeRange.setStartBefore(startStrike);
        beforeRange.setEnd(range.startContainer, range.startOffset);
        const beforeFragment = beforeRange.extractContents();
        const beforeStrike = document.createElement('strike');
        beforeStrike.appendChild(beforeFragment);
        startStrike.parentNode!.insertBefore(beforeStrike, startStrike);

        const afterRange = document.createRange();
        afterRange.setStart(range.endContainer, range.endOffset);
        afterRange.setEndAfter(startStrike);
        const afterFragment = afterRange.extractContents();
        const afterStrike = document.createElement('strike');
        afterStrike.appendChild(afterFragment);
        startStrike.parentNode!.insertBefore(afterStrike, startStrike.nextSibling);

        startStrike.parentNode!.removeChild(startStrike);
      }

      // Reinsert the content
      range.insertNode(tempDiv);
      while (tempDiv.firstChild) {
        tempDiv.parentNode!.insertBefore(tempDiv.firstChild, tempDiv);
      }
      tempDiv.parentNode!.removeChild(tempDiv);
    };

    const addStrike = (range: Range) => {
      const fragment = range.extractContents();
      const strike = document.createElement('strike');
      strike.appendChild(fragment);
      range.insertNode(strike);
    };

    const extendStrikeToEnd = (range: Range) => {
      const startStrike = getParentStrike(range.startContainer);
      if (!startStrike) return;

      const newRange = document.createRange();
      newRange.setStart(startStrike, 0);
      newRange.setEnd(range.endContainer, range.endOffset);

      const fragment = newRange.extractContents();
      const strike = document.createElement('strike');
      strike.appendChild(fragment);
      newRange.insertNode(strike);
    };

    const extendNonStrikeToEnd = (range: Range) => {
      const endStrike = getParentStrike(range.endContainer);
      if (!endStrike) return;

      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.setEnd(endStrike, endStrike.childNodes.length);

      removeStrike(newRange);
    };

    const getParentStrike = (node: Node): HTMLElement | null => {
      while (node && node !== editableDiv.value) {
        if (node.nodeName === 'STRIKE') return node as HTMLElement;
        node = node.parentNode!;
      }
      return null;
    };

    const cleanupEmptyStrikes = () => {
      if (!editableDiv.value) return;
      const emptyStrikes = editableDiv.value.querySelectorAll('strike:empty');
      emptyStrikes.forEach(strike => strike.parentNode!.removeChild(strike));
    };

    const handleClick = (event: MouseEvent) => {
      const currentTime = new Date().getTime();
      if (currentTime - lastClickTime > 400) {
        clickCount = 0;
      }
      clickCount++;
      lastClickTime = currentTime;

      if (clickCount === 3) {
        event.preventDefault();
        selectCurrentArea(event);
        clickCount = 0;
      }
    };

    const selectCurrentArea = (event: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || !editableDiv.value) return;

      const range = document.createRange();
      let node = event.target as Node;
      let startNode = node;
      let endNode = node;

      // Find the start of the current area
      while (startNode.previousSibling && 
             (startNode.nodeName !== 'STRIKE' && startNode.previousSibling.nodeName !== 'STRIKE')) {
        startNode = startNode.previousSibling;
      }

      // Find the end of the current area
      while (endNode.nextSibling && 
             (endNode.nodeName !== 'STRIKE' && endNode.nextSibling.nodeName !== 'STRIKE')) {
        endNode = endNode.nextSibling;
      }

      range.setStartBefore(startNode);
      range.setEndAfter(endNode);

      selection.removeAllRanges();
      selection.addRange(range);
    };

    const updateTitle = (newTitle: string) => {
      title.value = newTitle;
      console.log('Title updated:', title.value); // Debugging line to check if title is updated
    };

    const generateContent = async () => {
      if (!title.value) {
        error.value = 'Title is required.';
        return;
      }
      loading.value = true;
      error.value = '';

      try {
        const apiFormat = convertToApiFormat(editableDiv.value!.innerHTML);
        const response = await axios.post('http://localhost:3000/api/generate', { title: title.value, ...apiFormat });
        const generatedContent = response.data.content;

        if (editableDiv.value) {
          editableDiv.value.innerHTML = convertFromApiFormat(generatedContent);
        }

        updateContent();
      } catch (err) {
        error.value = 'Failed to generate content. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    const convertToApiFormat = (html: string): ApiChunk[] => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const chunks: ApiChunk[] = [];
      let currentChunk: ApiChunk = {};

      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.trim()) {
            if (currentChunk.pinned) {
              currentChunk.pinned += text;
            } else {
              currentChunk.pinned = text;
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName.toLowerCase() === 'strike') {
            if (currentChunk.pinned) {
              chunks.push(currentChunk);
              currentChunk = {};
            }
            chunks.push({ placeholder: (element.textContent || '').length });
          } else {
            Array.from(element.childNodes).forEach(processNode);
          }
        }
      };

      Array.from(doc.body.childNodes).forEach(processNode);

      if (currentChunk.pinned) {
        chunks.push(currentChunk);
      }

      return chunks;
    };

    const convertFromApiFormat = (apiContent: string): string => {
      const chunks: ApiChunk[] = JSON.parse(apiContent);
      let html = '';

      chunks.forEach(chunk => {
        if (chunk.pinned) {
          html += chunk.pinned;
        } else if (chunk.draft || chunk.unpinned) {
          html += `<strike>${chunk.draft || chunk.unpinned}</strike>`;
        } else if (chunk.placeholder) {
          html += `<strike>${'x'.repeat(chunk.placeholder)}</strike>`;
        }
      });

      return html;
    };

    onMounted(() => {
      if (editableDiv.value) {
        content.value = store.state.documentContent || '';
        editableDiv.value.innerHTML = content.value || '<strike>Start typing here...</strike>';
      }
    });

    return {
      editableDiv,
      content,
      loading,
      error,
      updateContent,
      handleSpace,
      generateContent,
      handleClick,
    };
  },
});
</script>

<style>
.editable-text {
  white-space: pre-wrap;
  min-height: 200px;
  line-height: 1.6;
  padding: 10px;
}

.editable-text strike {
  text-decoration: none;
  color: #5a6270;
  background-color: #f0f2f5;
  border-radius: 3px;
  padding: 2px 0;
}

/* Styling for selected text */
.editable-text ::selection {
  background-color: #e3f2fd;
  color: #1565c0;
}

.editable-text strike::selection {
  background-color: #fff3e0;
  color: #e65100;
}

/* Additional styles to make the distinction clearer */
.editable-text p {
  margin-bottom: 10px;
}

.editable-text:focus {
  outline: none;
  box-shadow: 0 0 0 2px #e3f2fd;
}

/* Tooltip-like hint */
.editable-text:before {
  content: 'Select text to pin/unpin';
  display: block;
  position: absolute;
  top: -30px;
  left: 10px;
  background-color: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.editable-text:hover:before {
  opacity: 1;
}
</style>
