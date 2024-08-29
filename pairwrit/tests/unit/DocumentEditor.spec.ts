import { mount } from '@vue/test-utils';
import { createApp } from 'vue';  // Ensure Vue is imported
import DocumentEditor from '@/components/DocumentEditor.vue';
import store from '@/store';

describe('DocumentEditor.vue', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.clear();
    // Reset store state before each test
    store.replaceState({
      documentContent: ''
    });
  });

  it('renders correctly and interacts with the store', async () => {
    const wrapper = mount(DocumentEditor, {
      global: {
        plugins: [store]
      }
    });

    // Check initial content
    expect(wrapper.find('textarea').element.value).toBe('');

    // Simulate typing in the textarea
    await wrapper.find('textarea').setValue('Test Content');
    expect(store.state.documentContent).toBe('Test Content');

    // Simulate clicking the "Generate Content" button
    await wrapper.find('button').trigger('click');
    // Check if the loading indicator is shown
    expect(wrapper.find('.text-blue-500').exists()).toBe(true);
  });
});