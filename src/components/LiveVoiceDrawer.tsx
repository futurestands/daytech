import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Volume2,
  X,
} from 'lucide-react';

type VoiceName = 'Zephyr' | 'Kore' | 'Fenrir' | 'Puck' | 'Charon';
type ConnectionState = 'idle' | 'connecting' | 'live' | 'error';

interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
}

const VOICE_OPTIONS: { name: VoiceName; label: string }[] = [
  { name: 'Zephyr', label: 'Zephyr (Balanced)' },
  { name: 'Kore', label: 'Kore (Warm)' },
  { name: 'Fenrir', label: 'Fenrir (Direct)' },
  { name: 'Puck', label: 'Puck (Energetic)' },
  { name: 'Charon', label: 'Charon (Deep)' },
];

const QUICK_PROMPTS = [
  'Compare DayTech SACCO and Finance plans in UGX',
  'Which services cover cybersecurity audits and cloud hosting?',
  'How do I request a formal quotation or book a demo?',
];

function float32ToPcmBase64(floatData: Float32Array): string {
  const int16 = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, floatData[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const chunkSize = 0x4000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < slice.length; j += 1) {
      binary += String.fromCharCode(slice[j]);
    }
  }
  return btoa(binary);
}

function base64PcmToFloat32(base64: string): Float32Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const float32 = new Float32Array(new ArrayBuffer(sampleCount * 4));
  for (let i = 0; i < sampleCount; i += 1) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / 32768;
  }
  return float32;
}

