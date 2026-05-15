import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AuthProvider } from "./Context/AuthContext.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter MUST be outside AuthProvider if the provider uses navigate/location */}
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);