/**
 * Theme management — syncs with user preferences and OS setting.
 */

export const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  }
};

export const initTheme = (userTheme) => {
  const saved = userTheme || localStorage.getItem('taskflow-theme') || 'system';
  applyTheme(saved);

  if (saved === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const current = localStorage.getItem('taskflow-theme') || 'system';
      if (current === 'system') applyTheme('system');
    });
  }
};
