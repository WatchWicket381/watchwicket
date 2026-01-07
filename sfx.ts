import { Howl } from 'howler';

let sfxEnabled = true;

const sounds = {
  sixBat: null as Howl | null,
  sixAir: null as Howl | null,
  sixCrowd: null as Howl | null,
  fourBat: null as Howl | null,
  fourRoll: null as Howl | null,
  wktStumps: null as Howl | null,
  wktBails: null as Howl | null,
  wktHowzat: null as Howl | null,
};

export function initSfx(): void {
  sounds.sixBat = new Howl({
    src: ['/sfx/six_bat.mp3'],
    preload: true,
    html5: true,
  });

  sounds.sixAir = new Howl({
    src: ['/sfx/six_air.mp3'],
    preload: true,
    html5: true,
  });

  sounds.sixCrowd = new Howl({
    src: ['/sfx/six_crowd.mp3'],
    preload: true,
    html5: true,
  });

  sounds.fourBat = new Howl({
    src: ['/sfx/four_bat.mp3'],
    preload: true,
    html5: true,
  });

  sounds.fourRoll = new Howl({
    src: ['/sfx/four_roll.mp3'],
    preload: true,
    html5: true,
  });

  sounds.wktStumps = new Howl({
    src: ['/sfx/wkt_stumps.mp3'],
    preload: true,
    html5: true,
  });

  sounds.wktBails = new Howl({
    src: ['/sfx/wkt_bails.mp3'],
    preload: true,
    html5: true,
  });

  sounds.wktHowzat = new Howl({
    src: ['/sfx/wkt_howzat.mp3'],
    preload: true,
    html5: true,
  });

  const savedSetting = localStorage.getItem('sfxEnabled');
  if (savedSetting !== null) {
    sfxEnabled = savedSetting === 'true';
  }
}

export function setSfxEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
  localStorage.setItem('sfxEnabled', enabled.toString());
}

export function isSfxEnabled(): boolean {
  return sfxEnabled;
}

export function playSixSfx(): void {
  if (!sfxEnabled) return;

  sounds.sixBat?.play();

  setTimeout(() => {
    sounds.sixAir?.play();
  }, 200);

  setTimeout(() => {
    sounds.sixCrowd?.play();
  }, 650);
}

export function playFourSfx(): void {
  if (!sfxEnabled) return;

  sounds.fourBat?.play();

  setTimeout(() => {
    sounds.fourRoll?.play();
  }, 250);
}

export function playWicketSfx(): void {
  if (!sfxEnabled) return;

  sounds.wktStumps?.play();

  setTimeout(() => {
    sounds.wktBails?.play();
  }, 150);

  setTimeout(() => {
    sounds.wktHowzat?.play();
  }, 500);
}
