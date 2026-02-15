import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'design-master-tips-mode';

export function useTipsMode() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {}
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { tipsEnabled: enabled, setTipsEnabled: setEnabled, toggleTips: toggle };
}
