import { useState, useRef, useCallback } from 'react';
import { Send, Image, Paperclip, Mic, MicOff, Loader2, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAX_CHARS = 9000;

interface Attachment {
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'audio';
}

interface AgentChatInputProps {
  input: string;
  onInputChange: (val: string) => void;
  onSend: (text?: string, attachments?: { url: string; type: string; name: string }[]) => void;
  isLoading: boolean;
  placeholder?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function AgentChatInput({ input, onInputChange, onSend, isLoading, placeholder, textareaRef }: AgentChatInputProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const charCount = input.length;
  const charPercent = Math.min((charCount / MAX_CHARS) * 100, 100);
  const isOverLimit = charCount > MAX_CHARS;

  const uploadFile = useCallback(async (file: File, type: 'image' | 'document' | 'audio'): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${type}s/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('chat-media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        toast.error(`Erro ao enviar arquivo: ${error.message}`);
        return null;
      }
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast.error(`Erro inesperado no upload: ${err.message}`);
      return null;
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande (máx 10MB)'); continue; }
      const preview = URL.createObjectURL(file);
      setAttachments(prev => [...prev, { file, preview, type: 'image' }]);
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) { toast.error('Arquivo muito grande (máx 20MB)'); continue; }
      const isImage = file.type.startsWith('image/');
      const preview = isImage ? URL.createObjectURL(file) : undefined;
      setAttachments(prev => [...prev, { file, preview, type: isImage ? 'image' : 'document' }]);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const att = prev[index];
      if (att.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleRecording = async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setAttachments(prev => [...prev, { file, type: 'audio' }]);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { toast.error('Não foi possível acessar o microfone'); }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (isLoading || isUploading || isOverLimit) return;

    if (attachments.length > 0) {
      setIsUploading(true);
      const uploaded: { url: string; type: string; name: string }[] = [];
      for (const att of attachments) {
        const url = await uploadFile(att.file, att.type);
        if (url) uploaded.push({ url, type: att.type, name: att.file.name });
      }
      setAttachments([]);
      setIsUploading(false);
      onSend(text, uploaded.length > 0 ? uploaded : undefined);
    } else {
      onSend(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const preview = URL.createObjectURL(file);
          setAttachments(prev => [...prev, { file, preview, type: 'image' }]);
        }
      }
    }
  };

  const handleInputChange = (val: string) => {
    if (val.length <= MAX_CHARS + 100) {
      onInputChange(val);
    }
  };

  return (
    <div className="border-t border-border/10 bg-gradient-to-t from-background via-background to-transparent p-3 md:p-4">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 animate-fade-in">
            {attachments.map((att, i) => (
              <div key={i} className="relative group/att animate-scale-in">
                {att.type === 'image' && att.preview ? (
                  <img src={att.preview} alt="" className="h-16 w-16 rounded-xl object-cover border border-border/20 shadow-sm" />
                ) : att.type === 'audio' ? (
                  <div className="h-16 w-20 rounded-xl border border-border/20 bg-secondary/20 flex flex-col items-center justify-center gap-1 shadow-sm">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-[9px] text-muted-foreground">Áudio</span>
                  </div>
                ) : (
                  <div className="h-16 w-20 rounded-xl border border-border/20 bg-secondary/20 flex flex-col items-center justify-center gap-1 px-1 shadow-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">{att.file.name.slice(0, 12)}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/att:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input container */}
        <div className="relative rounded-2xl border border-border/15 bg-card/40 backdrop-blur-sm shadow-lg focus-within:border-primary/25 focus-within:shadow-[0_0_0_1px_hsl(var(--primary)/0.1)] transition-all duration-200">
          {/* Textarea */}
          <textarea
            ref={textareaRef as any}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder || "Digite sua mensagem..."}
            className={cn(
              'w-full resize-none bg-transparent px-4 pt-3 pb-12 text-sm placeholder:text-muted-foreground/30 text-foreground',
              'focus:outline-none',
              'min-h-[52px] max-h-[200px]',
              isOverLimit && 'text-destructive'
            )}
            rows={1}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />

          {/* Bottom bar inside input */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
            {/* Media buttons */}
            <div className="flex items-center gap-0.5">
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} multiple />
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.pptx,.json,.xml" className="hidden" onChange={handleFileSelect} multiple />

              <button
                type="button"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-30"
                onClick={() => imageInputRef.current?.click()}
                disabled={isLoading || isUploading}
                title="Enviar imagem"
              >
                <Image className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-30"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                title="Enviar documento"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30",
                  isRecording ? "text-destructive animate-pulse bg-destructive/10" : "text-muted-foreground/50 hover:text-primary hover:bg-primary/5"
                )}
                onClick={toggleRecording}
                disabled={isLoading || isUploading}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>

            {/* Right side: char count + send */}
            <div className="flex items-center gap-2">
              {charCount > 0 && (
                <span className={cn(
                  "text-[10px] tabular-nums transition-colors",
                  isOverLimit ? "text-destructive font-medium" : charCount > MAX_CHARS * 0.8 ? "text-amber-500" : "text-muted-foreground/30"
                )}>
                  {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
                </span>
              )}
              <Button
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-xl transition-all duration-200",
                  input.trim() || attachments.length > 0
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg scale-100"
                    : "bg-muted/30 text-muted-foreground/30 scale-95"
                )}
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading || isOverLimit}
              >
                {isLoading || isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 px-2 animate-fade-in">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-[10px] text-destructive font-medium">Gravando áudio...</span>
          </div>
        )}
      </div>
    </div>
  );
}
