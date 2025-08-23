import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { useConversation } from "@elevenlabs/react";

// Call state machine
type CallState = "idle" | "listening" | "speaking";

const AGENT_ID = "agent_7901k39vv8j4ffda7mtpk4vfas54";

const Index = () => {
  const conversation = useConversation({
    onConnect: () => console.log("ElevenLabs conversation connected"),
    onDisconnect: () => console.log("ElevenLabs conversation disconnected"),
    onError: (error) => console.error("ElevenLabs conversation error:", error),
  });

  // Map ElevenLabs states to our UI states
  const state: CallState = useMemo(() => {
    if (conversation.status === "connected") {
      return conversation.isSpeaking ? "speaking" : "listening";
    }
    return "idle";
  }, [conversation.status, conversation.isSpeaking]);

  const statusText = useMemo(() => {
    switch (state) {
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
      case "speaking":
        return "Please wait";
      default:
        return "Start talking to Baik";
    }
  }, [state]);

  const statusClass = useMemo(() => {
    switch (state) {
      case "listening":
        return "text-status-listening";
      case "speaking":
        return "text-status-speaking";
      default:
        return "text-muted-foreground";
    }
  }, [state]);

  async function startCall() {
    console.log("Starting ElevenLabs conversation...");
    try {
      // For public agents, use the signedUrl approach
      const response = await fetch('/api/elevenlabs/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: AGENT_ID })
      });
      const { signedUrl } = await response.json();
      
      await conversation.startSession({ signedUrl });
      console.log("ElevenLabs conversation started successfully");
    } catch (err) {
      console.error("Failed to start ElevenLabs conversation:", err);
      // Fallback: try direct agent ID approach for testing
      try {
        await conversation.startSession({ 
          conversationToken: `agent_${AGENT_ID}`,
          agentId: AGENT_ID 
        } as any);
      } catch (fallbackErr) {
        console.error("Fallback approach also failed:", fallbackErr);
      }
    }
  }

  async function endCall() {
    console.log("Ending ElevenLabs conversation...");
    try {
      await conversation.endSession();
      console.log("ElevenLabs conversation ended successfully");
    } catch (err) {
      console.error("Failed to end ElevenLabs conversation:", err);
    }
  }

  async function handleMicButtonClick() {
    if (state === "idle") {
      await startCall();
    } else if (state === "listening") {
      await endCall();
    }
    // Do nothing for speaking states
  }

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
               ${state === "speaking" ? "neon-glow-speaking opacity-75 cursor-not-allowed" : ""}
               ${state === "idle" ? "neon-glow-idle" : ""}
             `}
             onClick={handleMicButtonClick}
             disabled={state === "speaking"}
             aria-label={getAriaLabel}
            >
              {state === "listening" ? (
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
    </div>
  );
};

export default Index;
