// ============================================================================
// useSpeechRecognition — live voice-to-text via the browser Web Speech API.
// Free, on-device, no key. Falls back gracefully when unsupported (Firefox,
// some mobile browsers): `supported` is false and the UI shows the text box.
//
// PRODUCTION SWAP POINT: for higher accuracy on rural regional speech, replace
// the body of start()/stop() with a call to Sarvam AI or Google Cloud Speech
// via a new Netlify function. The component contract (onResult) stays the same.
// ============================================================================
import { useCallback, useEffect, useRef, useState } from 'react';

// Map our app language codes to BCP-47 locales the engine understands.
const LOCALE: Record<string, string> = {
  hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', or: 'or-IN',
  mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', kn: 'kn-IN', ml: 'ml-IN',
  ur: 'ur-IN', as: 'as-IN', en: 'en-IN',
};

interface SpeechController {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition(
  lang: string,
  onResult: (text: string) => void,
): SpeechController {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* no-op */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = LOCALE[lang] || 'hi-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) onResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [lang, onResult]);

  // Clean up on unmount.
  useEffect(() => () => stop(), [stop]);

  return { supported, listening, start, stop };
}
