// Switches between light and dark mode, and colours the phone's status bar to match the page
// (iOS home-screen apps and mobile browsers read it from the theme-color tag).
export function applyDisplayMode(mode) {
  document.documentElement.classList.toggle('dark', mode === 'Dark');
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface);
}
