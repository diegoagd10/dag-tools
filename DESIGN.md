---
name: Kanagawa-Inspired Dark System
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#b2ccc1'
  on-secondary: '#1e352d'
  secondary-container: '#374e46'
  on-secondary-container: '#a5beb4'
  tertiary: '#ffb3b0'
  on-tertiary: '#621016'
  tertiary-container: '#390005'
  on-tertiary-container: '#cb5f5f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#cee8dd'
  secondary-fixed-dim: '#b2ccc1'
  on-secondary-fixed: '#081f19'
  on-secondary-fixed-variant: '#344b43'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#80272a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

This design system evokes the dramatic power and refined aesthetics of traditional ukiyo-e art, recontextualized for a high-performance digital environment. The brand personality is **sophisticated, atmospheric, and focused**. It targets creative professionals and technical users who value a workspace that feels like a curated gallery rather than a generic utility.

The design style is **Modern-Minimalist with an Atmospheric twist**. It utilizes deep, "ink-washed" surfaces to reduce eye strain, paired with precision-engineered typography. The aesthetic response should be one of "calm intensity"—where the vastness of the dark canvas makes every accent color and piece of content feel intentional and precious.

## Colors

The palette is anchored in a **Midnight Ink** spectrum. Surfaces are not pure black, but rather deep, desaturated ocean blues and charcoals that provide a sense of depth.

- **Primary Canvas:** A deep navy-charcoal (#020617) serves as the foundation.
- **Accents:** 
    - **Sage Green (#8AA399):** Used for primary actions, success states, and growth indicators. It provides a natural, calming contrast to the dark base.
    - **Muted Red (#B24C4C):** Used sparingly for highlights, destructive actions, or "Dragon’s Breath" emphasis points.
- **Text & UI Contrast:** High-contrast silver and off-white tones are used for legibility, with secondary text dropping into slate grays to maintain hierarchy.

## Typography

The typography strategy balances geometric modernism with technical precision. 

**Sora** is utilized for headlines to provide a bold, futuristic presence that feels high-tech. **Inter** handles the heavy lifting for body copy, ensuring maximum readability across varying screen densities. For metadata, code, and small status labels, **JetBrains Mono** is employed to reinforce the "engineered" feel of the system.

- **Hierarchy:** Use weight over size for differentiation. Headlines should feel anchored and heavy.
- **Contrast:** Always use the highest contrast text (Off-white) for primary content and Slate-300 for secondary descriptions.

## Layout & Spacing

The layout follows a **Fluid Grid** model with generous "Negative Space" to mimic the traditional Japanese concept of *Ma* (the space between).

- **Desktop:** 12-column grid with 64px outer margins. Content should feel centered and breathable.
- **Mobile:** 4-column grid with 16px margins. 
- **Rhythm:** An 8px base unit governs all dimensions. Vertical rhythm is strictly enforced to ensure the dark interface feels structured and stable rather than floating.

## Elevation & Depth

In this dark theme, depth is communicated through **Tonal Layering** and **Subtle Inner Glows** rather than traditional drop shadows.

- **Surface Levels:** As elements "rise" toward the user, they become slightly lighter in tone (shifting from Navy-950 to Navy-800).
- **Glassmorphism:** Use high-diffusion backdrop blurs (20px+) on navigation bars and overlays to maintain a sense of the "oceanic" depth beneath the active layer.
- **Outlines:** Use 1px semi-transparent borders (Slate-700/50) to define element boundaries instead of shadows, ensuring the UI remains crisp on OLED screens.

## Shapes

The shape language is **Refined and Rounded**. By using a `roundedness` level of 2 (0.5rem base), we soften the aggressive nature of the dark color palette, making the interface feel more approachable and modern.

- **Buttons:** Fully rounded (pill-shaped) for primary actions to distinguish them from structural containers.
- **Cards/Containers:** 1rem (rounded-lg) corner radius to provide a soft, pebble-like quality to information modules.

## Components

- **Buttons:** Primary buttons use a Sage Green background with dark text for maximum "pop." Secondary buttons are "ghost" style with a Sage border.
- **Inputs:** Fields are dark-recessed (#020617) with a subtle 1px border that glows Sage Green when focused.
- **Chips:** Small, low-contrast capsules using Slate-800 backgrounds with Silver-200 text for non-intrusive categorization.
- **Cards:** Use a "Surface Elevated" color (#1E293B) with no shadow. Define the edge with a thin, 1px stroke that is slightly lighter than the background.
- **Lists:** Separated by thin, low-opacity horizontal lines (10% opacity white) to maintain a clean, editorial look without cluttering the dark canvas.
- **Progress Indicators:** Use the Muted Red accent for high-urgency tasks and Sage Green for standard progression.