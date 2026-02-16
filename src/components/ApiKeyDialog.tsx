import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ExternalLink, Key } from 'lucide-react';
import { useGoogleApiKey } from '@/components/configurator/sections/ApiKeySection';

export function ApiKeyDialog() {
  const { apiKey, saveKey } = useGoogleApiKey();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [apiKey]);

  const handleSave = () => {
    if (!value.trim()) return;
    saveKey(value.trim());
    setOpen(false);
  };

  if (apiKey) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Configure sua API Key</DialogTitle>
              <DialogDescription className="text-xs">
                Necessária para gerar imagens e usar a IA
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Google Gemini API Key</label>
            <div className="flex items-center gap-2">
              <Input
                type={visible ? 'text' : 'password'}
                placeholder="Cole sua API Key aqui"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="font-mono text-sm"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Obter API Key gratuita no Google AI Studio
          </a>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!value.trim()} className="flex-1">
              Salvar e Continuar
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Depois
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
