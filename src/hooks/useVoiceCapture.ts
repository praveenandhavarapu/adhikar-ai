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
//
// RELIABILITY NOTE: speech recognition delivers its results asynchronously, so
// we must NOT read the transcript the instant the recorder stops — the final
// (and even some interim) results often arrive a beat later. Previously that
// race made the transcript come back empty even when the citizen spoke clearly,
// so the bot kept asking them to repeat. We now (a) capture interim results too
// so nothing is lost, and (b) wait for BOTH the audio blob to be ready AND the
// recogniser to actually end (with a safety timeout) before reporting the
// result.
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
  const finalRef = useRef<string>('');       // finalised recognition results
  const interimRef = useRef<string>('');     // latest un-finalised results
  const startedAtRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const mimeRef = useRef<string>('');

  // Coordination state so we only report once both halves are ready.
  const blobRef = useRef<Blob | null>(null);
  const usedMimeRef = useRef<string>('');
  const recognitionDoneRef = useRef<boolean>(false);
  const doneRef = useRef<boolean>(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupported(
      typeof (window as any).MediaRecorder !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  const cleanup = useCallback(() => {
    if (finishTimerRef.current) { clearTimeout(finishTimerRef.current); finishTimerRef.current = null; }
    try { recognitionRef.current?.stop(); } catch { /* no-op */ }
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Emit the result once the audio blob exists AND recognition has ended
  // (or there is no recogniser / the safety timeout fired). Guarded so it runs
  // exactly once per recording.
  const finalize = useCallback(() => {
    if (doneRef.current) return;
    if (!blobRef.current) return;                 // recorder hasn't stopped yet
    if (recognitionRef.current && !recognitionDoneRef.current) return; // still flushing
    doneRef.current = true;

    const transcript = [finalRef.current.trim(), interimRef.current.trim()]
      .filter(Boolean)
      .join(' ')
      .trim();
    const durationMs = Date.now() - startedAtRef.current;
    const blob = blobRef.current;
    const usedMime = usedMimeRef.current || 'audio/webm';
    cleanup();
    setRecording(false);
    onDone({ blob, mime: usedMime, transcript, durationMs });
  }, [cleanup, onDone]);

  const start = useCallback(async () => {
    chunksRef.current = [];
    finalRef.current = '';
    interimRef.current = '';
    blobRef.current = null;
    recognitionDoneRef.current = false;
    doneRef.current = false;
    const mime = pickMime();
    mimeRef.current = mime;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      usedMimeRef.current = recorder.mimeType || mime || 'audio/webm';
      blobRef.current = new Blob(chunksRef.current, { type: usedMimeRef.current });
      finalize();
    };

    // Parallel silent transcription (best-effort).
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      try {
        const rec = new SR();
        rec.lang = LOCALE[lang] || 'hi-IN';
        rec.continuous = true;
        rec.interimResults = true;   // capture speech even if no "final" fires before stop
        rec.maxAlternatives = 1;
        rec.onresult = (e: any) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            const chunk = (res[0]?.transcript || '').trim();
            if (!chunk) continue;
            if (res.isFinal) finalRef.current += (finalRef.current ? ' ' : '') + chunk;
            else interim += (interim ? ' ' : '') + chunk;
          }
          interimRef.current = interim;
        };
        // If recognition drops out on its own, don't block finalisation.
        rec.onerror = () => { recognitionDoneRef.current = true; finalize(); };
        rec.onend = () => { recognitionDoneRef.current = true; finalize(); };
        recognitionRef.current = rec;
        rec.start();
      } catch {
        recognitionDoneRef.current = true; // STT unavailable — audio still records
      }
    } else {
      recognitionDoneRef.current = true;
    }

    startedAtRef.current = Date.now();
    recorder.start();
    setRecording(true);
  }, [lang, finalize]);

  const stop = useCallback(() => {
    // Stop the recogniser first so its final results flush, then the recorder.
    try { recognitionRef.current?.stop(); } catch { /* no-op */ }
    try { recorderRef.current?.stop(); } catch { setRecording(false); }
    // Safety net: never hang if onend/onstop don't fire (some mobile browsers).
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = setTimeout(() => {
      recognitionDoneRef.current = true;
      if (!blobRef.current && chunksRef.current.length) {
        usedMimeRef.current = mimeRef.current || 'audio/webm';
        blobRef.current = new Blob(chunksRef.current, { type: usedMimeRef.current });
      }
      finalize();
    }, 1800);
  }, [finalize]);

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
