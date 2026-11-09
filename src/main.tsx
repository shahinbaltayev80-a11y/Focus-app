import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Automatically register and update service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New FOCUS version available, updating service worker...');
  },
  onOfflineReady() {
    console.log('FOCUS is now cached and ready for offline use.');
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
