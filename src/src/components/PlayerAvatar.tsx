import React from "react";

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-8 h-8 text-xs",
  sm: "w-12 h-12 text-sm",
  md: "w-16 h-16 text-lg",
  lg: "w-24 h-24 text-2xl",
  xl: "w-32 h-32 text-4xl",
};

const gradients = [
  "from-green-600 to-emerald-600",
  "from-blue-600 to-cyan-600",
  "from-violet-600 to-purple-600",
  "from-orange-600 to-amber-600",
  "from-rose-600 to-pink-600",
  "from-teal-600 to-green-600",
  "from-indigo-600 to-blue-600",
  "from-fuchsia-600 to-pink-600",
  "from-lime-600 to-green-600",
  "from-sky-600 to-blue-600",
];

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  photoUrl,
  size = "md",
  className = "",
}) => {
  function getPlayerInitials(playerName: string): string {
    const parts = playerName.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getGradientForName(playerName: string): string {
    let hash = 0;
    for (let i = 0; i < playerName.length; i++) {
      hash = playerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }

  const gradient = getGradientForName(name);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold flex-shrink-0 overflow-hidden ${className}`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white">{getPlayerInitials(name)}</span>
      )}
    </div>
  );
};
