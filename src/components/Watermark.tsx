import React from 'react';
import watchwicketLogo from '../assets/file_00000000711072438e9d72dabae9eda2.png';

export default function Watermark() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
      <div className="opacity-[0.08] select-none">
        <img
          src={watchwicketLogo}
          alt="WatchWicket"
          className="w-[1200px] h-auto transform rotate-[-15deg]"
        />
      </div>
    </div>
  );
}
