<template>
  <div class="p-6 bg-gray-100 min-h-screen">
    <div class="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <Toolbar :title="title" @update-title="updateTitle" @generateContent="generateContent" />
      <div>{{ title }}</div>
      <div ref="editorElement"></div>
      <div v-if="loading" class="p-4 text-blue-500">Generating content...</div>
      <div v-if="error" class="p-4 text-red-500">{{ error }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted, computed, defineComponent } from 'vue';
import store from '../store'; // Adjust the path as needed
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import Toolbar from './Toolbar.vue';
import axios from 'axios';

interface ApiChunk {
  pinned?: string;
  draft?: string;
  unpinned?: string;
  placeholder?: number;
  title?: string;
}

export default defineComponent({
  components: {
    Toolbar
  },
  setup() {
    const editorElement = ref<HTMLElement | null>(null);
    const editor = ref<InstanceType<typeof Editor> | null>(null);
    const content = ref('<p>Hello, Toast UI Editor!</p>');
    const title = computed({
      get: () => store.state.title,
      set: (value) => store.commit('setTitle', value)
    });
    const loading = ref(false);
    const error = ref('');

    const updateContent = () => {
      if (editor.value) {
        const newContent = editor.value.getMarkdown();
        console.log('Updating content:', newContent);
        store.commit('setDocumentContent', newContent);
      }
    };

    const updateTitle = (newTitle: string) => {
      console.log('Updating title:', newTitle);
      title.value = newTitle;
    };

    const generateContent = async () => {
      if (!title.value) {
        error.value = 'Title is required.';
        return;
      }
      loading.value = true;
      error.value = '';

      try {
        console.log('Generating content for title:', title.value);
        const markdown = editor.value?.getMarkdown() || '';
        console.log('Current markdown:', markdown);
        const apiFormat = convertToApiFormat(markdown);
        console.log('Converted to API format:', apiFormat);
        const response = await axios.post('http://localhost:3000/api/generate', { title: title.value, ...apiFormat });
        const generatedContent = response.data.content;
        console.log('Generated content:', generatedContent);

        if (editor.value) {
          const newContent = convertFromApiFormat(generatedContent);
          console.log('Converted from API format:', newContent);

          // Log the editor's state before setting the content
          console.log('Editor state before setting content:', editor.value.getMarkdown());

          // Re-initialize the editor to ensure a clean state
          console.log('Re-initializing editor...');
          editor.value.destroy();
          editor.value = new Editor({
            el: editorElement.value,
            height: '500px',
            initialEditType: 'wysiwyg',
            initialValue: newContent,
            events: {
              change: () => {
                console.log('Content changed');
              }
            }
          });
          console.log('Editor re-initialized with new content.');

          // Log the editor's state after setting the content
          console.log('Editor state after setting content:', editor.value.getMarkdown());

          updateContent();
        }
      } catch (err) {
        console.error('Failed to generate content:', err);
        error.value = 'Failed to generate content. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    const convertFromApiFormat = (apiContent: string): string => {
      try {
        const parsedContent = JSON.parse(apiContent);
        console.log('Parsed API content:', parsedContent);
        let markdown = '';

        parsedContent.forEach((chunk: any) => {
          if (chunk.title) {
            // Skip the title as requested
          } else if (chunk.pinned) {
            markdown += chunk.pinned;
          } else if (chunk.draft) {
            markdown += `~~${chunk.draft}~~`;
          } else if (chunk.unpinned) {
            markdown += `~~${chunk.unpinned}~~`;
          } else if (chunk.placeholder) {
            markdown += `~~${'x'.repeat(chunk.placeholder)}~~`;
          }
        });

        // Ensure line breaks are preserved
        markdown = markdown.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');

        console.log('Converted markdown:', markdown.trim());
        return markdown.trim();
      } catch (error) {
        console.error('Error parsing API response:', error);
        return 'Error parsing content';
      }
    };

    const convertToApiFormat = (markdown: string): ApiChunk[] => {
      const chunks: ApiChunk[] = [];
      const lines = markdown.split('\n');

      lines.forEach((line, index) => {
        const strikethroughRegex = /~~(.*?)~~/g;
        let lastIndex = 0;
        let match;

        while ((match = strikethroughRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            chunks.push({ pinned: line.slice(lastIndex, match.index) });
          }
          chunks.push({ placeholder: match[1].length });
          lastIndex = strikethroughRegex.lastIndex;
        }

        if (lastIndex < line.length) {
          chunks.push({ pinned: line.slice(lastIndex) });
        }

        // Add a placeholder for line breaks
        chunks.push({ pinned: '\n' });
      });

      return chunks;
    };

    const toggleStrikethrough = () => {
      if (editor.value) {
        const selection = editor.value.getSelection();
        if (selection && selection[0] !== selection[1]) {
          editor.value.exec('strike');
        }
      }
    };

    onMounted(() => {
      if (editorElement.value) {
        editor.value = new Editor({
          el: editorElement.value,
          height: '500px',
          initialEditType: 'wysiwyg',
          initialValue: content.value,
          events: {
            change: updateContent
          },
          customHTMLSanitizer: (html: string): string => html,
          hooks: {
            addImageBlobHook: (blob: Blob, callback: (url: string, altText: string) => void) => {
              // Implement image upload logic here if needed
              return false;
            }
          }
        });

        // Add custom keymap for space key
        if (editor.value && 'addKeyMap' in editor.value) {
          (editor.value as any).addKeyMap('SPACE', () => {
            toggleStrikethrough();
            return false; // Prevent default space behavior
          }, 'wysiwyg');
  }
      console.log('Component mounted, loading initial content');
      content.value = store.state.documentContent || '';
      console.log('Initial content:', content.value);
}
    });

    return {
      editorElement,
      content,
      title,
      loading,
      error,
      updateTitle,
      generateContent
    };
  }
});
</script>

<style>
/* Toast UI Editor specific styles */
.toastui-editor-contents {
  font-size: 16px;
  line-height: 1.6;
}

.toastui-editor-contents p {
  margin-bottom: 10px;
}

.toastui-editor-contents del {
  text-decoration: none;
  color: #5a6270;
  background-color: #f0f2f5;
  border-radius: 3px;
  padding: 2px 0;
}

/* Styling for selected text */
.toastui-editor-contents ::selection {
  background-color: #e3f2fd;
  color: #1565c0;
}

.toastui-editor-contents del::selection {
  background-color: #fff3e0;
  color: #e65100;
}

/* Focus styles for the editor */
.toastui-editor-defaultUI {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.toastui-editor-defaultUI:focus-within {
  outline: none;
  box-shadow: 0 0 0 2px #e3f2fd;
}

/* Tooltip-like hint (if needed) */
.toastui-editor-defaultUI {
  position: relative;
}

.toastui-editor-defaultUI::before {
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
  z-index: 1000;
}

.toastui-editor-defaultUI:hover::before {
  opacity: 1;
}
</style>