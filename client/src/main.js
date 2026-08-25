import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';
import App from './App.vue';
import './assets/main.css';
import { useUiStore } from './stores/uiStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Set up Axios Global Request & Response Interceptors for universal loading feedback
const uiStore = useUiStore(pinia);

axios.interceptors.request.use(
  (config) => {
    uiStore.startLoading();
    return config;
  },
  (error) => {
    uiStore.stopLoading();
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    uiStore.stopLoading();
    return response;
  },
  (error) => {
    uiStore.stopLoading();
    return Promise.reject(error);
  }
);

app.mount('#app');
