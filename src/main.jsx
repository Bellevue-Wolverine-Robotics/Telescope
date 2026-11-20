  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { MemoryRouter } from "react-router-dom";
  import './index.css';
  import App from './App';

  if (localStorage.getItem('displayMode') === 'Dark') {
    document.documentElement.classList.add('dark');
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {/* Single page: in-app navigation never touches browser history, so a
          back-swipe can't leave a form without the discard prompt. */}
      <MemoryRouter initialEntries={["/scouting"]}>
        <App />
      </MemoryRouter>
    </StrictMode>
  );
