import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Character } from "../services/ai";

interface LiveCanvasProps {
  image: string;
  characters: Character[];
  highlightedId: string | null;
}

export const LiveCanvas: React.FC<LiveCanvasProps> = ({ image, characters, highlightedId }) => {
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const highlightedCharacter = characters.find(c => c.id === highlightedId);

  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgSize({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight
      });
    }
  };

  useEffect(() => {
    if (imgRef.current?.complete) {
      handleImageLoad();
    }
  }, [image]);

  // Re-calculate on window resize
  useEffect(() => {
    const handleResize = () => handleImageLoad();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden p-4">
      <div className="relative inline-block group">
        {/* Mirror Frame Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-[#FFD93D] via-[#FF6B6B] to-[#4CAF50] rounded-[32px] opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
        
        <img
          ref={imgRef}
          src={image}
          alt="Drawing"
          onLoad={handleImageLoad}
          className="relative z-0 max-w-full max-h-[70vh] object-contain rounded-2xl shadow-inner border-4 border-white"
          referrerPolicy="no-referrer"
        />

        {imgSize && (
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          >
            <AnimatePresence>
              {highlightedCharacter && (
                <motion.g
                  key={highlightedCharacter.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="15" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <radialGradient id="aura-gradient">
                      <stop offset="0%" stopColor="rgba(255, 215, 0, 0.6)" />
                      <stop offset="70%" stopColor="rgba(255, 215, 0, 0.2)" />
                      <stop offset="100%" stopColor="rgba(255, 215, 0, 0)" />
                    </radialGradient>
                  </defs>

                  {/* Large Aura */}
                  <motion.ellipse
                    cx={highlightedCharacter.box_2d[1] + (highlightedCharacter.box_2d[3] - highlightedCharacter.box_2d[1]) / 2}
                    cy={highlightedCharacter.box_2d[0] + (highlightedCharacter.box_2d[2] - highlightedCharacter.box_2d[0]) / 2}
                    rx={(highlightedCharacter.box_2d[3] - highlightedCharacter.box_2d[1]) * 0.8}
                    ry={(highlightedCharacter.box_2d[2] - highlightedCharacter.box_2d[0]) * 0.8}
                    fill="url(#aura-gradient)"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.7, 0.4]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Precise Border */}
                  <motion.rect
                    x={highlightedCharacter.box_2d[1]}
                    y={highlightedCharacter.box_2d[0]}
                    width={highlightedCharacter.box_2d[3] - highlightedCharacter.box_2d[1]}
                    height={highlightedCharacter.box_2d[2] - highlightedCharacter.box_2d[0]}
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="8"
                    filter="url(#glow)"
                    rx="12"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Corner Accents */}
                  <g stroke="#FFD700" strokeWidth="12" fill="none" strokeLinecap="round">
                    {/* Top Left */}
                    <path d={`M ${highlightedCharacter.box_2d[1]} ${highlightedCharacter.box_2d[0] + 40} L ${highlightedCharacter.box_2d[1]} ${highlightedCharacter.box_2d[0]} L ${highlightedCharacter.box_2d[1] + 40} ${highlightedCharacter.box_2d[0]}`} />
                    {/* Top Right */}
                    <path d={`M ${highlightedCharacter.box_2d[3] - 40} ${highlightedCharacter.box_2d[0]} L ${highlightedCharacter.box_2d[3]} ${highlightedCharacter.box_2d[0]} L ${highlightedCharacter.box_2d[3]} ${highlightedCharacter.box_2d[0] + 40}`} />
                    {/* Bottom Left */}
                    <path d={`M ${highlightedCharacter.box_2d[1]} ${highlightedCharacter.box_2d[2] - 40} L ${highlightedCharacter.box_2d[1]} ${highlightedCharacter.box_2d[2]} L ${highlightedCharacter.box_2d[1] + 40} ${highlightedCharacter.box_2d[2]}`} />
                    {/* Bottom Right */}
                    <path d={`M ${highlightedCharacter.box_2d[3] - 40} ${highlightedCharacter.box_2d[2]} L ${highlightedCharacter.box_2d[3]} ${highlightedCharacter.box_2d[2]} L ${highlightedCharacter.box_2d[3]} ${highlightedCharacter.box_2d[2] - 40}`} />
                  </g>
                </motion.g>
              )}
            </AnimatePresence>
          </svg>
        )}
      </div>
    </div>
  );
};

