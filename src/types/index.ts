/**
 * Ingrade AR Types & Domain Models
 */

export type ProductId = 'watch' | 'drone' | 'headset' | 'lens';

export type ColorwayId = 'obsidian' | 'titanium' | 'midnight' | 'ceramic' | 'amber';

export type DisplayMode = 'shaded' | 'wireframe' | 'xray' | 'blueprint';

export type LightingPreset = 'studio' | 'cyber' | 'daylight' | 'monochrome';

export interface Colorway {
  id: ColorwayId;
  name: string;
  hex: string;
  accentHex: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
}

export interface ProductPart {
  id: string;
  name: string;
  description: string;
  offset: [number, number, number]; // Vector for exploded view
}

export interface ProductSpec {
  id: ProductId;
  name: string;
  category: string;
  tagline: string;
  price: string;
  dimensionsMm: {
    length: number;
    width: number;
    height: number;
  };
  weightGrams: number;
  material: string;
  ipRating: string;
  explodedOffsetScale: number;
  parts: ProductPart[];
  specs: { label: string; value: string }[];
}

export interface MarkerTrackingState {
  isSearching: boolean;
  isDetected: boolean;
  confidence: number;
  markerType: 'Hiro' | 'Ingrade' | 'Custom';
  coordinates: { x: number; y: number; width: number; height: number } | null;
  distanceCm: number;
  fps: number;
}
