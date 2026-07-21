import Phaser from 'phaser';
import './style.css';

const TAU = Math.PI * 2;
const TEXTURE_WIDTH = 520;
const TEXTURE_HEIGHT = 640;
const PARTICLE_COUNT = 10_000;

type Settings = {
  speed: number;
  density: number;
  pulse: number;
  trail: number;
  paused: boolean;
};

type Language = 'fr' | 'en';

const translations = {
  fr: {
    pageTitle: 'MORPH//01 / Biomorphe procédural',
    brandLabel: 'Morph 01, retour au début',
    languageSelector: 'Choisir la langue',
    stageLabel: 'Expérience de biomorphe procédural',
    specimen: 'SPÉCIMEN 001',
    unclassified: 'FORME / NON CLASSÉE',
    gameLabel: 'Animation interactive',
    interactionHint: 'ESPACE POUR FIGER · GLISSER POUR EXPLORER',
    controlsLabel: 'Paramètres de l’animation',
    protocol: 'PROTOCOLE',
    title: 'BIOMORPHE<br />CINÉTIQUE',
    pause: 'Mettre en pause',
    resume: 'Reprendre',
    description: 'Une forme synthétique émerge de 10 000 points. Son impulsion carmin remonte la structure comme un signal nerveux.',
    speed: 'VITESSE',
    density: 'DENSITÉ',
    pulse: 'IMPULSION',
    trail: 'PERSISTANCE',
    wolframCore: 'NOYAU WOLFRAM',
    reset: 'RÉINITIALISER LE CYCLE',
  },
  en: {
    pageTitle: 'MORPH//01 / Procedural biomorph',
    brandLabel: 'Morph 01, back to start',
    languageSelector: 'Choose language',
    stageLabel: 'Procedural biomorph experience',
    specimen: 'SPECIMEN 001',
    unclassified: 'FORM / UNCLASSIFIED',
    gameLabel: 'Interactive animation',
    interactionHint: 'SPACE TO FREEZE · DRAG TO EXPLORE',
    controlsLabel: 'Animation settings',
    protocol: 'PROTOCOL',
    title: 'KINETIC<br />BIOMORPH',
    pause: 'Pause animation',
    resume: 'Resume animation',
    description: 'A synthetic form emerges from 10,000 points. Its crimson pulse travels up the structure like a nerve signal.',
    speed: 'SPEED',
    density: 'DENSITY',
    pulse: 'PULSE',
    trail: 'PERSISTENCE',
    wolframCore: 'WOLFRAM CORE',
    reset: 'RESET CYCLE',
  },
} as const;

type TranslationKey = keyof typeof translations.fr;

const storedLanguage = localStorage.getItem('procedural-biomorph-language');
let currentLanguage: Language = storedLanguage === 'fr' || storedLanguage === 'en'
  ? storedLanguage
  : navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';

const settings: Settings = {
  speed: 1,
  density: 1,
  pulse: 0.72,
  trail: 0.68,
  paused: false,
};

const translate = (key: TranslationKey) => translations[currentLanguage][key];