export function LiveVoiceDrawer({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<ConnectionState>('idle');
  const [voice, setVoice] = useState<VoiceName>('Zephyr');
  const [isMuted, setIsMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const stopPlaybackQueue = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore already-stopped sources
      }
    }
    activeSourcesRef.current = [];
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setAssistantSpeaking(false);
  }, []);

  const cleanupSession = useCallback(() => {
    stopPlaybackQueue();

    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (inputCtxRef.current) {
      inputCtxRef.current.close().catch(() => undefined);
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      outputCtxRef.current.close().catch(() => undefined);
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setMicLevel(0);
    setAssistantSpeaking(false);
  }, [stopPlaybackQueue]);

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  const appendTranscript = useCallback((speaker: 'user' | 'assistant', chunk: string) => {
    const clean = chunk.trim();
    if (!clean) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        const needsSpace = !last.text.endsWith(' ') && !clean.startsWith(' ');
        const updated = { ...last, text: `${last.text}${needsSpace ? ' ' : ''}${clean}` };
        return [...prev.slice(0, -1), updated];
      }
      return [...prev.slice(-24), { id: `${Date.now()}-${Math.random()}`, speaker, text: clean }];
    });
  }, []);

  const scheduleOutputAudio = useCallback((base64Audio: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => undefined);
    }

    const floatData = base64PcmToFloat32(base64Audio);
    if (floatData.length === 0) return;

    const buffer = ctx.createBuffer(1, floatData.length, 24000);
    buffer.copyToChannel(floatData, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
    activeSourcesRef.current.push(source);
    setAssistantSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((item) => item !== source);
      if (activeSourcesRef.current.length === 0) {
        setAssistantSpeaking(false);
      }
    };
  }, []);

  const startSession = useCallback(async () => {
    if (status === 'connecting' || status === 'live') return;
    cleanupSession();
    setErrorMsg(null);
    setStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/live-voice?voice=${voice}`);
      wsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        sourceRef.current = source;
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          if (isMutedRef.current) {
            setMicLevel(0);
            return;
          }
          const samples = event.inputBuffer.getChannelData(0);
          let sumSq = 0;
          for (let i = 0; i < samples.length; i += 1) {
            sumSq += samples[i] * samples[i];
          }
          const rms = Math.sqrt(sumSq / samples.length);
          setMicLevel(Math.min(100, Math.round(rms * 350)));

          const base64 = float32ToPcmBase64(samples);
          ws.send(JSON.stringify({ audio: base64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data));
          if (payload.type === 'ready') {
            setStatus('live');
          } else if (payload.type === 'audio' && payload.audio) {
            setStatus('live');
            scheduleOutputAudio(payload.audio);
          } else if (payload.type === 'interrupted') {
            stopPlaybackQueue();
          } else if (payload.type === 'inputTranscript' && payload.text) {
            appendTranscript('user', payload.text);
          } else if (payload.type === 'outputTranscript' && payload.text) {
            appendTranscript('assistant', payload.text);
          } else if (payload.type === 'error') {
            setErrorMsg(payload.error || 'Voice session encountered an error.');
            setStatus('error');
            cleanupSession();
          } else if (payload.type === 'closed') {
            setStatus('idle');
            cleanupSession();
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        setErrorMsg('Unable to connect to the live voice server.');
        setStatus('error');
        cleanupSession();
      };

      ws.onclose = () => {
        setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
        cleanupSession();
      };
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow microphone access in your browser to use voice.'
          : err instanceof Error
            ? err.message
            : 'Unable to access microphone.';
      setErrorMsg(message);
      setStatus('error');
      cleanupSession();
    }
  }, [status, voice, cleanupSession, scheduleOutputAudio, stopPlaybackQueue, appendTranscript]);

  const endSession = useCallback(() => {
    cleanupSession();
    setStatus('idle');
  }, [cleanupSession]);

  const sendTextPrompt = useCallback(
    (promptText: string) => {
      const trimmed = promptText.trim();
      if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ text: trimmed }));
      appendTranscript('user', trimmed);
      setTextInput('');
    },
    [appendTranscript]
  );

  const handleCloseDrawer = () => {
    endSession();
    onClose();
  };

  return (
    <div className="print:hidden">
        <aside
          aria-label="DayTech Live Voice Advisor"
          className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[82vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#0B1120] dark:bg-[#020617] text-white border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  status === 'live'
                    ? 'bg-emerald-400 animate-pulse'
                    : status === 'connecting'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-500'
                }`}
              />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold truncate">DayTech Voice Advisor</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {status === 'live'
                    ? assistantSpeaking
                      ? 'Speaking live audio...'
                      : isMuted
                        ? 'Microphone muted'
                        : 'Listening in real time'
                    : status === 'connecting'
                      ? 'Connecting voice session...'
                      : 'Real-time services, products & pricing guide'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseDrawer}
              aria-label="Close voice advisor"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls & Voice Picker */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#020617]/60 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>Voice</span>
              <select
                value={voice}
                disabled={status === 'live' || status === 'connecting'}
                onChange={(e) => setVoice(e.target.value as VoiceName)}
                className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-xs font-medium text-[#0B1120] dark:text-white disabled:opacity-60"
              >
                {VOICE_OPTIONS.map((opt) => (
                  <option key={opt.name} value={opt.name}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {status === 'live' && (
              <div className="flex items-center gap-2">
                <Volume2
                  className={`w-3.5 h-3.5 ${
                    assistantSpeaking ? 'text-[#2563EB] dark:text-[#06B6D4]' : 'text-slate-400'
                  }`}
                />
                <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] dark:bg-[#06B6D4] transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Transcript / Intro Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[340px]">
            {errorMsg && (
              <div className="p-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {transcripts.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Start a live voice conversation with DayTech Solutions to explore our 7 engineering services, 9 software products, multi-currency UGX/USD/KES pricing, or project scoping steps.
                </p>
                {status === 'live' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Try asking aloud or tap a prompt:
                    </p>
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendTextPrompt(q)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#020617] hover:border-[#2563EB] text-xs text-[#0B1120] dark:text-slate-200 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              transcripts.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      entry.speaker === 'user'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#0B1120] dark:text-slate-100'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-75 mb-0.5">
                      {entry.speaker === 'user' ? 'You' : 'DayTech Advisor'}
                    </p>
                    <p>{entry.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Text Follow-Up when Live */}
          {status === 'live' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTextPrompt(textInput);
              }}
              className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a quick follow-up..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020617] text-xs text-[#0B1120] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                aria-label="Send message to live session"
                className="p-2 rounded-lg bg-[#2563EB] text-white disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Action Footer */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-[#020617] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {status === 'live' ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    isMuted
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                      : 'border-slate-300 dark:border-slate-700 text-[#0B1120] dark:text-white'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isMuted ? 'Unmute' : 'Mute Mic'}</span>
                </button>
                <button
                  type="button"
                  onClick={endSession}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>End Call</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/quote"
                  onClick={handleCloseDrawer}
                  className="text-xs font-semibold text-[#2563EB] dark:text-[#06B6D4] hover:underline"
                >
                  Open Quote Form
                </Link>
                <button
                  type="button"
                  disabled={status === 'connecting'}
                  onClick={() => void startSession()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold"
                >
                  {status === 'connecting' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Start Live Voice</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </aside>
    </div>
  );
}
