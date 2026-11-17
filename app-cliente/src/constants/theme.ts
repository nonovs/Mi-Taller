/**
 * Sistema de diseño de MiTaller: grafito + naranja taller, en modo claro y oscuro.
 * Este archivo es idéntico en app-cliente y app-taller.
 */

import '@/global.css';

import { Platform } from 'react-native';

import type { VehicleStatus } from '@/lib/types';

export const Colors = {
  light: {
    text: '#0E1116',
    background: '#F3F4F6',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECEEF2',
    textSecondary: '#5B6472',
    border: '#E2E5EA',
    accent: '#EE5A0C',
    accentSoft: '#FFF1E8',
    onAccent: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#E7F6EC',
    danger: '#DC2626',
    dangerSoft: '#FDECEC',
  },
  dark: {
    text: '#F3F4F6',
    background: '#0B0D10',
    backgroundElement: '#16191E',
    backgroundSelected: '#22262D',
    textSecondary: '#9AA3AF',
    border: '#2A2F37',
    accent: '#FF7A2E',
    accentSoft: '#2B1A0F',
    onAccent: '#1A0D05',
    success: '#34D399',
    successSoft: '#0F2A1F',
    danger: '#F87171',
    dangerSoft: '#2E1414',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Color de cada estado del coche (se lee bien en claro y en oscuro). */
export const StatusColors: Record<VehicleStatus, string> = {
  recibido: '#64748B',
  diagnostico: '#8B5CF6',
  en_reparacion: '#F97316',
  listo: '#16A34A',
  entregado: '#94A3B8',
};

/** Añade transparencia a un color hex de 6 dígitos (alpha de 0 a 1). */
export function withAlpha(hex: string, alpha: number) {
  const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${value}`;
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

/** Sombra suave para tarjetas (solo se nota en modo claro). */
export const CardShadow = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(16,24,40,0.06), 0 4px 16px rgba(16,24,40,0.06)' },
  default: {
    shadowColor: '#101828',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
