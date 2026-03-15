import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Mic, MicOff, Play, RefreshCw, Sparkles, Image as ImageIcon, MessageCircle } from "lucide-react";
import { LiveCanvas } from "./components/LiveCanvas";
import confetti from "canvas-confetti";
import { getAIService, createChatService, AIService, ChatService, Character } from "./services/ai";

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  const aiServiceRef = useRef<AIService>(getAIService());
  const liveServiceRef = useRef<ChatService | null>(null);

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [transcriptions, setTranscriptions] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setIsAnalyzing(true);
      try {
        const segs = await aiServiceRef.current.segmentDrawing(base64);
        setCharacters(segs);
        
        // Auto-start adventure mode
        if (liveServiceRef.current) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD93D', '#FF6B6B', '#4CAF50']
          });
          liveServiceRef.current.sendImage(base64);
          // We need to update the session with new instructions
          // For now, we'll restart the session with the image context
          stopLiveSession();
          setTimeout(() => startLiveSession(base64, segs), 500);
        }
      } catch (err) {
        console.error("Vision analysis failed", err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startLiveSession = async (currentImage?: string, currentCharacters?: Character[]) => {
    const activeImage = currentImage || image;
    const activeCharacters = currentCharacters || characters;

    const systemInstruction = !activeImage 
      ? `You are a warm, bubbly Storytelling Scout. A child has just entered your magical world! 
         Your goal: Say hello, ask for their name, their age, and what they love to draw! 
         Keep it super fun, simple, and encouraging. Use lots of "Wow!" and "Amazing!"`
      : `You are a warm Storytelling Scout talking to a child about their drawing.
      
      RULES:
      1. MANDATORY: You MUST call 'highlight_character' with the correct ID BEFORE you mention or ask about any character in the drawing.
      2. For each character, your goal is to learn their NAME, AGE, and ROLE (what they do).
      3. MANDATORY: You MUST discuss ALL characters in the drawing and learn their details BEFORE you generate any new story images. Do not use 'generate_story_image' until you have learned the name, age, and role of every character listed below.
      4. MANDATORY: As soon as you learn a character's name, age, or role, call 'update_character_info' to save it.
      5. The child sees a magical golden halo appear when you call 'highlight_character'. Say things like "Look at the magic glow around this friend!"
      6. Ask one simple question at a time.
      7. Be extremely bubbly and excited!
      8. ONLY after meeting every character, use 'generate_story_image' to create a new scene of the characters together, or whenever the child asks to see a new picture.
      
      Characters in the drawing (USE THESE IDs EXACTLY):
      ${activeCharacters.map(c => `- ID: "${c.id}" (Description: ${c.description}${c.name ? `, Name: ${c.name}` : ""}${c.age ? `, Age: ${c.age}` : ""}${c.role ? `, Role: ${c.role}` : ""})`).join("\n")}`;

    const callbacks = {
      onAudioChunk: (base64Audio: string) => {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const pcm = new Int16Array(bytes.buffer);
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          nextStartTimeRef.current = audioContextRef.current.currentTime;
        }

        const buffer = audioContextRef.current.createBuffer(1, pcm.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < pcm.length; i++) channelData[i] = pcm[i] / 32768;

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        
        const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
      },
      onInterrupted: () => {
        nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
      },
      onHighlightCharacter: (id: string) => {
        setHighlightedId(id);
      },
      onUpdateCharacterInfo: (id: string, info: { name?: string; age?: string; role?: string }) => {
        setCharacters(prev => prev.map(c => 
          c.id === id ? { ...c, ...info } : c
        ));
      },
      onGenerateImage: async (prompt: string) => {
        setIsGeneratingImage(true);
        const img = await aiServiceRef.current.generateStoryImage(prompt, image || undefined);
        if (img) {
          setGeneratedImages(prev => [img, ...prev]);
          
          // Screen Shake
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 500);

          // Massive Confetti Blast
          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          }, 250);

          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF69B4', '#00CED1', '#FF4500', '#32CD32']
          });
        }
        setIsGeneratingImage(false);
      },
      onTranscription: (text: string, isUser: boolean) => {
        setTranscriptions(prev => [...prev, { text, isUser }]);
      },
      onOpen: () => {
        setIsLive(true);
        if (activeImage) {
          liveServiceRef.current?.sendImage(activeImage);
        }
        startMic();
      },
      onClose: () => {
        setIsLive(false);
        stopMic();
      },
      onError: (err: any) => {
        console.error("Live session error", err);
        setIsLive(false);
      }
    };

    liveServiceRef.current = createChatService(callbacks);
    await liveServiceRef.current.connect(systemInstruction);
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm.buffer)));
        liveServiceRef.current?.sendAudio(base64);
      };

      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error("Mic access failed", err);
    }
  };

  const stopMic = () => {
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
  };

  const stopLiveSession = () => {
    liveServiceRef.current?.close();
    setIsLive(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF9E6] font-sans text-[#4A4A4A] overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-10 left-10 w-32 h-32 bg-[#FFD93D]/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-48 h-48 bg-[#FF6B6B]/10 rounded-full blur-3xl" 
        />
      </div>

      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFF9E6] p-4"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-white p-8 rounded-[50px] shadow-2xl border-8 border-white flex flex-col items-center max-w-md w-full text-center"
            >
              <div className="bg-[#FF6B6B] p-6 rounded-full mb-6 shadow-lg">
                <Sparkles className="text-white w-16 h-16" />
              </div>
              <h1 className="text-6xl font-black text-[#2D3436] mb-4">DoodleTales</h1>
              <p className="text-xl font-medium text-[#636E72] mb-8">Ready for a magical adventure?</p>
              <button
                onClick={() => {
                  setHasEntered(true);
                  startLiveSession();
                }}
                className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white py-6 rounded-3xl font-black text-3xl shadow-xl transform transition-all hover:scale-105 active:scale-95"
              >
                LET'S GO! 🚀
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              x: shouldShake ? [0, -10, 10, -10, 10, 0] : 0
            }}
            transition={{
              x: { duration: 0.4, ease: "easeInOut" }
            }}
            className="relative z-10 h-screen flex flex-col p-4 md:p-8"
          >
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#FF6B6B] p-2 rounded-xl shadow-md rotate-3">
                  <Sparkles className="text-white w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black text-[#2D3436]">DoodleTales</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {isLive && (
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border-2 border-[#4CAF50]/20">
                    <div className="w-3 h-3 bg-[#4CAF50] rounded-full animate-pulse" />
                    <span className="font-bold text-sm">Scout is here!</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setImage(null);
                    setCharacters([]);
                    setGeneratedImages([]);
                    setTranscriptions([]);
                    stopLiveSession();
                    setTimeout(() => startLiveSession(), 500);
                  }}
                  className="bg-white p-3 rounded-2xl shadow-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-6 h-6 text-[#4A4A4A]" />
                </button>
              </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
              {/* Left Column: Focus Area */}
              <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                <AnimatePresence mode="wait">
                  {generatedImages.length > 0 ? (
                    <motion.div
                      key="magic-scenes-focus"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="flex-1 flex flex-col gap-4 min-h-0"
                    >
                      <div className="flex items-center justify-between px-4">
                        <h2 className="text-3xl font-black text-[#FF6B6B] flex items-center gap-3">
                          <Sparkles className="w-8 h-8" />
                          The Adventure Continues!
                        </h2>
                        {isGeneratingImage && (
                          <div className="flex items-center gap-2 text-[#FF6B6B] font-bold animate-pulse">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Drawing more magic...
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 bg-white rounded-[40px] shadow-2xl border-8 border-white overflow-hidden relative group">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={generatedImages[0]}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="w-full h-full p-4 flex items-center justify-center"
                          >
                            <img 
                              src={generatedImages[0]} 
                              alt="Latest Magic Scene" 
                              className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                              referrerPolicy="no-referrer"
                            />
                          </motion.div>
                        </AnimatePresence>
                        
                        {/* Floating Badge */}
                        <div className="absolute top-8 right-8 bg-[#FF6B6B] text-white px-6 py-2 rounded-full font-black shadow-xl rotate-3">
                          NEW SCENE!
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="original-drawing-focus"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col gap-4 min-h-0"
                    >
                      <div className="flex-1 relative bg-white rounded-[40px] shadow-2xl border-8 border-white overflow-hidden flex items-center justify-center">
                        {!image ? (
                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-[#FFFDF0] transition-colors group p-8"
                          >
                            <div className="bg-[#FFD93D] p-8 rounded-full mb-6 shadow-xl group-hover:rotate-12 transition-transform">
                              <Upload className="w-16 h-16 text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-[#2D3436] mb-2 text-center">Show me your drawing!</h2>
                            <p className="text-xl text-[#636E72] text-center">Click to upload a photo of your art</p>
                            <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                          </motion.label>
                        ) : (
                          <div className="w-full h-full p-4 flex items-center justify-center">
                            <LiveCanvas
                              image={image}
                              characters={characters}
                              highlightedId={highlightedId}
                            />
                            {isAnalyzing && (
                              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                <RefreshCw className="w-16 h-16 text-[#FFD93D] animate-spin mb-4" />
                                <h3 className="text-3xl font-black text-[#2D3436]">Waking up your drawing...</h3>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Sidebar */}
              <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                {/* Scout's Bubble */}
                <div className="flex-[0.6] bg-white rounded-[32px] p-6 shadow-xl border-4 border-[#FFD93D]/20 flex flex-col min-h-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#FFD93D] rounded-full flex items-center justify-center shadow-inner">
                      <MessageCircle className="text-white w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black">Scout's Story</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {transcriptions.slice(-10).map((t, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: t.isUser ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className={`p-4 rounded-2xl text-lg font-medium ${
                          t.isUser 
                            ? "bg-[#E3F2FD] ml-6 rounded-tr-none" 
                            : "bg-[#F1F8E9] mr-6 rounded-tl-none"
                        }`}
                      >
                        {t.text}
                      </motion.div>
                    ))}
                    {transcriptions.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-center p-8">
                        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                        <p>Say hello to the Storytelling Scout!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary View: Original Drawing or Gallery */}
                <div className="flex-[0.4] bg-white rounded-[32px] p-6 shadow-xl border-4 border-[#4CAF50]/20 flex flex-col min-h-0">
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                    {generatedImages.length > 0 ? (
                      <>
                        <ImageIcon className="text-[#4CAF50] w-6 h-6" />
                        Your Original Art
                      </>
                    ) : (
                      <>
                        <Sparkles className="text-[#4CAF50] w-6 h-6" />
                        Adventure Log
                      </>
                    )}
                  </h3>
                  
                  <div className="flex-1 overflow-hidden rounded-2xl border-2 border-gray-100 relative">
                    {generatedImages.length > 0 ? (
                      <div className="w-full h-full p-2">
                        <img 
                          src={image!} 
                          alt="Original" 
                          className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={() => {
                            // Optional: Add a way to swap back or zoom
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 p-4 text-center italic">
                        <Play className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">Upload a drawing to start the log!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E0E0E0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D0D0D0;
        }
      `}</style>
    </div>
  );
}
