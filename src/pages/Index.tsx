import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";

// Call state machine
type CallState = "idle" | "connecting" | "listening" | "speaking";

const AGENT_ID = "agent_7901k39vv8j4ffda7mtpk4vfas54";

const Index = () => {
  const [state, setState] = useState<CallState>("idle");
  const convaiRef = useRef<any>(null);

  const statusText = useMemo(() => {
    switch (state) {
      case "connecting":
        return "Connecting...";
      case "listening":
        return "Listening... Tap to end conversation";
      case "speaking":
        return "Baik is responding...";
      default:
        return "Ready to help plan your ride";
    }
  }, [state]);

  const getAriaLabel = useMemo(() => {
    switch (state) {
      case "listening":
        return "End conversation";
      case "connecting":
      case "speaking":
        return "Please wait";
      default:
        return "Start talking to Baik";
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
    console.log("Attempting to start conversation...");

    try {
      const convaiEl = document.querySelector("elevenlabs-convai") as any;
      console.log("ConvAI element found:", !!convaiEl);
      console.log("ConvAI methods available:", {
        startConversation: typeof convaiEl?.startConversation,
        endConversation: typeof convaiEl?.endConversation
      });

      if (convaiEl?.startConversation) {
        console.log("Calling startConversation...");
        await convaiEl.startConversation();
        console.log("Conversation started successfully");
        setState("listening");
      } else {
        console.error("ConvAI element not found or startConversation method unavailable");
        setState("idle");
      }
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setState("idle");
    }
  }

  async function endCall() {
    try {
      const convaiEl = document.querySelector("elevenlabs-convai") as any;
      if (convaiEl?.endConversation) {
        await convaiEl.endConversation();
      }
    } catch (err) {
      console.error("Failed to end conversation:", err);
    } finally {
      setState("idle");
    }
  }

  async function handleMicButtonClick() {
    if (state === "idle") {
      await startCall();
    } else if (state === "listening") {
      await endCall();
    }
    // Do nothing for connecting/speaking states
  }

  // Listen for ElevenLabs ConvAI events to update UI state
  useEffect(() => {
    console.log("Setting up ElevenLabs ConvAI event listeners...");
    
    const setupListeners = () => {
      const convaiEl = document.querySelector("elevenlabs-convai") as any;
      console.log("ConvAI element in useEffect:", !!convaiEl);
      
      if (!convaiEl) {
        console.log("ConvAI element not found, retrying in 1 second...");
        setTimeout(setupListeners, 1000);
        return;
      }

      const onSpeakingStart = () => {
        console.log("Agent started speaking");
        setState((s) => (s !== "idle" ? "speaking" : s));
      };
      const onListening = () => {
        console.log("Agent listening");
        setState((s) => (s !== "idle" ? "listening" : s));
      };
      const onDisconnect = () => {
        console.log("Conversation ended");
        setState("idle");
      };

      try {
        convaiEl.addEventListener?.("conversation-started", onListening);
        convaiEl.addEventListener?.("agent-speaking-started", onSpeakingStart);
        convaiEl.addEventListener?.("agent-speaking-ended", onListening);
        convaiEl.addEventListener?.("conversation-ended", onDisconnect);
        console.log("Event listeners attached successfully");
      } catch (error) {
        console.error("Failed to attach event listeners:", error);
      }

      return () => {
        try {
          convaiEl.removeEventListener?.("conversation-started", onListening);
          convaiEl.removeEventListener?.("agent-speaking-started", onSpeakingStart);
          convaiEl.removeEventListener?.("agent-speaking-ended", onListening);
          convaiEl.removeEventListener?.("conversation-ended", onDisconnect);
        } catch {}
      };
    };

    const cleanup = setupListeners();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">

      {/* Main */}
      <main className="flex-1 flex items-center justify-center bg-app-gradient">
        <section className="w-full max-w-xl mx-auto px-6 py-14 text-center select-none">
          <h1 className="sr-only">Baik – AI Cycling Assistant</h1>
          <img
            src="/lovable-uploads/fad0ebad-1ecd-45e4-b861-211a6115ef9a.png"
            alt="Baik logo - AI cycling assistant"
            className="mx-auto mb-8 h-28 md:h-32 w-auto"
            loading="eager"
          />
          <p
            className={`text-lg md:text-xl mb-10 ${statusClass}`}
            aria-live="polite"
            role="status"
          >
            {statusText}
          </p>

          <div className="flex items-center justify-center">
            <Button
             variant="neonMic"
             size="xlCircle"
             className={`
               transition-all duration-300 ease-in-out
               ${state === "listening" ? "neon-glow-listening" : ""}
               ${state === "connecting" ? "neon-glow-connecting opacity-75 cursor-not-allowed" : ""}
               ${state === "speaking" ? "neon-glow-speaking opacity-75 cursor-not-allowed" : ""}
               ${state === "idle" ? "neon-glow-idle" : ""}
             `}
             onClick={handleMicButtonClick}
             disabled={state === "connecting" || state === "speaking"}
             aria-label={getAriaLabel}
            >
              {state === "connecting" ? (
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="animate-spin" />
                  Connecting...
                </div>
              ) : state === "listening" ? (
                <span className="text-white font-semibold">Listening...</span>
              ) : state === "speaking" ? (
                <span className="text-white font-semibold">Speaking...</span>
              ) : (
                <Mic className="size-20 text-white" aria-hidden="true" />
              )}
            </Button>
          </div>
        </section>
      </main>

      {/* Hidden ElevenLabs ConvAI widget (provides the voice assistant) */}
      <elevenlabs-convai
        agent-id={AGENT_ID}
        style={{ display: "none" }}
      ></elevenlabs-convai>
    </div>
  );
};

export default Index;
