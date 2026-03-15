
export interface SuggestionResponse {
  titles: string[];
  imagePrompts: string[];
}

export interface GraphicElement {
  id: string;
  type: 'icon' | 'shape';
  path: string;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

export interface ThumbnailConfig {
  imageUrl: string | null;
  fontFamily: string;
  overlayOpacity: number;
  graphics: GraphicElement[];
  
  // Line 1 Styling & Position
  line1Text: string;
  line1Color: string;
  line1Color2: string; // For gradient
  line1IsGradient: boolean;
  line1StrokeColor: string;
  line1FontSize: number;
  line1StrokeWidth: number;
  line1Align: 'left' | 'center' | 'right';
  line1Bold: boolean;
  line1Italic: boolean;
  line1Underline: boolean;
  line1ShowShadow: boolean;
  line1ShadowBlur: number;
  line1ShadowOffset: number;
  line1ShadowColor: string;
  line1ShowBg: boolean;
  line1BgColor: string;
  line1BgPaddingX: number;
  line1BgPaddingY: number;
  line1Position: { x: number; y: number };
  line1Rotation: number;
  
  // Line 2 Styling & Position
  line2Text: string;
  line2Color: string;
  line2Color2: string; // For gradient
  line2IsGradient: boolean;
  line2StrokeColor: string;
  line2FontSize: number;
  line2StrokeWidth: number;
  line2Align: 'left' | 'center' | 'right';
  line2Bold: boolean;
  line2Italic: boolean;
  line2Underline: boolean;
  line2ShowShadow: boolean;
  line2ShadowBlur: number;
  line2ShadowOffset: number;
  line2ShadowColor: string;
  line2ShowBg: boolean;
  line2BgColor: string;
  line2BgPaddingX: number;
  line2BgPaddingY: number;
  line2Position: { x: number; y: number };
  line2Rotation: number;

  // Line 3 Styling & Position
  line3Text: string;
  line3Color: string;
  line3Color2: string;
  line3IsGradient: boolean;
  line3StrokeColor: string;
  line3FontSize: number;
  line3StrokeWidth: number;
  line3Align: 'left' | 'center' | 'right';
  line3Bold: boolean;
  line3Italic: boolean;
  line3Underline: boolean;
  line3ShowShadow: boolean;
  line3ShadowBlur: number;
  line3ShadowOffset: number;
  line3ShadowColor: string;
  line3ShowBg: boolean;
  line3BgColor: string;
  line3BgPaddingX: number;
  line3BgPaddingY: number;
  line3Position: { x: number; y: number };
  line3Rotation: number;
  
  showLine2: boolean;
  showLine3: boolean;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  READY = 'READY'
}
