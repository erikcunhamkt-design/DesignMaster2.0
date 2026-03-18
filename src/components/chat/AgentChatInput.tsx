import { useState, useRef, useCallback } from 'react';
import { Send, Image, Paperclip, Mic, MicOff, Loader2, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  const uploadFile = useCallback(async (file: File, type: 'image' | 'document' | 'audio'): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${type}s/${crypto.randomUUID()}.${ext}`;
      console.log('[Upload] Uploading file:', file.name, 'type:', type, 'size:', file.size, 'path:', path);
      const { error } = await supabase.storage.from('chat-media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        console.error('[Upload] Storage error:', error);
        toast.error(`Erro ao enviar arquivo: ${error.message}`);
        return null;
      }
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
      console.log('[Upload] Success, URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('[Upload] Unexpected error:', err);
      toast.error(`Erro inesperado no upload: ${err.message}`);
      return null;
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máx 10MB)');
        continue;
      }
      const preview = URL.createObjectURL(file);
      setAttachments(prev => [...prev, { file, preview, type: 'image' }]);
    }
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máx 20MB)');
        continue;
      }
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
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setAttachments(prev => [...prev, { file, type: 'audio' }]);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (isLoading || isUploading) return;

    if (attachments.length > 0) {
      setIsUploading(true);
      const uploaded: { url: string; type: string; name: string }[] = [];
      for (const att of attachments) {
        const url = await uploadFile(att.file, att.type);
        if (url) {
          uploaded.push({ url, type: att.type, name: att.file.name });
        }
      }
      setAttachments([]);
      setIsUploading(false);
      onSend(text, uploaded.length > 0 ? uploaded : undefined);
    } else {
      onSend(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  return (
    <div className="border-t border-border/15 bg-card/20 backdrop-blur-sm p-3 md:p-4">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative group/att">
                {att.type === 'image' && att.preview ? (
                  <img src={att.preview} alt="" className="h-16 w-16 rounded-lg object-cover border border-border/30" />
                ) : att.type === 'audio' ? (
                  <div className="h-16 w-20 rounded-lg border border-border/30 bg-secondary/30 flex flex-col items-center justify-center gap-1">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-[9px] text-muted-foreground">Áudio</span>
                  </div>
                ) : (
                  <div className="h-16 w-20 rounded-lg border border-border/30 bg-secondary/30 flex flex-col items-center justify-center gap-1 px-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-[8px] text-muted-foreground truncate w-full text-center">{att.file.name.slice(0, 12)}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/att:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2">
          {/* Media buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} multiple />
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.pptx,.json,.xml" className="hidden" onChange={handleFileSelect} multiple />
            
            <Button
              type="button" variant="ghost" size="icon"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
              onClick={() => imageInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Enviar imagem"
            >
              <Image className="h-4 w-4" />
            </Button>
            
            <Button
              type="button" variant="ghost" size="icon"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Enviar documento"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              type="button" variant="ghost" size="icon"
              className={cn(
                "h-9 w-9 rounded-lg",
                isRecording ? "text-destructive animate-pulse bg-destructive/10" : "text-muted-foreground hover:text-primary"
              )}
              onClick={toggleRecording}
              disabled={isLoading || isUploading}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>

          {/* Textarea */}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef as any}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder || "Digite sua mensagem..."}
              className="min-h-[44px] max-h-32 resize-none pr-12 rounded-xl border-border/20 bg-secondary/30 text-sm placeholder:text-muted-foreground/40 focus:border-primary/30 focus:ring-primary/20"
              rows={1}
            />
            <Button
              size="icon"
              className="absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg"
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
            >
              {isLoading || isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
