/**
 * GymLog Color Palette - Dark, minimalist, elegant theme
 */

import { Platform } from 'react-native';

export const Colors = {
  // Backgrounds
  background: '#0F0F0F',      // Main background - deep dark
  surface: '#1A1A1A',         // Cards, elevated surfaces
  surfaceElevated: '#242424', // Higher elevation surfaces

  // Text
  text: '#FAFAFA',            // Alias for textPrimary (for themed components)
  textPrimary: '#FAFAFA',     // Main text - off-white
  textSecondary: '#9E9E9E',   // Secondary text - muted gray
  textTertiary: '#666666',    // Tertiary text - darker gray

  // Accents
  accent: '#FF3E3E',          // Red accent - vibrant red for contrast
  accentHover: '#E03535',     // Darker red for hover/press states
  primary: '#FFFFFF',         // Secondary actions - pure white
  primaryMuted: '#E8E8E8',    // Muted primary
  tint: '#FF3E3E',            // Alias for accent (for themed components)

  // Borders & Dividers
  border: '#2A2A2A',          // Subtle borders
  borderLight: '#333333',     // Slightly more visible borders

  // Icons
  icon: '#9E9E9E',            // Alias for textSecondary (for themed components)

  // Functional
  success: '#4CAF50',         // Success states
  error: '#F44336',           // Error states
  warning: '#FFA726',         // Warning states

  // Tab bar
  tabIconDefault: '#666666',
  tabIconSelected: '#FF3E3E', // Red accent for selected tab
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
