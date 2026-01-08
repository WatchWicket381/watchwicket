import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type EffectType = 'six' | 'four' | 'wicket';

interface Props {
  type: EffectType | null;
  onComplete: () => void;
  batterHandedness?: 'RHB' | 'LHB';
}

function CricketBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#DC2626" stroke="#991B1B" strokeWidth="2"/>
      <path d="M20 35 Q50 40 80 35" stroke="#991B1B" strokeWidth="3" fill="none"/>
      <path d="M20 65 Q50 60 80 65" stroke="#991B1B" strokeWidth="3" fill="none"/>
    </svg>
  );
}

function SixEffect({ onComplete, batterHandedness = 'RHB' }: { onComplete: () => void; batterHandedness?: 'RHB' | 'LHB' }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const isRightHanded = batterHandedness === 'RHB';

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute w-16 h-16"
        initial={{
          x: isRightHanded ? '10vw' : '85vw',
          y: '85vh',
          scale: 0.6,
        }}
        animate={{
          x: isRightHanded ? '80vw' : '5vw',
          y: '-10vh',
          scale: [0.6, 1.4, 1.2, 0.8],
        }}
        transition={{
          duration: 1.0,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        <CricketBall className="w-full h-full drop-shadow-2xl" />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.6) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.5, 2],
            opacity: [0.8, 0.4, 0],
          }}
          transition={{ duration: 1.0 }}
        />
      </motion.div>

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-12 h-12 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.8) 0%, transparent 70%)',
            filter: 'blur(8px)',
          }}
          initial={{
            x: isRightHanded ? '10vw' : '85vw',
            y: '85vh',
          }}
          animate={{
            x: isRightHanded ? `${10 + i * 8}vw` : `${85 - i * 8}vw`,
            y: `${85 - i * 10}vh`,
            scale: [0.5, 1, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 1.0,
            delay: i * 0.08,
            ease: 'easeOut',
          }}
        />
      ))}

      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{
          scale: [0, 2.5, 2],
          opacity: [0, 1, 0],
          rotate: [10, 0, -5],
        }}
        transition={{ duration: 1.0 }}
      >
        <div className="text-8xl font-black text-red-600 drop-shadow-2xl" style={{ textShadow: '0 0 40px rgba(220, 38, 38, 0.8)' }}>
          SIX!
        </div>
      </motion.div>
    </motion.div>
  );
}

function FourEffect({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute bottom-0 left-0 right-0 h-32 border-t-4 border-blue-500 bg-gradient-to-t from-green-900/20 to-transparent">
        <div className="absolute bottom-8 left-0 right-0 h-1 bg-white/40" />
      </div>

      <motion.div
        className="absolute bottom-16 w-14 h-14"
        initial={{ x: '-5vw', rotate: 0 }}
        animate={{
          x: '100vw',
          rotate: 720,
        }}
        transition={{
          duration: 1.2,
          ease: 'linear',
        }}
      >
        <CricketBall className="w-full h-full drop-shadow-xl" />
      </motion.div>

      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-16 w-3 h-3 bg-blue-400 rounded-full"
          initial={{ x: '0vw', opacity: 0 }}
          animate={{
            x: `${i * 20}vw`,
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.2,
          }}
        />
      ))}

      <motion.div
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2"
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{
          scale: [0, 2, 1.8],
          opacity: [0, 1, 0],
          y: [20, -10, -30],
        }}
        transition={{ duration: 1.2 }}
      >
        <div className="text-7xl font-black text-blue-500 drop-shadow-2xl" style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.8)' }}>
          FOUR!
        </div>
      </motion.div>
    </motion.div>
  );
}

function WicketEffect({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.08, 0.92, 1.03, 1] }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex gap-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-4 h-40 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-sm shadow-lg"
                initial={{ scaleY: 1, y: 0, rotate: 0 }}
                animate={{
                  scaleY: [1, 0.98, 0.92, 0.85],
                  rotate: i === 1 ? [0, -3, 8, 15] : i === 0 ? [0, 3, -8, -15] : [0, 2, -6, -12],
                  y: [0, 2, 5, 10],
                }}
                transition={{ duration: 0.6, delay: 0.15 }}
              />
            ))}
          </div>

          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute -top-3 bg-red-700 rounded-full shadow-lg"
              style={{
                left: `${30 + i * 40}%`,
                width: '12px',
                height: '12px',
              }}
              initial={{ y: 0, opacity: 1, rotate: 0 }}
              animate={{
                y: [0, -30, -20, 60, 120],
                x: [0, (i === 0 ? -20 : 20), (i === 0 ? -35 : 35), (i === 0 ? -45 : 45)],
                opacity: [1, 1, 1, 0.8, 0],
                rotate: [0, 180, 360, 540, 720],
                scale: [1, 1.2, 1, 0.8, 0.5],
              }}
              transition={{ duration: 0.9, delay: 0.2 }}
            />
          ))}
        </motion.div>

        <motion.div
          className="absolute w-10 h-10 rounded-full bottom-20 left-1/2 transform -translate-x-1/2"
          initial={{ x: '-80vw', scale: 0.8 }}
          animate={{
            x: 0,
            scale: [0.8, 1.2, 0.6],
          }}
          transition={{ duration: 0.3 }}
        >
          <CricketBall className="w-full h-full" />
        </motion.div>

        <motion.div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-10"
          initial={{ scale: 0, opacity: 0, rotate: -15 }}
          animate={{
            scale: [0, 2.2, 1.8],
            opacity: [0, 1, 0],
            rotate: [-15, 5, 10],
          }}
          transition={{ duration: 1.0, delay: 0.2 }}
        >
          <div className="text-8xl font-black text-red-600 drop-shadow-2xl whitespace-nowrap" style={{ textShadow: '0 0 40px rgba(220, 38, 38, 0.9)' }}>
            WICKET!
          </div>
        </motion.div>
      </div>

      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-5 h-5 bg-orange-500 rounded-full"
          initial={{
            x: '50vw',
            y: '50vh',
            scale: 0,
          }}
          animate={{
            x: `${50 + Math.cos((i / 12) * Math.PI * 2) * 35}vw`,
            y: `${50 + Math.sin((i / 12) * Math.PI * 2) * 35}vh`,
            scale: [0, 1.8, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.8,
            delay: 0.3 + i * 0.04,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}

export default function EnhancedScoringEffects({ type, onComplete, batterHandedness }: Props) {
  return (
    <AnimatePresence>
      {type === 'six' && <SixEffect onComplete={onComplete} batterHandedness={batterHandedness} />}
      {type === 'four' && <FourEffect onComplete={onComplete} />}
      {type === 'wicket' && <WicketEffect onComplete={onComplete} />}
    </AnimatePresence>
  );
}
