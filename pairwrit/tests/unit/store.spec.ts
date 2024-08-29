import store from '@/store';

describe('Vuex Store', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.clear();
    // Reset store state before each test
    store.replaceState({
      documentContent: ''
    });
  });

  it('loads document content from local storage', () => {
    localStorage.setItem('document', 'Test Document Content');
    store.dispatch('loadDocument');
    expect(store.state.documentContent).toBe('Test Document Content');
  });

  it('saves document content to local storage', () => {
    store.commit('setDocumentContent', 'New Document Content');
    store.dispatch('saveDocument');
    expect(localStorage.getItem('document')).toBe('New Document Content');
  });
});