const applyLanguage = (language: Language) => {
  currentLanguage = language;
  localStorage.setItem('procedural-biomorph-language', language);
  document.documentElement.lang = language;
  document.title = translate('pageTitle');

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n as TranslationKey;
    element.textContent = translate(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((element) => {
    const key = element.dataset.i18nHtml as TranslationKey;
    element.innerHTML = translate(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
    const key = element.dataset.i18nAriaLabel as TranslationKey;
    element.setAttribute('aria-label', translate(key));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
    const isActive = button.dataset.language === language;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const pauseButton = document.querySelector<HTMLButtonElement>('#pause');
  if (pauseButton) pauseButton.setAttribute('aria-label', translate(settings.paused ? 'resume' : 'pause'));
};

document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
  button.addEventListener('click', () => applyLanguage(button.dataset.language as Language));
});

applyLanguage(currentLanguage);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const fract = (value: number) => value - Math.floor(value);
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = clamp01((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

class BiomorphScene extends Phaser.Scene {
  private texture!: Phaser.Textures.CanvasTexture;
  private context!: CanvasRenderingContext2D;
  private phase = 0;
  private dragging = false;

  constructor() {
    super('biomorph');
  }

  create() {
    this.texture = this.textures.createCanvas('biomorph-field', TEXTURE_WIDTH, TEXTURE_HEIGHT)!;
    this.context = this.texture.getContext();
    this.context.fillStyle = '#050505';
    this.context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

    this.add.image(0, 0, 'biomorph-field').setOrigin(0);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.scrub(pointer.x);
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging) this.scrub(pointer.x);
    });
    this.input.on('pointerup', () => {
      this.dragging = false;
    });

    window.addEventListener('biomorph-reset', () => {
      this.phase = 0;
      this.context.fillStyle = '#050505';
      this.context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    });
  }

  private scrub(pointerX: number) {
    this.phase = clamp01(pointerX / this.scale.width) * TAU;
  }

  update(_time: number, delta: number) {
    if (!settings.paused && !this.dragging) {
      this.phase = (this.phase + delta * 0.00032 * settings.speed) % TAU;
    }
    this.drawField();
  }

  private drawField() {
    const ctx = this.context;
    const fadeAlpha = 0.08 + (1 - settings.trail) * 0.46;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(5, 5, 5, ${fadeAlpha})`;
    ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

    const visibleCount = Math.floor(PARTICLE_COUNT * settings.density);
    const redPoints: Array<[number, number, number]> = [];
    ctx.fillStyle = 'rgba(238, 241, 238, 0.72)';

    for (let index = 1; index <= visibleCount; index += 1) {
      const x = index;
      const y = x / 235;
      const k = (4 + 3 * Math.sin(2 * y - this.phase)) * Math.cos(x / 29);
      const e = y / 8 - 13;
      const d = Math.sqrt(k * k + e * e);
      const c = d - this.phase;
      const safeK = Math.abs(k) < 0.025 ? (k < 0 ? -0.025 : 0.025) : k;
      const q = 3 * Math.sin(2 * k) + 0.3 / safeK + Math.sin(y / 25) * k * (9 + 4 * Math.sin(9 * e - 3 * d + 2 * this.phase));
      const wolframX = q + 30 * Math.cos(c) + 200;
      const wolframY = 400 - (q * Math.sin(c) + 39 * d - 220);
      const px = ((wolframX - 70) / 260) * TEXTURE_WIDTH;
      const py = ((350 - wolframY) / 320) * TEXTURE_HEIGHT;

      if (px < 0 || px >= TEXTURE_WIDTH || py < 0 || py >= TEXTURE_HEIGHT) continue;

      const u = index / PARTICLE_COUNT;
      const hash = fract(Math.sin(index * 12.9898) * 43758.5453);
      const flow = fract(u * 4.2 + this.phase / TAU * 1.85 + hash * 0.12);
      const travelingBand = smoothstep(0.72, 0.9, flow) * (1 - smoothstep(0.9, 1, flow));
      const lowerNerve = smoothstep(0.52, 0.78, u);
      const upperCorona = (1 - smoothstep(0.42, 0.62, u)) * smoothstep(0.7, 0.95, flow);
      const redEnergy = Math.max(travelingBand * lowerNerve, upperCorona * 0.78) * settings.pulse;

      if (redEnergy > 0.12 && hash < 0.28 + redEnergy * 0.62) {
        redPoints.push([px, py, redEnergy]);
      } else {
        const size = hash > 0.8 ? 1.35 : 0.8;
        ctx.fillRect(px, py, size, size);
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 22, 30, 0.16)';
    for (const [px, py, energy] of redPoints) {
      const glow = 1.8 + energy * 1.5;
      ctx.fillRect(px - glow / 2, py - glow / 2, glow, glow);
    }
    for (const [px, py, energy] of redPoints) {
      ctx.fillStyle = `rgba(255, 24, 30, ${0.45 + energy * 0.55})`;
      const size = 0.9 + energy * 0.9;
      ctx.fillRect(px, py, size, size);
    }
    ctx.globalCompositeOperation = 'source-over';
    this.texture.refresh();
  }
}

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: TEXTURE_WIDTH,
  height: TEXTURE_HEIGHT,
  backgroundColor: '#050505',
  render: {
    antialias: false,
    pixelArt: false,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: BiomorphScene,
});

const bindRange = (id: keyof Omit<Settings, 'paused'>, format: (value: number) => string) => {
  const input = document.querySelector<HTMLInputElement>(`#${id}`)!;
  const output = document.querySelector<HTMLOutputElement>(`#${id}-output`)!;
  input.addEventListener('input', () => {
    const value = Number(input.value);
    settings[id] = value;
    output.value = format(value);
  });
};

bindRange('speed', (value) => `${value.toFixed(2)}×`);
bindRange('density', (value) => `${Math.round(value * 100)}%`);
bindRange('pulse', (value) => `${Math.round(value * 100)}%`);
bindRange('trail', (value) => `${Math.round(value * 100)}%`);

const pauseButton = document.querySelector<HTMLButtonElement>('#pause')!;
const togglePause = () => {
  settings.paused = !settings.paused;
  pauseButton.textContent = settings.paused ? '▶' : 'Ⅱ';
  pauseButton.setAttribute('aria-pressed', String(settings.paused));
  pauseButton.setAttribute('aria-label', translate(settings.paused ? 'resume' : 'pause'));
};

pauseButton.addEventListener('click', togglePause);
document.querySelector('#reset')!.addEventListener('click', () => window.dispatchEvent(new Event('biomorph-reset')));
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  }
});

window.addEventListener('beforeunload', () => game.destroy(true));
