import { ProjectConfig } from '@/types/project';

interface Props {
  config: ProjectConfig;
  onUpdate: (patch: Partial<ProjectConfig>) => void;
}

const colorFields = [
  { key: 'ambientColor' as const, label: 'Cor do Ambiente' },
  { key: 'rimLightColor' as const, label: 'Luz de Recorte' },
  { key: 'complementaryLightColor' as const, label: 'Luz Complementar' },
];

export function ColorsSection({ config, onUpdate }: Props) {
  return (
    <div className="space-y-2.5">
      {colorFields.map((f) => (
        <div key={f.key} className="flex items-center gap-2">
          <label className="flex-1 text-[10px] font-semibold uppercase text-muted-foreground">
            {f.label}
          </label>
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
            <input
              type="color"
              value={config[f.key]}
              onChange={(e) => onUpdate({ [f.key]: e.target.value })}
              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent"
            />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              {config[f.key]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
