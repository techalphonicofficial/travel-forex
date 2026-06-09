'use client';

import { useEffect } from 'react';
import { normalizeThemeVariables, withDerivedThemeVariables } from '@/utils/themeVariables';

const THEME_REFRESH_EVENT = 'theme-colours-refresh';

const applyThemeVariables = (variables) => {
  const themeVariables = withDerivedThemeVariables(normalizeThemeVariables(variables));
  const targets = [document.documentElement, document.body].filter(Boolean);

  targets.forEach((target) => {
    Object.entries(themeVariables).forEach(([name, value]) => {
      target.style.setProperty(name, value);
    });
  });
};

export default function ThemeColoursClient({ initialVariables = {} }) {
  useEffect(() => {
    let ignore = false;

    applyThemeVariables(initialVariables);

    const refreshTheme = async () => {
      try {
        const response = await fetch(`/api/crm/settings/theme-colours?_t=${Date.now()}`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        const payload = await response.json();

        if (!ignore && payload?.theme_variables) {
          applyThemeVariables(payload.theme_variables);
        }
      } catch (error) {
        console.warn('Theme colours unavailable:', error?.message || error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshTheme();
    };

    window.addEventListener('focus', refreshTheme);
    window.addEventListener(THEME_REFRESH_EVENT, refreshTheme);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    refreshTheme();

    return () => {
      ignore = true;
      window.removeEventListener('focus', refreshTheme);
      window.removeEventListener(THEME_REFRESH_EVENT, refreshTheme);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initialVariables]);

  return null;
}
