import { useState, useRef, useCallback, useEffect } from 'react';

// Global registry to ensure only one dictation at a time
let activeInstance: (() => void) | null = null;

interface UseSpeechDictationOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
}

interface UseSpeechDictationReturn {
  isListening: boolean;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechDictation(options: UseSpeechDictationOptions = {}): UseSpeechDictationReturn {
  const { lang = 'pt-BR', onResult } = options;
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const getSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  };

  const isSupported = !!getSpeechRecognition();

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
    if (activeInstance === stop) {
      activeInstance = null;
    }
  }, []);

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setError('Seu navegador não suporta ditado por voz.');
      return;
    }

    // Stop any other active instance
    if (activeInstance && activeInstance !== stop) {
      activeInstance();
    }

    setError(null);
    setInterimTranscript('');

    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      activeInstance = stop;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalText) {
        onResultRef.current?.(finalText, true);
      }
      if (interim) {
        onResultRef.current?.(interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Permissão do microfone negada. Habilite nas configurações do navegador.');
      } else if (event.error === 'no-speech') {
        // Silence — just stop gracefully
      } else if (event.error !== 'aborted') {
        setError(`Erro no reconhecimento: ${event.error}`);
      }
      stop();
    };

    recognition.onend = () => {
      // Only update state if this is still the active recognition
      if (recognitionRef.current === recognition) {
        setIsListening(false);
        setInterimTranscript('');
        recognitionRef.current = null;
        if (activeInstance === stop) {
          activeInstance = null;
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      setError('Erro ao iniciar reconhecimento de voz.');
      stop();
    }
  }, [lang, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isListening, interimTranscript, error, isSupported, start, stop };
}
