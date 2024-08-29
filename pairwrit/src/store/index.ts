import { createStore } from 'vuex';

const store = createStore({
  state: {
    documentContent: ''
  },
  mutations: {
    setDocumentContent(state, content) {
      state.documentContent = content;
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
  modules: {}
});

export default store;