import { useState } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { galleryCategories, promptTemplates, PromptTemplate } from '@/data/promptGallery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function PromptGalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = activeCategory
    ? promptTemplates.filter(t => t.category === activeCategory)
    : promptTemplates;

  const copyPrompt = (template: PromptTemplate) => {
    navigator.clipboard.writeText(template.prompt);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Prompt copiado!');
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Galeria de Ideias" showApiKey={false} />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-foreground font-display mb-2">💡 Galeria de Ideias</h2>
          <p className="text-sm text-muted-foreground mb-6">Templates e coleções de prompts prontos para usar</p>

          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-medium border transition-all shrink-0',
                !activeCategory
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20'
              )}
            >
              Todos
            </button>
            {galleryCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-medium border transition-all shrink-0 flex items-center gap-1.5',
                  activeCategory === cat.id
                    ? 'bg-primary/15 text-primary border-primary/30'
                    : 'bg-secondary/30 text-muted-foreground border-border/15 hover:border-primary/20'
                )}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(template => (
            <div
              key={template.id}
              className="group rounded-xl border border-border/15 bg-card/30 p-5 space-y-3 hover:border-primary/20 hover:bg-card/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-foreground">{template.title}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyPrompt(template)}
                  className="h-7 w-7 shrink-0 rounded-lg"
                >
                  {copiedId === template.id ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[9px] rounded-md border-border/15 px-2 py-0.5">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                {template.prompt}
              </p>

              <Button
                onClick={() => copyPrompt(template)}
                variant="ghost"
                size="sm"
                className="w-full h-8 gap-1.5 text-[10px] font-semibold rounded-lg text-primary/70 hover:text-primary hover:bg-primary/8"
              >
                <Sparkles className="h-3 w-3" />
                Usar este prompt
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
