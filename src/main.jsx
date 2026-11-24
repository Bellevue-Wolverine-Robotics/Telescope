  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { MemoryRouter } from "react-router-dom";
  import './index.css';
  import App from './App';
  import { applyDisplayMode } from './lib/displayMode';
// Registers the service worker that keeps the app working offline and checks for updates
import './lib/appUpdate';

  applyDisplayMode(localStorage.getItem('displayMode') ?? 'Light');

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {/* Single page: in-app navigation never touches browser history, so a
          back-swipe can't leave a form without the discard prompt. */}
      <MemoryRouter initialEntries={["/scouting"]}>
        <App />
      </MemoryRouter>
    </StrictMode>
  );
