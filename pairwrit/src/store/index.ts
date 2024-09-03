import Vuex from 'vuex';

interface State {
  documentContent: string;
  title: string;
}

const state: State = {
  documentContent: '',
  title: ''
};

const mutations = {
  setDocumentContent(state: State, content: string) {
    state.documentContent = content;
  },
  setTitle(state: State, newTitle: string) {
    state.title = newTitle;
  },
  loadDocumentContent(state: State) {
    const content = localStorage.getItem('document');
    state.documentContent = content || '';
  }
};

const actions = {
  saveDocument({ state }: { state: State }) {
    localStorage.setItem('document', state.documentContent);
  },
  loadDocument({ commit }: { commit: Function }) {
    commit('loadDocumentContent');
  }
};

export default new Vuex.Store({
  state,
  mutations,
  actions
});