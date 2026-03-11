import { useState, useEffect, useCallback } from 'react';

const LARGE_TEXT_KEY = 'dm-accessibility-large-text';
const LIGHT_MODE_KEY = 'dm-accessibility-light-mode';
const ZOOM_LEVEL_KEY = 'dm-accessibility-zoom-level';
const HIGH_CONTRAST_KEY = 'dm-accessibility-high-contrast';
const REDUCED_MOTION_KEY = 'dm-accessibility-reduced-motion';

export type ZoomLevel = '100' | '125' | '150' | '175';

export function useAccessibility() {
  const [largeText, setLargeText] = useState(() => {
    try { return localStorage.getItem(LARGE_TEXT_KEY) === 'true'; } catch { return false; }
  });
  const [lightMode, setLightMode] = useState(() => {
    try { return localStorage.getItem(LIGHT_MODE_KEY) === 'true'; } catch { return false; }
  });
  const [zoomLevel, setZoomLevelState] = useState<ZoomLevel>(() => {
    try { return (localStorage.getItem(ZOOM_LEVEL_KEY) as ZoomLevel) || '150'; } catch { return '150'; }
  });
  const [highContrast, setHighContrast] = useState(() => {
    try { return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true'; } catch { return false; }
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    try { return localStorage.getItem(REDUCED_MOTION_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(LARGE_TEXT_KEY, String(largeText)); } catch {}
    document.documentElement.classList.toggle('accessible-large-text', largeText);
  }, [largeText]);

  useEffect(() => {
    try { localStorage.setItem(LIGHT_MODE_KEY, String(lightMode)); } catch {}
    document.documentElement.classList.toggle('accessible-light-mode', lightMode);
  }, [lightMode]);

  useEffect(() => {
    try { localStorage.setItem(ZOOM_LEVEL_KEY, zoomLevel); } catch {}
    document.documentElement.style.setProperty('--a11y-zoom', `${Number(zoomLevel) / 100}`);
    // Update the font-size percentage used in CSS
    document.documentElement.style.setProperty('--a11y-font-size', `${zoomLevel}%`);
  }, [zoomLevel]);

  useEffect(() => {
    try { localStorage.setItem(HIGH_CONTRAST_KEY, String(highContrast)); } catch {}
    document.documentElement.classList.toggle('accessible-high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    try { localStorage.setItem(REDUCED_MOTION_KEY, String(reducedMotion)); } catch {}
    document.documentElement.classList.toggle('accessible-reduced-motion', reducedMotion);
  }, [reducedMotion]);

  const toggleLargeText = useCallback(() => setLargeText(v => !v), []);
  const toggleLightMode = useCallback(() => setLightMode(v => !v), []);
  const toggleHighContrast = useCallback(() => setHighContrast(v => !v), []);
  const toggleReducedMotion = useCallback(() => setReducedMotion(v => !v), []);
  const setZoomLevel = useCallback((level: ZoomLevel) => setZoomLevelState(level), []);

  return {
    largeText, lightMode, zoomLevel, highContrast, reducedMotion,
    toggleLargeText, toggleLightMode, toggleHighContrast, toggleReducedMotion, setZoomLevel,
  };
}
