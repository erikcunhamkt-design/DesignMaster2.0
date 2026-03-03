import { useState, useEffect, useCallback } from 'react';

const LARGE_TEXT_KEY = 'dm-accessibility-large-text';
const LIGHT_MODE_KEY = 'dm-accessibility-light-mode';

export function useAccessibility() {
  const [largeText, setLargeText] = useState(() => {
    try { return localStorage.getItem(LARGE_TEXT_KEY) === 'true'; } catch { return false; }
  });
  const [lightMode, setLightMode] = useState(() => {
    try { return localStorage.getItem(LIGHT_MODE_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(LARGE_TEXT_KEY, String(largeText)); } catch {}
    document.documentElement.classList.toggle('accessible-large-text', largeText);
  }, [largeText]);

  useEffect(() => {
    try { localStorage.setItem(LIGHT_MODE_KEY, String(lightMode)); } catch {}
    document.documentElement.classList.toggle('accessible-light-mode', lightMode);
  }, [lightMode]);

  const toggleLargeText = useCallback(() => setLargeText(v => !v), []);
  const toggleLightMode = useCallback(() => setLightMode(v => !v), []);

  return { largeText, lightMode, toggleLargeText, toggleLightMode };
}
