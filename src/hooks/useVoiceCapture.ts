// ============================================================================
// useVoiceCapture — records the citizen's actual voice as an audio clip while
// silently transcribing it in the background.
//
//   • MediaRecorder captures the real audio blob (played back as a voice note
//     and uploaded for the officer to hear).
//   • The browser Web Speech API runs in parallel, continuous mode, purely to
//     produce a transcript that feeds the backend classifier — it is NEVER
//     shown in the input box (that was the old behaviour the user disliked).
//
// The transcript is best-effort: on browsers without speech recognition the
// clip is still recorded, and the caller falls back to asking the citizen to
// type when no transcript comes back.
// ============================================================================
import { useCallback, useEffect, useRef, useState } from 'react';

const LOCALE: Record<string, string> = {
  hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', or: 'or-IN',
  mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', kn: 'kn-IN', ml: 'ml-IN',
  ur: 'ur-IN', as: 'as-IN', en: 'en-IN',
};

export interface VoiceResult {
  blob: Blob;
  mime: string;
  transcript: string;
  durationMs: number;
}

interface VoiceController {
  supported: boolean;      // MediaRecorder available (audio capture possible)
  recording: boolean;
  start: () => Promise<void>;
  stop: () => void;        // resolves via the onDone callback passed to start
}

function pickMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  const MR: any = (window as any).MediaRecorder;
  if (MR && typeof MR.isTypeSupported === 'function') {
    for (const c of candidates) if (MR.isTypeSupported(c)) return c;
  }
  return '';
}

export function useVoiceCapture(
  lang: string,
  onDone: (result: VoiceResult) => void,
): VoiceController {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const transcriptRef = useRef<string>('');
  const startedAtRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const mimeRef = useRef<string>('');

  useEffect(() => {
    setSupported(
      typeof (window as any).MediaRecorder !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  const cleanup = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* no-op */ }
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    chunksRef.current = [];
    transcriptRef.current = '';
    const mime = pickMime();
    mimeRef.current = mime;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const usedMime = recorder.mimeType || mime || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: usedMime });
      const durationMs = Date.now() - startedAtRef.current;
      cleanup();
      setRecording(false);
      onDone({ blob, mime: usedMime, transcript: transcriptRef.current.trim(), durationMs });
    };

    // Parallel silent transcription (best-effort).
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      try {
        const rec = new SR();
        rec.lang = LOCALE[lang] || 'hi-IN';
        rec.continuous = true;
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (e: any) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const chunk = e.results[i][0]?.transcript || '';
            if (chunk) transcriptRef.current += (transcriptRef.current ? ' ' : '') + chunk.trim();
          }
        };
        rec.onerror = () => { /* keep recording audio even if STT fails */ };
        recognitionRef.current = rec;
        rec.start();
      } catch { /* STT unavailable — audio still records */ }
    }

    startedAtRef.current = Date.now();
    recorder.start();
    setRecording(true);
  }, [lang, onDone, cleanup]);

  const stop = useCallback(() => {
    try { recorderRef.current?.stop(); } catch { setRecording(false); }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  return { supported, recording, start, stop };
}

// Read a Blob as a base64 string (no data-URL prefix) for JSON upload.
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}
