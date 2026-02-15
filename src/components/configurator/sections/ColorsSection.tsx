import { useState, useCallback } from 'react';
import { Lock, Unlock, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ProjectConfig } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const colorFields = [
  { manual: 'ambientColor' as const, auto: 'autoAmbientColor' as const, label: 'Cor do Ambiente' },
  { manual: 'rimLightColor' as const, auto: 'autoRimLightColor' as const, label: 'Luz de Recorte' },
  { manual: 'complementaryLightColor' as const, auto: 'autoComplementaryLightColor' as const, label: 'Luz Complementar' },
];

export function ColorsSection({ config, onUpdate }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const isManual = config.colorMode === 'manual';

  const handleToggle = useCallback((checked: boolean) => {
    if (checked) {
      // Switching to manual: seed manual colors from auto if they're still default
      onUpdate({
        colorMode: 'manual',
        ambientColor: config.ambientColor || config.autoAmbientColor,
        rimLightColor: config.rimLightColor || config.autoRimLightColor,
        complementaryLightColor: config.complementaryLightColor || config.autoComplementaryLightColor,
      });
    } else {
      onUpdate({ colorMode: 'auto' });
    }
  }, [config, onUpdate]);

  const generatePalette = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-palette', {
        body: {
          niche: config.niche,
          environment: config.environment,
          visualStyle: config.visualStyleEnabled ? config.visualStyle : undefined,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.ambient && data?.rim && data?.fill) {
        onUpdate({
          autoAmbientColor: data.ambient,
          autoRimLightColor: data.rim,
          autoComplementaryLightColor: data.fill,
          autoColorRationale: data.rationale || '',
        });
        toast.success('Nova paleta gerada pela IA!');
      }
    } catch (err: any) {
      console.error('Palette generation error:', err);
      toast.error(err.message || 'Erro ao gerar paleta');
    } finally {
      setIsGenerating(false);
    }
  }, [config.niche, config.environment, config.visualStyleEnabled, config.visualStyle, onUpdate]);

  return (
    <div className="space-y-3">
      {/* Toggle manual/auto */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          {isManual ? <Unlock className="h-3.5 w-3.5 text-primary" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          Personalizar cores
        </span>
        <Switch checked={isManual} onCheckedChange={handleToggle} />
      </div>

      {/* Auto mode indicator */}
      {!isManual && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Automático (IA)
          </p>
          {config.autoColorRationale && (
            <p className="text-[10px] italic text-muted-foreground/70">{config.autoColorRationale}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={generatePalette}
            disabled={isGenerating}
            className="w-full h-7 text-[10px] gap-1.5"
          >
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {isGenerating ? 'Gerando...' : 'Gerar outra paleta (IA)'}
          </Button>
        </div>
      )}

      {/* Color pickers */}
      <div className="space-y-2.5">
        {colorFields.map((f) => {
          const value = isManual ? config[f.manual] : config[f.auto];
          return (
            <div key={f.manual} className={cn('flex items-center gap-2', !isManual && 'opacity-60')}>
              <label className="flex-1 text-[10px] font-semibold uppercase text-muted-foreground">
                {f.label}
              </label>
              <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onUpdate({ [f.manual]: e.target.value })}
                  disabled={!isManual}
                  className={cn(
                    'h-5 w-5 rounded border-0 bg-transparent',
                    isManual ? 'cursor-pointer' : 'cursor-not-allowed'
                  )}
                />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  {value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
