import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechDictation } from '@/hooks/useSpeechDictation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
  disabled?: boolean;
  rows?: number;
}

export function VoiceTextField({
  value,
  onChange,
  placeholder,
  className,
  textarea = false,
  disabled = false,
  rows,
}: VoiceTextFieldProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [baseValue, setBaseValue] = useState(value);
  const baseValueRef = useRef(value);

  // Keep baseValue in sync when not listening
  const { isListening, interimTranscript, error, isSupported, start, stop } =
    useSpeechDictation({
      lang: 'pt-BR',
      onResult: (transcript, isFinal) => {
        if (isFinal) {
          const newValue = baseValueRef.current
            ? baseValueRef.current + ' ' + transcript
            : transcript;
          baseValueRef.current = newValue;
          setBaseValue(newValue);
          onChange(newValue);
        }
      },
    });

  // Sync baseValue when value changes externally and not listening
  useEffect(() => {
    if (!isListening) {
      baseValueRef.current = value;
      setBaseValue(value);
    }
  }, [value, isListening]);

  const displayValue = isListening && interimTranscript
    ? (baseValue ? baseValue + ' ' + interimTranscript : interimTranscript)
    : value;

  const handleToggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      // Snapshot current value as base
      baseValueRef.current = value;
      setBaseValue(value);
      start();
      inputRef.current?.focus();
    }
  }, [isListening, start, stop, value]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
    if (!isListening) {
      baseValueRef.current = e.target.value;
      setBaseValue(e.target.value);
    }
  };

  const micButton = (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || !isSupported}
      aria-label={isListening ? 'Parar ditado' : 'Iniciar ditado'}
      className={cn(
        'absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded transition-colors',
        textarea && 'top-2.5 translate-y-0',
        isListening
          ? 'text-destructive animate-pulse'
          : 'text-muted-foreground hover:text-foreground',
        (!isSupported || disabled) && 'opacity-30 cursor-not-allowed'
      )}
    >
      {isListening ? (
        <Square className="h-3 w-3 fill-current" />
      ) : (
        <Mic className="h-3 w-3" />
      )}
    </button>
  );

  const sharedClassName = cn(
    'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    isListening && 'ring-2 ring-primary/50 border-primary/50',
    'pr-8',
    className
  );

  return (
    <TooltipProvider>
      <div className="relative">
        {textarea ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={cn(sharedClassName, 'min-h-[60px] resize-none')}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(sharedClassName, 'h-8')}
          />
        )}

        {!isSupported ? (
          <Tooltip>
            <TooltipTrigger asChild>{micButton}</TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Seu navegador não suporta ditado
            </TooltipContent>
          </Tooltip>
        ) : (
          micButton
        )}

        {isListening && (
          <span className="absolute -bottom-4 left-0 text-[9px] text-primary animate-pulse">
            Ouvindo…
          </span>
        )}

        {error && (
          <span className="absolute -bottom-4 left-0 text-[9px] text-destructive">
            {error}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
