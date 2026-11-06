import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/hooks';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';

// GitHub Pages uses hash routing so deep links work without a server rewrite.
const PublicRouter = import.meta.env.VITE_STATIC_DEMO === 'true' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PublicRouter>
      <AuthProvider>
        <>
                {import.meta.env.VITE_STATIC_DEMO === 'true' && <div role="status" style={{ padding: '8px 16px', background: '#163047', color: '#fff', textAlign: 'center', fontSize: 13, position: 'relative', zIndex: 100 }}> Public preview: interactive demo uses synthetic data. Account registration and live sensors require the local backend. </div>}
                <App />
              </>
      </AuthProvider>
    </PublicRouter>
  </StrictMode>,
);
