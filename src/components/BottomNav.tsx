import React from "react";

export type NavScreen = "home" | "myMatches" | "newMatch" | "leagues" | "support" | "players" | "teams";

interface BottomNavProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  inMatch?: boolean;
}

export default function BottomNav({ currentScreen, onNavigate, inMatch }: BottomNavProps) {
  if (inMatch) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#012b1b] to-[#064428] border-t border-[#0b5c33] shadow-2xl z-50 pb-safe">
      <div className="max-w-5xl mx-auto grid grid-cols-5 px-2 pt-2">
        <NavButton
          icon="🏠"
          label="Home"
          active={currentScreen === "home"}
          onClick={() => onNavigate("home")}
        />

        <NavButton
          icon="🏏"
          label="My Matches"
          active={currentScreen === "myMatches"}
          onClick={() => onNavigate("myMatches")}
        />

        <button
          onClick={() => onNavigate("newMatch")}
          className="flex flex-col items-center justify-center py-2 px-2 transition-all duration-200 transform hover:scale-105"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg flex items-center justify-center mb-1 border-2 border-red-400">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-700 to-red-800 flex items-center justify-center shadow-inner">
              <div className="w-10 h-10 rounded-full border-2 border-red-300 flex items-center justify-center">
                <div className="text-2xl">🏏</div>
              </div>
            </div>
          </div>
        </button>

        <NavButton
          icon="🏆"
          label="Leagues"
          active={currentScreen === "leagues"}
          onClick={() => onNavigate("leagues")}
        />

        <NavButton
          icon="💬"
          label="Support"
          active={currentScreen === "support"}
          onClick={() => onNavigate("support")}
        />
      </div>
    </nav>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 ${
        active
          ? "bg-[#0b5c33] text-[#0f9d3d] font-bold"
          : "text-green-400 hover:text-green-200 hover:bg-[#064428]/50"
      }`}
    >
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
