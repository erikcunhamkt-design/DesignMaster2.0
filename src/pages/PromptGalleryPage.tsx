import { useState } from 'react';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { galleryCategories, promptTemplates, PromptTemplate } from '@/data/promptGallery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Check, Sparkles, Plus, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const isDev = import.meta.env.DEV;

export default function PromptGalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PromptTemplate[]>(promptTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newNegativePrompt, setNewNegativePrompt] = useState('');
  const [newCategory, setNewCategory] = useState('editorial');
  const [newTags, setNewTags] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const filtered = activeCategory
    ? templates.filter(t => t.category === activeCategory)
    : templates;

  const copyPrompt = (template: PromptTemplate) => {
    const text = template.negativePrompt
      ? `${template.prompt}\n\nNegative: ${template.negativePrompt}`
      : template.prompt;
    navigator.clipboard.writeText(text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Prompt copiado!');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setNewImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTemplate = () => {
    if (!newPrompt.trim()) {
      toast.error('O prompt é obrigatório');
      return;
    }

    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      title: newTitle.trim() || 'Sem título',
      prompt: newPrompt.trim(),
      negativePrompt: newNegativePrompt.trim() || undefined,
      category: newCategory,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl: newImageUrl || undefined,
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setNewTitle('');
    setNewPrompt('');
    setNewNegativePrompt('');
    setNewCategory('editorial');
    setNewTags('');
    setNewImageUrl('');
    setImagePreview(null);
    setDialogOpen(false);
    toast.success('Prompt adicionado!');
  };

  const removeTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Prompt removido');
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Galeria de Ideias" showApiKey={false} />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-foreground font-display">💡 Galeria de Ideias</h2>
            {isDev && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 rounded-lg">
                    <Plus className="h-4 w-4" />
                    Adicionar Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Novo Prompt</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {/* Image upload */}
                    <div className="space-y-2">
                      <Label className="text-xs">Imagem</Label>
                      <div
                        className={cn(
                          'relative flex items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden',
                          imagePreview ? 'border-primary/30 h-48' : 'border-border/30 hover:border-primary/30 h-32'
                        )}
                        onClick={() => document.getElementById('gallery-image-input')?.click()}
                      >
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/50">
                            <ImagePlus className="h-6 w-6" />
                            <span className="text-[10px]">Clique para adicionar imagem</span>
                          </div>
                        )}
                      </div>
                      <input
                        id="gallery-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Título</Label>
                      <Input
                        placeholder="Nome do prompt"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Prompt *</Label>
                      <Textarea
                        placeholder="Descreva o prompt completo..."
                        value={newPrompt}
                        onChange={e => setNewPrompt(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Negative Prompt</Label>
                      <Textarea
                        placeholder="O que evitar na geração..."
                        value={newNegativePrompt}
                        onChange={e => setNewNegativePrompt(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Categoria</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {galleryCategories.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.emoji} {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Tags (separadas por vírgula)</Label>
                      <Input
                        placeholder="editorial, luxo, minimalista"
                        value={newTags}
                        onChange={e => setNewTags(e.target.value)}
                      />
                    </div>

                    <Button onClick={handleAddTemplate} className="w-full gap-1.5">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
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
        <div className="px-8 pb-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
              <Sparkles className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhum prompt ainda</p>
              {isDev && <p className="text-xs mt-1">Clique em "Adicionar Prompt" para começar</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(template => (
                <div
                  key={template.id}
                  className="group rounded-xl border border-border/15 bg-card/30 overflow-hidden hover:border-primary/20 hover:bg-card/50 transition-all duration-300"
                >
                  {/* Image */}
                  {template.imageUrl && (
                    <div className="aspect-[4/3] w-full overflow-hidden bg-secondary/20">
                      <img
                        src={template.imageUrl}
                        alt={template.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-foreground">{template.title}</h3>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyPrompt(template)}
                          className="h-7 w-7 rounded-lg"
                        >
                          {copiedId === template.id ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        {isDev && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTemplate(template.id)}
                            className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[9px] rounded-md border-border/15 px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Prompt */}
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Prompt</p>
                      <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-4">
                        {template.prompt}
                      </p>
                    </div>

                    {/* Negative Prompt */}
                    {template.negativePrompt && (
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-destructive/50 mb-1">Negative Prompt</p>
                        <p className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-2">
                          {template.negativePrompt}
                        </p>
                      </div>
                    )}

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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
