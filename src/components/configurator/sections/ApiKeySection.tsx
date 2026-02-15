import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'google_gemini_api_key';

export function useGoogleApiKey() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '');

  const saveKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { apiKey, saveKey };
}

interface ApiKeySectionProps {
  apiKey: string;
  onChangeKey: (key: string) => void;
}

export function ApiKeySection({ apiKey, onChangeKey }: ApiKeySectionProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type={visible ? 'text' : 'password'}
          placeholder="Cole sua API Key do Google aqui"
          value={apiKey}
          onChange={(e) => onChangeKey(e.target.value)}
          className="text-xs h-8 font-mono"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        Obter API Key no Google AI Studio
      </a>
    </div>
  );
}
