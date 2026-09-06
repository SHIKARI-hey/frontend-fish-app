import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, Stethoscope, Loader2, MapPin, Video, PhoneOff, Paperclip, FileText, Camera, Check, VideoOff, SwitchCamera, UserCheck, Plus } from "lucide-react";
import { BottomNav, PhoneFrame } from "@/components/BottomNav";
import { getAIAssistantResponse, getAIVideoCallResponse, MediaAttachment } from "@/lib/gemini";
import { useLanguage } from "@/lib/languageContext";

export const Route = createFileRoute("/assistant")({
  component: AssistantPage,
  head: () => ({
    meta: [
      { title: "AI Fish Doctor — Live Chat & Pond Scanner" },
      { name: "description", content: "Chat with AI Fish Doctor for instant aquaculture guidance." },
    ],
  }),
});

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  attachment?: { name: string; type: string; mimeType: string; url: string };
  time: string;
}

function parseInlineBold(text: string) {
  if (!text) return "";
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-extrabold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function AssistantPage() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Hello! I am your official Fish Doctor AI. How can I assist you with your fish farm, water parameters, disease diagnosis, or feeding ration today?",
      time: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLocationInfo, setUserLocationInfo] = useState<{ coords?: string; city?: string }>({ city: "Accra & Ashanti Region, Ghana" });

  // Attachment State
  const [attachment, setAttachment] = useState<{ name: string; type: string; mimeType: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen Live Video Stream Inspection State
  const [isVideoInspectionOpen, setIsVideoInspectionOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");
  const [videoAnalysis, setVideoAnalysis] = useState<string>("");
  const [videoLoading, setVideoLoading] = useState(false);

  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserLocationInfo({ coords: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, city: `GPS (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)` });
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    if (isVideoInspectionOpen) {
      startWebcam(cameraFacing);
    } else {
      stopWebcam();
    }
  }, [isVideoInspectionOpen, cameraFacing]);

  const startWebcam = async (facing: "user" | "environment") => {
    stopWebcam();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera fallback", err);
    }
  };

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleCaptureFrameAndAnalyze = async () => {
    if (!webcamVideoRef.current) return;
    setVideoLoading(true);
    try {
      const video = webcamVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const res = await getAIAssistantResponse(
          "Analyze this live video frame of the fish pond or fish. Describe fish activity, water clarity, and any observable signs.",
          language,
          [{ mimeType: "image/jpeg", data: dataUrl }]
        );
        setVideoAnalysis(res);
      }
    } catch (err) {
      console.error("Frame analysis error:", err);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput && !attachment) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: trimmedInput || (attachment?.type === "image" ? "Sent a photo for assessment" : "Sent an attachment"),
      attachment: attachment || undefined,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");
    const currentAttachment = attachment;
    setAttachment(null);
    setLoading(true);

    try {
      let attachments: MediaAttachment[] | undefined = undefined;
      if (currentAttachment) {
        attachments = [{ mimeType: currentAttachment.mimeType, data: currentAttachment.url }];
      }

      const replyText = await getAIAssistantResponse(
        trimmedInput || "Please analyze this attached file or image for my fish farm.",
        language,
        attachments,
        userLocationInfo
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          type: file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "file",
          mimeType: file.type || "application/octet-stream",
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <PhoneFrame>
      {/* Header */}
      <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#0F6236]/10 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/home" className="p-1 hover:bg-emerald-50 rounded-full cursor-pointer">
            <ArrowLeft className="w-5.5 h-5.5 text-gray-900" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0F6236]/10 border border-[#0F6236]/20 flex items-center justify-center text-[#0F6236] shrink-0">
              <Stethoscope className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-gray-900 leading-tight flex items-center gap-1.5">
                Fish Doctor AI
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold">
                Autonomous Vision & Aquaculture Vet
              </p>
            </div>
          </div>
        </div>

        {/* Video Scanner CTA Button */}
        <button
          onClick={() => setIsVideoInspectionOpen(true)}
          className="p-2.5 rounded-2xl bg-[#0F6236] hover:bg-[#0B4D29] text-white shadow-md flex items-center gap-1.5 font-extrabold text-xs cursor-pointer transition-all active:scale-95"
          title="Open Live Video Inspection"
        >
          <Video className="w-4 h-4" />
          <span>Live Vision</span>
        </button>
      </header>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-28">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-3xl p-4 shadow-xs text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#0F6236] text-white font-medium rounded-tr-xs"
                  : "bg-white text-gray-900 border border-gray-200 rounded-tl-xs"
              }`}
            >
              {/* Attachment in Message */}
              {msg.attachment && (
                <div className="mb-2 rounded-2xl overflow-hidden border border-white/20">
                  {msg.attachment.type === "image" ? (
                    <img src={msg.attachment.url} alt="Attachment" className="max-h-48 w-full object-cover" />
                  ) : (
                    <div className="p-3 bg-black/10 flex items-center gap-2 text-xs">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{msg.attachment.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div className="space-y-1.5">
                {msg.text.split("\n").map((line, idx) => {
                  if (line.startsWith("### ")) {
                    return <h4 key={idx} className="font-extrabold text-sm text-gray-900 mt-2 mb-1">{line.replace("### ", "")}</h4>;
                  }
                  if (line.startsWith("- ")) {
                    const content = line.substring(2);
                    return (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-800 font-medium my-0.5">
                        <span className="text-[#0F6236] font-bold">•</span>
                        <span>{parseInlineBold(content)}</span>
                      </div>
                    );
                  }
                  return <p key={idx} className="text-xs font-medium my-0.5">{parseInlineBold(line)}</p>;
                })}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400 font-medium">{msg.time}</span>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#0F6236] font-extrabold bg-white p-3.5 rounded-2xl border border-gray-200 w-fit shadow-md">
            <Loader2 className="w-4 h-4 animate-spin text-[#0F6236]" /> Fish Doctor AI thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Bar */}
      {attachment && (
        <div className="mx-5 mb-2 p-2.5 bg-white border border-gray-200 rounded-2xl flex items-center justify-between text-xs shadow-md">
          <div className="flex items-center gap-2 overflow-hidden">
            {attachment.type === "image" ? (
              <img src={attachment.url} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <FileText className="w-6 h-6 text-[#0F6236]" />
            )}
            <span className="truncate max-w-[200px] font-bold text-gray-800">{attachment.name}</span>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="fixed bottom-16 left-0 right-0 max-w-[430px] mx-auto p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center gap-2 z-20"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*,.pdf"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:text-[#0F6236] hover:bg-emerald-50 transition-all cursor-pointer"
          title="Attach photo or document"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask AI Doctor about fish diseases, water pH...`}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#0F6236]/20"
        />

        <button
          type="submit"
          disabled={!input.trim() && !attachment}
          className="p-2.5 rounded-2xl bg-[#0F6236] hover:bg-[#0B4D29] text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-[#0F6236]/20"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* ─── FULLSCREEN LIVE VIDEO STREAM INSPECTION MODAL ─── */}
      {isVideoInspectionOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between">
          <video
            ref={webcamVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover absolute inset-0"
          />

          {/* Top Bar */}
          <div className="w-full flex items-center justify-between text-white z-20 pt-6 px-5 bg-gradient-to-b from-black/80 to-transparent pb-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" /> Live Pond Vision Inspection
            </h3>
            <button
              onClick={() => setIsVideoInspectionOpen(false)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Analysis Overlay Banner if frame captured */}
          {videoAnalysis && (
            <div className="mx-5 my-auto z-20 max-w-sm p-4 rounded-3xl bg-black/80 border border-emerald-400/40 text-white backdrop-blur-md space-y-2 shadow-2xl">
              <div className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> Frame Diagnosis
              </div>
              <p className="text-xs font-medium text-emerald-100 leading-relaxed max-h-48 overflow-y-auto">
                {videoAnalysis}
              </p>
            </div>
          )}

          {/* Bottom Control Bar */}
          <div className="w-full max-w-sm p-6 mb-4 z-20 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
            <button
              onClick={toggleCameraFacing}
              className="p-3.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer shadow-lg"
              title="Flip Camera"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>

            <button
              onClick={handleCaptureFrameAndAnalyze}
              disabled={videoLoading}
              className="px-6 py-3.5 rounded-full bg-[#0F6236] hover:bg-[#0B4D29] text-white font-extrabold text-sm shadow-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {videoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span>Diagnose Frame</span>
            </button>

            <button
              onClick={() => setIsVideoInspectionOpen(false)}
              className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl cursor-pointer transition-all active:scale-95"
              title="Close Vision"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </PhoneFrame>
  );
}
