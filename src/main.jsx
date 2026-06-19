import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { PACHIRA_CSS } from './App.jsx'

// Inject Pachira styles into <head> BEFORE React mounts
// This guarantees media queries apply on the very first paint
const styleEl = document.createElement('style');
styleEl.id = 'pachira-styles';
styleEl.textContent = PACHIRA_CSS;
document.head.appendChild(styleEl);

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
