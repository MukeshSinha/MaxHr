import './utils/globalFetch';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import './App.css';

// ✅ Read dynamic base path
const basePath = document.querySelector('base')?.getAttribute('href') ?? '/';

const root = createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter basename={basePath}>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
