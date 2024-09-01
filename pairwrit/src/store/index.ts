import { createStore } from 'vuex';

export default createStore({
  state: {
    documentContent: '',
    title: ''
  },
  mutations: {
    setDocumentContent(state, content) {
      state.documentContent = content;
    },
    setTitle(state, newTitle) {
      state.title = newTitle;
    },
    loadDocumentContent(state) {
      const content = localStorage.getItem('document');
      state.documentContent = content || '';
    }
  },
  actions: {
    saveDocument({ state }) {
      localStorage.setItem('document', state.documentContent);
    },
    loadDocument({ commit }) {
      commit('loadDocumentContent');
    }
  },
  modules: {
  }
});
