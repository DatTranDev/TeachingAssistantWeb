export const TYPOGRAPHY = {
  // Font weights
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Font sizes (rem)
  sizes: {
    xs: '0.75rem', // 12px — captions, badges
    sm: '0.875rem', // 14px — secondary text
    base: '1rem', // 16px — body text
    lg: '1.125rem', // 18px — card titles
    xl: '1.25rem', // 20px — section headings
    '2xl': '1.5rem', // 24px — page titles
  },
  // Common text style presets
  styles: {
    pageTitle: 'text-2xl font-bold',
    sectionHeading: 'text-xl font-semibold',
    cardTitle: 'text-lg font-semibold',
    body: 'text-base font-normal',
    secondary: 'text-sm text-muted',
    caption: 'text-xs text-muted',
  },
} as const;
