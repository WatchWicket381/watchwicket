const playSound = (src: string) => {
  const audio = new Audio(src);
  audio.volume = 0.9;
  audio.play().catch(() => {});
};

export const playSixSound = () => {
  playSound("/sounds/bat_hit.mp3");
  setTimeout(() => playSound("/sounds/ball_fly.mp3"), 200);
  setTimeout(() => playSound("/sounds/crowd_cheer.mp3"), 600);
};

export const playFourSound = () => {
  playSound("/sounds/bat_hit.mp3");
  setTimeout(() => playSound("/sounds/ball_roll.mp3"), 300);
};

export const playWicketSound = () => {
  playSound("/sounds/stumps_hit.mp3");
  setTimeout(() => playSound("/sounds/bails_fall.mp3"), 200);
  setTimeout(() => playSound("/sounds/howzat.mp3"), 500);
};
