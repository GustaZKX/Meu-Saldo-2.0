import type { ColorCache } from './types';

// HSL to RGB conversion
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

// RGB to HSL conversion
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}


export function hslToHex(hslString: string): string {
  const parts = hslString.match(/\d+/g);
  if (!parts || parts.length < 3) return "#000000";

  const [h, s, l] = parts.map(Number);
  const [r, g, b] = hslToRgb(h, s, l);

  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return "#" + toHex(r) + toHex(g) + toHex(b);
}

export function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  const [h, s, l] = rgbToHsl(r, g, b);
  return `hsl(${h}, ${s}%, ${l}%)`;
}


export function getConsistentColor(categoryName: string, isRevenue: boolean, colorCache: ColorCache): string {
    const cacheKey = categoryName.toLowerCase();

    if (colorCache[cacheKey]) {
        return colorCache[cacheKey].color;
    }

    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
        hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const normalizedHash = Math.abs(hash) / 2147483647;

    const minHue = isRevenue ? 100 : 0;
    const maxHue = isRevenue ? 180 : 60;
    const hueRange = maxHue - minHue;
    const hue = Math.floor(normalizedHash * hueRange) + minHue;

    const color = `hsl(${hue % 360}, 70%, 50%)`;
    colorCache[cacheKey] = { color: color, custom: false };
    return color;
}
