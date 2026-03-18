import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlignLeft, AlignCenter, AlignRight, ImagePlus, Type, Palette } from 'lucide-react';
import type { SlideData, SlideTextBlock, CarouselProject } from '@/types/carouselEditor';
import { FONT_OPTIONS, DEFAULT_PALETTE } from '@/types/carouselEditor';
import { cn } from '@/lib/utils';

interface EditorControlsProps {
  project: CarouselProject;
  activeSlide: SlideData;
  selectedBlock: SlideTextBlock | null;
  onUpdateBlock: (blockId: string, updates: Partial<SlideTextBlock>) => void;
  onUpdateSlide: (slideId: string, updates: Partial<SlideData>) => void;
  onUpdateProject: (updates: Partial<CarouselProject>) => void;
}

export function EditorControls({
  project,
  activeSlide,
  selectedBlock,
  onUpdateBlock,
  onUpdateSlide,
  onUpdateProject,
}: EditorControlsProps) {
  const [tab, setTab] = useState<'text' | 'slide' | 'project'>('text');

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        onUpdateSlide(activeSlide.id, { backgroundImage: url });
      }
    };
    input.click();
  };

  return (
    <div className="w-72 border-l border-border/15 bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-border/15">
        {[
          { key: 'text' as const, icon: Type, label: 'Texto' },
          { key: 'slide' as const, icon: ImagePlus, label: 'Slide' },
          { key: 'project' as const, icon: Palette, label: 'Projeto' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold transition-colors',
              tab === key ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* TEXT TAB */}
        {tab === 'text' && selectedBlock && (
          <>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Conteúdo</Label>
              <Textarea
                value={selectedBlock.content}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { content: e.target.value })}
                className="text-sm min-h-[80px] bg-secondary/30 border-border/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Tamanho — {selectedBlock.fontSize}px
              </Label>
              <Slider
                value={[selectedBlock.fontSize]}
                onValueChange={([v]) => onUpdateBlock(selectedBlock.id, { fontSize: v })}
                min={12}
                max={120}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Peso — {selectedBlock.fontWeight}
              </Label>
              <Slider
                value={[selectedBlock.fontWeight]}
                onValueChange={([v]) => onUpdateBlock(selectedBlock.id, { fontWeight: v })}
                min={100}
                max={900}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Espaçamento entre letras — {selectedBlock.letterSpacing}px
              </Label>
              <Slider
                value={[selectedBlock.letterSpacing]}
                onValueChange={([v]) => onUpdateBlock(selectedBlock.id, { letterSpacing: v })}
                min={-3}
                max={10}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Altura da linha — {selectedBlock.lineHeight}
              </Label>
              <Slider
                value={[selectedBlock.lineHeight]}
                onValueChange={([v]) => onUpdateBlock(selectedBlock.id, { lineHeight: v })}
                min={0.8}
                max={2.5}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhamento</Label>
              <div className="flex gap-1">
                {[
                  { value: 'left' as const, icon: AlignLeft },
                  { value: 'center' as const, icon: AlignCenter },
                  { value: 'right' as const, icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={selectedBlock.textAlign === value ? 'default' : 'outline'}
                    className="h-8 w-8 p-0"
                    onClick={() => onUpdateBlock(selectedBlock.id, { textAlign: value })}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor do texto</Label>
              <div className="flex gap-1.5 flex-wrap">
                {project.palette.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateBlock(selectedBlock.id, { color })}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                      selectedBlock.color === color ? 'border-primary scale-110' : 'border-border/30'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <Input
                  type="color"
                  value={selectedBlock.color}
                  onChange={(e) => onUpdateBlock(selectedBlock.id, { color: e.target.value })}
                  className="w-7 h-7 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>
          </>
        )}

        {tab === 'text' && !selectedBlock && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Clique em um bloco de texto no canvas para editar
          </p>
        )}

        {/* SLIDE TAB */}
        {tab === 'slide' && (
          <>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor de fundo</Label>
              <div className="flex gap-1.5 flex-wrap">
                {project.palette.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateSlide(activeSlide.id, { backgroundColor: color })}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
                      activeSlide.backgroundColor === color ? 'border-primary scale-110' : 'border-border/30'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <Input
                  type="color"
                  value={activeSlide.backgroundColor}
                  onChange={(e) => onUpdateSlide(activeSlide.id, { backgroundColor: e.target.value })}
                  className="w-7 h-7 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Imagem de fundo</Label>
              <Button
                onClick={handleImageUpload}
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {activeSlide.backgroundImage ? 'Trocar imagem' : 'Adicionar imagem'}
              </Button>
              {activeSlide.backgroundImage && (
                <Button
                  onClick={() => onUpdateSlide(activeSlide.id, { backgroundImage: null })}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-destructive"
                >
                  Remover imagem
                </Button>
              )}
            </div>
          </>
        )}

        {/* PROJECT TAB */}
        {tab === 'project' && (
          <>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fonte</Label>
              <Select
                value={project.fontFamily}
                onValueChange={(v) => onUpdateProject({ fontFamily: v })}
              >
                <SelectTrigger className="h-9 text-xs bg-secondary/30 border-border/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Paleta de cores</Label>
              <div className="flex gap-1.5 flex-wrap">
                {project.palette.map((color, i) => (
                  <div key={i} className="relative group">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newPalette = [...project.palette];
                        newPalette[i] = e.target.value;
                        onUpdateProject({ palette: newPalette });
                      }}
                      className="w-8 h-8 p-0 border-2 border-border/30 rounded-full cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
