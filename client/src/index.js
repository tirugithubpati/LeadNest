import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './style.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

serviceWorker.unregister();
