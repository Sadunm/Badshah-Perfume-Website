import React, { useEffect } from 'react';

const WORD_COLORS = [
  '#f6cf78', '#78e0bb', '#89d7f3', '#ef9ebe', '#bba8f6', '#f2a782',
  '#a9da82', '#80aef3', '#ef9b9b', '#69d2ce', '#e9bd65', '#a995e3',
  '#76500c', '#0a634f', '#124f76', '#8c2f60', '#4e3b7e', '#94452a',
  '#3d6122', '#244d8a', '#8b2b34', '#0a5d60', '#6f5712', '#513c88',
];

const HIGHLIGHT_PREFIX = 'badshah-word-color';
const WORD_PATTERN = /[\p{L}\p{N}][\p{L}\p{M}\p{N}'’.-]*/gu;

type HighlightLike = {
  add: (range: Range) => unknown;
};

type HighlightRegistryLike = {
  set: (name: string, highlight: HighlightLike) => unknown;
  delete: (name: string) => unknown;
};

function parseCssColor(value: string): [number, number, number, number] | null {
  const match = value.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i
  );
  if (!match) return null;
  const alpha = match[4]
    ? match[4].endsWith('%')
      ? Number.parseFloat(match[4]) / 100
      : Number.parseFloat(match[4])
    : 1;
  return [
    Number.parseFloat(match[1]),
    Number.parseFloat(match[2]),
    Number.parseFloat(match[3]),
    alpha,
  ];
}

function getSurfaceColor(element: Element): [number, number, number] {
  let current: Element | null = element;

  while (current) {
    const style = window.getComputedStyle(current);
    const gradientColor = style.backgroundImage.match(/rgba?\([^)]+\)/i)?.[0];
    const gradientRgb = gradientColor ? parseCssColor(gradientColor) : null;
    if (gradientRgb && gradientRgb[3] >= 0.35) {
      return [gradientRgb[0], gradientRgb[1], gradientRgb[2]];
    }

    const background = parseCssColor(style.backgroundColor);
    if (background && background[3] >= 0.5) {
      return [background[0], background[1], background[2]];
    }
    current = current.parentElement;
  }

  return [10, 10, 12];
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance([red, green, blue]: [number, number, number]): number {
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}

function hexLuminance(hex: string): number {
  const value = hex.replace('#', '');
  return luminance([
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]);
}

function contrastRatio(first: number, second: number): number {
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function chooseColorsForSurface(background: [number, number, number]): string[] {
  const backgroundLuminance = luminance(background);
  const ranked = WORD_COLORS
    .map((color) => ({
      color,
      contrast: contrastRatio(hexLuminance(color), backgroundLuminance),
    }))
    .sort((a, b) => b.contrast - a.contrast);

  const highContrast = ranked.filter(({ contrast }) => contrast >= 4.5);
  if (highContrast.length >= 4) return highContrast.map(({ color }) => color);

  const readable = ranked.filter(({ contrast }) => contrast >= 3);
  return (readable.length >= 4 ? readable : ranked.slice(0, 8)).map(({ color }) => color);
}

export const RandomWordColorEffect: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  useEffect(() => {
    if (!enabled) return;

    const browserWindow = window as typeof window & {
      Highlight?: new () => HighlightLike;
      CSS: typeof CSS & { highlights?: HighlightRegistryLike };
    };
    const HighlightConstructor = browserWindow.Highlight;
    const registry = browserWindow.CSS?.highlights;
    if (!HighlightConstructor || !registry) return;

    const root = document.getElementById('root') || document.body;
    const style = document.createElement('style');
    style.dataset.badshahWordColors = 'true';
    style.textContent = WORD_COLORS.map(
      (color, index) => `::highlight(${HIGHLIGHT_PREFIX}-${index}) { color: ${color}; }`
    ).join('\n');
    document.head.appendChild(style);

    const colorsByTextNode = new WeakMap<Text, string[]>();
    let previousColor = '';
    let frameId = 0;

    const rebuildHighlights = () => {
      WORD_COLORS.forEach((_, index) => registry.delete(`${HIGHLIGHT_PREFIX}-${index}`));
      const rangesByColor = new Map(WORD_COLORS.map((color) => [color, [] as Range[]]));
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        const textNode = node as Text;
        const parent = textNode.parentElement;
        const content = textNode.nodeValue || '';
        if (
          !parent ||
          !content.trim() ||
          parent.closest(
            'script, style, noscript, svg, textarea, input, select, option, [hidden], [aria-hidden="true"], [contenteditable="true"], [data-no-random-word-colors]'
          )
        ) {
          node = walker.nextNode();
          continue;
        }

        const matches = [...content.matchAll(WORD_PATTERN)];
        if (matches.length === 0) {
          node = walker.nextNode();
          continue;
        }

        const availableColors = chooseColorsForSurface(getSurfaceColor(parent));
        const assignedColors = colorsByTextNode.get(textNode) || [];

        matches.forEach((match, wordIndex) => {
          let color = assignedColors[wordIndex];
          if (!color) {
            const choices =
              availableColors.length > 1
                ? availableColors.filter((candidate) => candidate !== previousColor)
                : availableColors;
            color = choices[Math.floor(Math.random() * choices.length)] || availableColors[0];
            assignedColors[wordIndex] = color;
          }
          previousColor = color;

          const range = document.createRange();
          range.setStart(textNode, match.index || 0);
          range.setEnd(textNode, (match.index || 0) + match[0].length);
          rangesByColor.get(color)?.push(range);
        });

        colorsByTextNode.set(textNode, assignedColors);
        node = walker.nextNode();
      }

      rangesByColor.forEach((ranges, color) => {
        if (ranges.length === 0) return;
        const highlight = new HighlightConstructor();
        ranges.forEach((range) => highlight.add(range));
        const colorIndex = WORD_COLORS.indexOf(color);
        registry.set(`${HIGHLIGHT_PREFIX}-${colorIndex}`, highlight);
      });
    };

    const scheduleRebuild = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        rebuildHighlights();
      });
    };

    rebuildHighlights();
    const observer = new MutationObserver(scheduleRebuild);
    observer.observe(root, { childList: true, characterData: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
      WORD_COLORS.forEach((_, index) => registry.delete(`${HIGHLIGHT_PREFIX}-${index}`));
      style.remove();
    };
  }, [enabled]);

  return null;
};