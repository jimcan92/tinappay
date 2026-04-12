# Design System Specification

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **The Artisanal Ledger**. 

Traditional ERPs are often cold, industrial, and rigid. This system rejects that clinical approach in favor of a "High-End Editorial" experience that mirrors the craftsmanship of a boutique bakery. We are moving away from the "standard dashboard" look by utilizing intentional asymmetry, sophisticated tonal layering, and a typography scale that feels more like a premium magazine than a spreadsheet. 

The goal is to provide a "Soft Minimalism" that reduces cognitive load in high-pressure environments while maintaining a bespoke, premium warmth. We achieve this through "The Breathing Grid"—where whitespace is used as a functional tool rather than a luxury.

## 2. Colors
This palette is rooted in organic, earthy tones that evoke the warmth of a baker’s oven and the precision of a professional kitchen.

### Palette Strategy
*   **The "No-Line" Rule:** To achieve a premium feel, designers are strictly prohibited from using 1px solid borders to define sections. Boundaries must be established through background color shifts. For example, a `surface-container-low` (`#f3f0ec`) sidebar sitting against a `surface` (`#f9f6f2`) main stage.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical layers. Use the tiers from `surface-container-lowest` to `highest` to create "nested" depth. An inner card should be `surface-container-lowest` (`#ffffff`) to pop against a `surface-container-low` (`#f3f0ec`) parent container.
*   **The "Glass & Gradient" Rule:** Primary actions should not be flat. Utilize subtle gradients (e.g., transitioning from `primary` `#9b4000` to `primary-container` `#fe8848`) to provide a tactile, "honey-glazed" soul to CTAs. For floating elements or overlays, use Glassmorphism (semi-transparent surface colors with a 16px-24px backdrop blur).

### Key Tokens
*   **Primary (Action):** `#9b4000` (Deep Orange) | `on-primary`: `#fff0ea`
*   **Background (Stage):** `#f9f6f2` (Warm Cream)
*   **Surface (Cards/Panels):** `#f9f6f2` to `#dfddd8` (Surface tiers)
*   **Text (Readability):** `#2f2f2c` (`on-surface`) for high-contrast legibility.

## 3. Typography
We use a dual-font strategy to balance character with utility.

*   **Display & Headlines (Plus Jakarta Sans):** This is our "Editorial" voice. It is modern, clean, and has a rhythmic spacing that feels high-end. Use `headline-lg` (2rem) for dashboard titles to establish a clear anchor point for the eye.
*   **Body & Labels (Manrope):** Chosen for its exceptional legibility in fast-paced environments. Manrope’s geometric structure ensures that even at `label-sm` (0.6875rem), data points like stock counts or prices remain crystal clear.

**Visual Hierarchy Tip:** Never use bold weights for body text unless it is a critical alert. Instead, use scale (size) and tonal shifts (switching from `on-surface` to `on-surface-variant`) to guide the user’s eye.

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than structural lines.

*   **The Layering Principle:** Soft, natural lift is achieved by "stacking." A `surface-container-lowest` element (White) on a `surface` background (Cream) creates an immediate, soft elevation without the need for a shadow.
*   **Ambient Shadows:** If an element must "float" (like a modal or a floating action button), use an extra-diffused shadow. 
    *   *Shadow Token:* `0px 12px 32px rgba(47, 47, 44, 0.06)`. Note the color: we use a 6% opacity of the `on-surface` color, never pure black, to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a container requires definition against a similar background, use a "Ghost Border": `outline-variant` (`#afada9`) at **15% opacity**. This provides a hint of structure without breaking the editorial flow.
*   **Glassmorphism:** Use for sidebar navigations or top headers to allow background colors to bleed through. This makes the interface feel integrated and organic.

## 5. Components

### Buttons
*   **Primary:** High-pill roundedness (`full`: 9999px). Use the "Signature Gradient" (Primary to Primary-Container).
*   **Secondary/Ghost:** `outline-variant` (Ghost Border) with `on-surface` text. These should feel lighter and less intrusive.

### Cards & Data Tables
*   **No Dividers:** Forbid the use of divider lines in tables and lists. 
*   **Table Layout:** Use alternating row backgrounds (Zebra-striping) using `surface-container-low` and `surface-container-lowest`. 
*   **Cell Padding:** Tables must have generous vertical padding (12px-16px) to maintain the "Editorial" feel and ensure readability in a fast-paced bakery environment.

### Sidebar Navigation
*   **Structure:** Semi-transparent `surface-container-low` with a subtle backdrop blur.
*   **Active State:** Use a `primary-container` background with a `primary` vertical "indicator" pill on the left edge. 

### Chips & Status Indicators
*   **Status Tones:** Use `error-container` for "Critical Low" stock and `tertiary-container` for "Sufficient" stock. 
*   **Shape:** Always use `sm` (0.25rem) or `md` (0.75rem) roundedness to keep them distinct from the fully rounded action buttons.

## 6. Do's and Don'ts

### Do
*   **Do** use vertical white space to separate groups of information instead of lines.
*   **Do** use `plusJakartaSans` for all currency and large numeric data points to give them a "premium" weight.
*   **Do** use asymmetric layouts for dashboards—for example, a wide "Trends" graph next to a narrow "Quick Stats" column to avoid a boring "grid" feel.

### Don't
*   **Don't** use 100% opaque black for text. It is too harsh against the cream background; use `on-surface` (`#2f2f2c`).
*   **Don't** use sharp 90-degree corners. Even the "none" setting in our scale should be avoided for primary UI containers; stick to `lg` (1rem) or `xl` (1.5rem).
*   **Don't** crowd the interface. If a baker cannot read a stock level from three feet away, the design has failed. Increase the `body-lg` leading (line-height) to compensate.