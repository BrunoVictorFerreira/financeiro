import { useCallback, useRef } from 'react';

export function getRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(options: {
  lang?: string;
  onFinal: (transcript: string) => void;
  onError?: (message: string) => void;
  onEnded?: () => void;
}) {
  const recRef = useRef<SpeechRecognition | null>(null);
  const { lang = 'pt-BR', onFinal, onError, onEnded } = options;

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onError?.('Este navegador não suporta reconhecimento de voz. Use Chrome ou Edge no computador ou Android.');
      return;
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const text = ev.results[0]?.[0]?.transcript ?? '';
      onFinal(text.trim());
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') return;
      onError?.(ev.error === 'not-allowed' ? 'Permissão de microfone negada.' : `Erro de voz: ${ev.error}`);
    };

    rec.onend = () => {
      recRef.current = null;
      onEnded?.();
    };

    try {
      rec.start();
      recRef.current = rec;
    } catch (e) {
      onError?.(e instanceof Error ? e.message : 'Não foi possível iniciar o microfone.');
    }
  }, [lang, onFinal, onError, onEnded]);

  return { start, stop };
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}
