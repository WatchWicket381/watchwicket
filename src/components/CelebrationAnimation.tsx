import React, { useEffect, useState } from 'react';

export type CelebrationType = 'four' | 'six' | 'wicket';

interface Props {
  type: CelebrationType | null;
  onComplete: () => void;
}

export default function CelebrationAnimation({ type, onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (type) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onComplete, 300); // Wait for fade out
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  if (!type || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {type === 'six' && <SixAnimation />}
      {type === 'four' && <FourAnimation />}
      {type === 'wicket' && <WicketAnimation />}
    </div>
  );
}

function SixAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Flying ball */}
      <div className="absolute animate-fly-ball">
        <div className="w-16 h-16 bg-red-600 rounded-full shadow-2xl border-4 border-red-700 animate-spin-slow"></div>
      </div>

      {/* Big 6 text */}
      <div className="animate-scale-bounce">
        <div className="text-[200px] font-black text-yellow-400 drop-shadow-2xl animate-pulse-scale"
          style={{ textShadow: '0 0 40px rgba(250, 204, 21, 0.8), 0 0 80px rgba(250, 204, 21, 0.5)' }}>
          6
        </div>
        <div className="text-4xl font-bold text-white text-center mt-4 drop-shadow-lg">
          IT'S A SIX!
        </div>
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0 animate-fade-in-out">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-particle-burst"
            style={{
              left: '50%',
              top: '50%',
              animationDelay: `${i * 0.05}s`,
              '--angle': `${i * 30}deg`,
            } as React.CSSProperties}
          ></div>
        ))}
      </div>
    </div>
  );
}

function FourAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Racing ball */}
      <div className="absolute bottom-20 left-0 animate-race-across">
        <div className="w-12 h-12 bg-red-600 rounded-full shadow-xl border-2 border-red-700 animate-spin"></div>
      </div>

      {/* Big 4 text */}
      <div className="animate-scale-bounce">
        <div className="text-[160px] font-black text-green-400 drop-shadow-2xl"
          style={{ textShadow: '0 0 30px rgba(74, 222, 128, 0.8), 0 0 60px rgba(74, 222, 128, 0.5)' }}>
          4
        </div>
        <div className="text-3xl font-bold text-white text-center mt-2 drop-shadow-lg">
          FOUR!
        </div>
      </div>

      {/* Boundary line flash */}
      <div className="absolute bottom-0 w-full h-2 bg-green-400 animate-flash"></div>
    </div>
  );
}

function WicketAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Stumps breaking */}
      <div className="relative animate-stumps-break">
        {/* Three stumps */}
        <div className="flex gap-4 items-end">
          <div className="w-4 h-32 bg-gradient-to-b from-yellow-200 to-yellow-600 rounded animate-stump-fall-left"></div>
          <div className="w-4 h-32 bg-gradient-to-b from-yellow-200 to-yellow-600 rounded animate-stump-fall-center"></div>
          <div className="w-4 h-32 bg-gradient-to-b from-yellow-200 to-yellow-600 rounded animate-stump-fall-right"></div>
        </div>
        {/* Bails */}
        <div className="absolute -top-2 left-0 right-0 flex justify-center gap-6">
          <div className="w-8 h-2 bg-red-600 rounded animate-bail-fly-left"></div>
          <div className="w-8 h-2 bg-red-600 rounded animate-bail-fly-right"></div>
        </div>
      </div>

      {/* WICKET text */}
      <div className="absolute top-1/3 animate-scale-bounce">
        <div className="text-6xl font-black text-red-500 drop-shadow-2xl"
          style={{ textShadow: '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.5)' }}>
          WICKET!
        </div>
      </div>

      {/* Flash effect */}
      <div className="absolute inset-0 bg-red-500 animate-flash-wicket opacity-0"></div>
    </div>
  );
}
