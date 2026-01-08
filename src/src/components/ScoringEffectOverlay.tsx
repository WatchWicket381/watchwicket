import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type EffectType = 'six' | 'four' | 'wicket';

interface Props {
  type: EffectType | null;
  onComplete: () => void;
}

function SixEffect({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute w-16 h-16 bg-red-500 rounded-full shadow-2xl"
        style={{
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
        }}
        initial={{ x: '10%', y: '90%', scale: 0.5 }}
        animate={{
          x: '85%',
          y: '5%',
          scale: [0.5, 1.2, 0.8, 1],
          rotate: [0, 360, 720],
        }}
        transition={{
          duration: 1.5,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-2xl">6</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2, 1.5], opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, times: [0, 0.5, 1] }}
      >
        <div className="text-8xl font-black text-red-500 drop-shadow-2xl">
          SIX!
        </div>
      </motion.div>

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-yellow-400 rounded-full"
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
          }}
          animate={{
            x: `${50 + Math.cos((i / 6) * Math.PI * 2) * 40}%`,
            y: `${50 + Math.sin((i / 6) * Math.PI * 2) * 40}%`,
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.2,
            delay: 0.3 + i * 0.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}

function FourEffect({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute bottom-24 w-12 h-12 bg-blue-500 rounded-full shadow-xl"
        style={{
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
        }}
        initial={{ x: '5%', scale: 0.5 }}
        animate={{
          x: '90%',
          scale: [0.5, 1, 0.9, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 1.2,
          ease: 'easeInOut',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-xl">4</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2"
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0], y: [20, -10, -30] }}
        transition={{ duration: 1.2 }}
      >
        <div className="text-6xl font-black text-blue-500 drop-shadow-xl">
          FOUR!
        </div>
      </motion.div>

      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-24 w-2 h-2 bg-blue-300 rounded-full"
          initial={{ x: '10%', opacity: 0 }}
          animate={{
            x: `${20 + i * 25}%`,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 0.8,
            delay: 0.2 + i * 0.15,
          }}
        />
      ))}
    </motion.div>
  );
}

function WicketEffect({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
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
          animate={{ scale: [1, 1.05, 0.95, 1.02, 1] }}
          transition={{ duration: 0.3, times: [0, 0.2, 0.4, 0.7, 1] }}
        >
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-32 bg-yellow-600 rounded-sm"
                initial={{ scaleY: 1, y: 0 }}
                animate={{
                  scaleY: [1, 0.98, 0.95, 0.9],
                  rotate: i === 1 ? [0, -2, 5, 8] : [0, 2, -5, -8],
                }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            ))}
          </div>

          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute -top-2 bg-red-700 rounded-full"
              style={{
                left: `${25 + i * 45}%`,
                width: '8px',
                height: '8px',
              }}
              initial={{ y: 0, opacity: 1, rotate: 0 }}
              animate={{
                y: [0, -20, 40, 80],
                x: [0, (i === 0 ? -15 : 15), (i === 0 ? -30 : 30)],
                opacity: [1, 1, 1, 0],
                rotate: [0, 180, 360, 540],
              }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          ))}
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.8, 1.2], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, times: [0, 0.4, 1] }}
        >
          <div className="text-7xl font-black text-red-600 drop-shadow-2xl whitespace-nowrap">
            WICKET!
          </div>
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          <div className="text-5xl font-black text-orange-500 drop-shadow-xl">
            OUT!
          </div>
        </motion.div>
      </div>

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-red-400 rounded-full"
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
          }}
          animate={{
            x: `${50 + Math.cos((i / 8) * Math.PI * 2) * 45}%`,
            y: `${50 + Math.sin((i / 8) * Math.PI * 2) * 45}%`,
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            delay: 0.4 + i * 0.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}

export default function ScoringEffectOverlay({ type, onComplete }: Props) {
  return (
    <AnimatePresence>
      {type === 'six' && <SixEffect onComplete={onComplete} />}
      {type === 'four' && <FourEffect onComplete={onComplete} />}
      {type === 'wicket' && <WicketEffect onComplete={onComplete} />}
    </AnimatePresence>
  );
}
