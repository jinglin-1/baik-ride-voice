import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import Vapi from "@vapi-ai/web";

// Call state machine
type CallState = "idle" | "connecting" | "listening" | "speaking";

const ASSISTANT_ID = "9bdc2710-e0c2-4b4b-b54e-90712824d089";
const PUBLIC_KEY = "4a9c9a16-1d37-4269-a2cb-36cfa6aae4f5";

const Index = () => {
  const [state, setState] = useState<CallState>("idle");
  const vapiRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Vapi Web SDK (installed dependency)
    try {
      vapiRef.current = new (Vapi as any)(PUBLIC_KEY);
    } catch (e) {
      // SDK init is best-effort; embed widget will still work
      // console.warn("Vapi SDK init error:", e);
    }
  }, []);

  const statusText = useMemo(() => {
    switch (state) {
      case "connecting":
        return "Connecting...";
      case "listening":
        return "Listening...";
      case "speaking":
        return "Baik is responding...";
      default:
        return "Ready to help plan your ride";
    }
  }, [state]);

  const statusClass = useMemo(() => {
    switch (state) {
      case "connecting":
        return "text-status-connecting";
      case "listening":
        return "text-status-listening";
      case "speaking":
        return "text-status-speaking";
      default:
        return "text-muted-foreground";
    }
  }, [state]);

  async function startCall() {
    setState("connecting");

    // Prefer the embed widget if present
    const widgetEl = document.querySelector("vapi-widget") as any;

    try {
      if (widgetEl?.start) {
        await widgetEl.start();
        // Assume widget sets up the call; we'll enter listening state
        setState("listening");
      } else if (vapiRef.current?.start) {
        // Fallback to SDK usage if widget is not available yet
        await (vapiRef.current as any).start({ assistantId: ASSISTANT_ID });
        setState("listening");
      } else {
        setState("idle");
      }
    } catch (err) {
      setState("idle");
    }
  }

  async function endCall() {
    try {
      const widgetEl = document.querySelector("vapi-widget") as any;
      if (widgetEl?.end) await widgetEl.end();
      if ((vapiRef.current as any)?.hangUp) await (vapiRef.current as any).hangUp();
      if ((vapiRef.current as any)?.end) await (vapiRef.current as any).end();
    } finally {
      setState("idle");
    }
  }

  // Optional: simulate speaking state once audio response begins via widget custom events if present
  useEffect(() => {
    const widgetEl = document.querySelector("vapi-widget") as any;
    if (!widgetEl) return;
    const onSpeakingStart = () => setState((s) => (s !== "idle" ? "speaking" : s));
    const onListening = () => setState((s) => (s !== "idle" ? "listening" : s));

    try {
      widgetEl.addEventListener?.("assistant-speaking-start", onSpeakingStart);
      widgetEl.addEventListener?.("assistant-speaking-end", onListening);
    } catch {
      // best-effort only
    }

    return () => {
      try {
        widgetEl.removeEventListener?.("assistant-speaking-start", onSpeakingStart);
        widgetEl.removeEventListener?.("assistant-speaking-end", onListening);
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 px-4 flex items-center">
        <div className="grid grid-cols-3 items-center w-full">
          <div />
          <div className="flex items-center justify-center">
            <img
              src="/lovable-uploads/fad0ebad-1ecd-45e4-b861-211a6115ef9a.png"
              alt="Baik logo - AI cycling assistant"
              className="h-8 w-auto"
              loading="eager"
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-lg"
              onClick={endCall}
              aria-label="End call"
            >
              End
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center bg-app-gradient">
        <section className="w-full max-w-xl mx-auto px-6 py-14 text-center select-none">
          <h1 className="sr-only">Baik – AI Cycling Assistant</h1>
          <p
            className={`text-lg md:text-xl mb-10 ${statusClass}`}
            aria-live="polite"
            role="status"
          >
            {statusText}
          </p>

          <div className="flex items-center justify-center">
            {state === "idle" || state === "connecting" || state === "listening" ? (
              <Button
                variant="mic"
                size="xlCircle"
                className={`transition-transform duration-300 will-change-transform ${
                  state === "listening" ? "ring-4 ring-primary/30" : ""
                } hover:scale-105 active:scale-95`}
                onClick={() => state === "idle" && startCall()}
                aria-label="Start talking to Baik"
              >
                {state === "connecting" ? (
                  <div className="flex items-center gap-2 text-status-connecting">
                    <Loader2 className="animate-spin" />
                    Connecting...
                  </div>
                ) : state === "listening" ? (
                  <span className="text-status-listening font-semibold">Listening...</span>
                ) : (
                  <Mic className="size-16 text-accent" aria-hidden="true" />
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                size="xlCircle"
                className="transition-transform duration-300 will-change-transform hover:scale-105 active:scale-95"
                aria-label="Baik is speaking"
              >
                Speaking...
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Hidden Vapi widget (provides the voice assistant) */}
      <vapi-widget
        assistant-id={ASSISTANT_ID}
        public-key={PUBLIC_KEY}
        style={{ display: "none" }}
      ></vapi-widget>
    </div>
  );
};

export default Index;
