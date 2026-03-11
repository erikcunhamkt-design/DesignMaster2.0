import { useState, useRef, useCallback } from 'react';
import { Image, Smile, Mic, MicOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const EMOJI_LIST = ['😀','😂','😍','🔥','👍','❤️','🎉','😎','🤔','💯','✨','🙌','😢','😡','👀','💪','🎯','🚀','💡','⭐'];

interface ChatMediaInputProps {
  onMediaSent: (url: string, type: 'image' | 'audio') => void;
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function ChatMediaInput({ onMediaSent, onEmojiSelect, disabled }: ChatMediaInputProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const uploadFile = useCallback(async (file: File, type: 'image' | 'audio') => {
    setIsUploading(true);
    const ext = file.name.split('.').pop() || (type === 'audio' ? 'webm' : 'png');
    const path = `${type}s/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('chat-media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      toast.error(`Erro ao enviar ${type === 'image' ? 'imagem' : 'áudio'}`);
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
    onMediaSent(urlData.publicUrl, type);
    setIsUploading(false);
  }, [onMediaSent]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }
    uploadFile(file, 'image');
    e.target.value = '';
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
        uploadFile(file, 'audio');
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error('Não foi possível acessar o microfone');
    }
  };

  return (
    <div className="flex items-center gap-1 relative">
      {/* Image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
      </Button>

      {/* Emoji picker */}
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
          onClick={() => setShowEmojis(!showEmojis)}
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>
        {showEmojis && (
          <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border border-border/30 rounded-xl shadow-xl grid grid-cols-5 gap-1 z-50 min-w-[180px]">
            <button
              onClick={() => setShowEmojis(false)}
              className="absolute -top-2 -right-2 bg-card border border-border/30 rounded-full p-0.5"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => { onEmojiSelect(emoji); setShowEmojis(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Audio recording */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9 rounded-lg",
          isRecording
            ? "text-destructive animate-pulse bg-destructive/10"
            : "text-muted-foreground hover:text-primary"
        )}
        onClick={toggleRecording}
        disabled={disabled || isUploading}
      >
        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/** Renders media content in a message bubble */
export function MediaMessageContent({ type, url }: { type: string; url: string }) {
  if (type === 'image') {
    return (
      <img
        src={url}
        alt="Imagem"
        className="max-w-[250px] max-h-[200px] rounded-xl object-cover cursor-pointer"
        onClick={() => window.open(url, '_blank')}
      />
    );
  }
  if (type === 'audio') {
    return <audio controls src={url} className="max-w-[250px]" />;
  }
  return null;
}
