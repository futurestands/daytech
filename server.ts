import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createApiApp } from './server/app';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const ALLOWED_VOICES = new Set(['Zephyr', 'Kore', 'Fenrir', 'Puck', 'Charon']);

const DAYTECH_VOICE_SYSTEM_INSTRUCTION = `You are the official DayTech Solutions Live Voice Advisor.
DayTech Solutions ("Technology. Innovation. Impact.") is a Uganda-based enterprise technology company serving clients across Uganda, East Africa, and internationally.

Core services (7):
1. Custom Software Development (Web, mobile, enterprise & API integrations)
2. IT Infrastructure & Networking (Structured cabling, enterprise Wi-Fi, servers, office networking)
3. AI & Business Automation (Workflow automation, intelligent document & operations systems)
4. Cloud Computing & Hosting (Cloud migrations, managed hosting, backups, high-availability setups)
5. Web & Digital Systems (Corporate portals, e-commerce, digital client portals)
6. Cybersecurity & Audits (Security assessments, access controls, compliance hardening)
7. IT Consultancy & Training (Digital transformation strategy and staff capacity building)

Modular software products (9, priced in UGX, USD, or KES):
- DayTech SACCO (Available) — Cooperative & microfinance core banking, savings, loans, mobile money workflows
- DayTech HR & Payroll (Available) — Attendance, leave, statutory payroll & employee self-service
- DayTech HotelOS (Available) — Reservations, front desk, housekeeping & hospitality POS
- DayTech Farm (Beta) — Dairy, poultry, livestock, feed & farm accounting
- DayTech CRM (Available) — Sales pipeline, client interactions & customer support
- DayTech Inventory & POS (Available) — Multi-branch stock control, procurement & retail billing
- DayTech Meet (Under Development) — Video conferencing & virtual workspace collaboration
- DayTech Finance & Accounting (Available) — General ledger, invoicing, expense approvals & reporting
- DayTech WaterOps (Coming Soon) — Water utility metering, billing & field operations

Platform actions users can take on the website:
- Request a detailed formal quotation at /quote (assigns a DTQ reference number)
- Book a live product demonstration in East Africa Time (EAT / Africa/Kampala) at /demo (assigns a DTD reference number)
- Track enquiries, demos, and formal quotations (QTE reference numbers) in the Client Portal at /portal
- Pin their office or project site on the interactive coverage map and send general messages at /contact

Guidelines:
- Keep spoken answers clear, concise, practical, and natural for voice conversation.
- Do not fabricate client testimonials, unverified statistics, or street addresses.
- Guide prospective clients to /quote, /demo, /portal, or /contact when appropriate.`;

function attachLiveVoiceServer(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host || 'localhost';
      const parsedUrl = new URL(request.url || '/', `http://${host}`);
      if (parsedUrl.pathname !== '/api/live-voice') {
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs: WebSocket, request) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim() || '';
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error: 'Live voice service is not configured yet in server environment.',
          })
        );
        clientWs.close();
      }
      return;
    }

    const host = request.headers.host || 'localhost';
    const parsedUrl = new URL(request.url || '/', `http://${host}`);
    const requestedVoice = parsedUrl.searchParams.get('voice') || 'Zephyr';
    const voiceName = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : 'Zephyr';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    let activeSession: Awaited<ReturnType<typeof ai.live.connect>> | null = null;
    let clientClosed = false;

    const sessionPromise = ai.live
      .connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: DAYTECH_VOICE_SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            if (!clientClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready' }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientClosed || clientWs.readyState !== WebSocket.OPEN) return;
            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'inputTranscript',
                  text: content.inputTranscription.text,
                })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'outputTranscript',
                  text: content.outputTranscription.text,
                })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ type: 'audio', audio: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onerror: (err: unknown) => {
            if (!clientClosed && clientWs.readyState === WebSocket.OPEN) {
              const msg = err instanceof Error ? err.message : 'Live voice stream error.';
              clientWs.send(JSON.stringify({ type: 'error', error: msg }));
            }
          },
          onclose: () => {
            if (!clientClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
              clientWs.close();
            }
          },
        },
      })
      .then((session) => {
        if (clientClosed) {
          session.close();
          return null;
        }
        activeSession = session;
        return session;
      })
      .catch((err) => {
        if (!clientClosed && clientWs.readyState === WebSocket.OPEN) {
          const msg = err instanceof Error ? err.message : 'Unable to start Gemini Live session.';
          clientWs.send(JSON.stringify({ type: 'error', error: msg }));
          clientWs.close();
        }
        return null;
      });

    clientWs.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { audio?: string; text?: string };
        const session = activeSession || (await sessionPromise);
        if (!session || clientClosed) return;

        if (typeof msg.audio === 'string' && msg.audio.length > 0) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (typeof msg.text === 'string' && msg.text.trim().length > 0) {
          session.sendRealtimeInput({
            text: msg.text.trim(),
          });
        }
      } catch {
        // ignore invalid client packets
      }
    });

    const teardown = () => {
      clientClosed = true;
      if (activeSession) {
        try {
          activeSession.close();
        } catch {
          // ignore
        }
        activeSession = null;
      }
    };

    clientWs.on('close', teardown);
    clientWs.on('error', teardown);
  });
}

async function startServer() {
  const app = createApiApp();

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  attachLiveVoiceServer(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DayTech Solutions server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
