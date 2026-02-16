import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Key, MessageCircle } from 'lucide-react';
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
                Necessária para o funcionamento do app
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">API Key</label>
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

          <p className="text-xs text-muted-foreground">
            Não sabe onde encontrar?{' '}
            <a
              href="https://wa.me/5551996377086?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20para%20configurar%20minha%20API%20Key."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <MessageCircle className="h-3 w-3" /> Fale com o suporte
            </a>
          </p>

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
