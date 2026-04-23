# Design System Strategy: The Industrial Hearth

## 1. Overview & Creative North Star
This design system is built upon the concept of **"The Industrial Hearth."** It is a visual dialogue between the precision of high-grade industrial machinery and the warmth of an artisanal bakery. In a market saturated with "flat" SaaS templates, this system establishes a signature identity by treating the ERP not as a utility, but as a digital workshop.

**The Creative North Star: Precision Craftsmanship.**
We break the traditional grid through **Intentional Depth**. By moving away from lines and boxes, we use tonal layering to create an editorial feel. The UI should feel like a high-end magazine layout that has been engineered for enterprise-grade performance. It is tactile, warm, yet undeniably professional.

---

## 2. Colors: The Tonal Palette
The palette is derived from the core elements of the craft: glowing embers (`primary`), rich cocoa/crusts (`secondary`), and the clean, sterile surfaces of a professional kitchen (`surface`).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. Boundary definition must be achieved through:
*   **Background Shifts:** Place a `surface_container_low` element against a `surface` background.
*   **Tonal Nesting:** Use the hierarchy of `surface_container_lowest` (highest prominence) down to `surface_dim` (lowest) to create "stacked" depth.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
*   **Base:** `background` (#fcf9f8).
*   **The Canvas:** `surface_container_low` (#f6f3f2) for general workspace areas.
*   **The Component:** `surface_container_lowest` (#ffffff) for active cards or data modules.

### The "Glass & Gradient" Rule
To elevate the "Industrial" feel, use **Glassmorphism** for the sidebar and floating modals. 
*   **Sidebar Navigation:** Use `surface_container_low` with a 12px backdrop-blur and 85% opacity to allow the warmth of the background to subtly bleed through.
*   **Signature Textures:** Main Action Buttons (CTAs) should utilize a subtle linear gradient from `primary` (#8d4b00) to `primary_container` (#b15f00) at a 135-degree angle. This provides a "glow" reminiscent of a hot oven.

---

## 3. Typography: Editorial Authority
We utilize **Plus Jakarta Sans** to balance modern geometry with approachable curves.

*   **Display (lg/md):** Used for high-level bakery performance metrics. These should feel authoritative.
*   **The Variable Header:** The bakery's name (e.g., *Lenie’s Choice*) is the "Master Brand" of the instance. It should be rendered in `headline-sm` or `title-lg` with a high-contrast `on_surface` color, acting as the anchor for the sidebar.
*   **Labels & Metadata:** Use `label-md` in `on_surface_variant` (#554336). The slightly desaturated brown provides a sophisticated, "ink-on-paper" feel rather than a harsh grey.

---

## 4. Elevation & Depth: Tonal Layering
We reject the standard "drop shadow" in favor of **Ambient Light.**

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A `surface_container_lowest` card sitting on a `surface_container` creates a natural, soft lift.
*   **Ambient Shadows:** Where floating elements (like dropdowns) are required, use a wide-spread shadow: `Y: 8px, Blur: 24px, Color: #895033 (Secondary) at 6% opacity`. This creates a tinted shadow that feels organic to the warm environment.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` (#dbc2b0) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Sidebar (The Control Center)
*   **Width:** 280px fixed.
*   **Styling:** Sidebar-only layout. Use `surface_container_low`. 
*   **Active State:** Use a "pill" shape (Rounded: `full`) with a `primary_fixed` (#ffdcc3) background and `on_primary_fixed` (#2f1500) text.

### Buttons (The Interaction Points)
*   **Primary:** `primary` (#8d4b00) background, 8px (`DEFAULT`) rounded corners. No border. Subtle gradient as defined in Section 2.
*   **Secondary:** `secondary_container` (#feb28f) with `on_secondary_container` (#794227). 
*   **Tertiary:** Transparent background with `on_surface` text. Use a 4px `DEFAULT` radius on hover.

### Cards & Data Visualization
*   **The "No Divider" Rule:** Forbid the use of horizontal lines in lists or cards. Separate data rows using 8px of vertical whitespace or alternating `surface_container_low` and `surface` backgrounds.
*   **Data Viz:** High-quality charts should use a palette of `primary`, `secondary`, and `tertiary`. Avoid green/red unless indicating a critical error (`error` #ba1a1a). Use `tertiary` (#904821) for "growth" metrics to maintain the brand warmth.

### Input Fields
*   **Surface:** `surface_container_highest`. 
*   **Shape:** 8px rounded.
*   **Focus State:** A 2px "Ghost Border" using `primary` at 40% opacity.

---

## 6. Do's and Don'ts

### Do
*   **Do** treat the Bakery Name as a variable brand asset. Ensure it has enough "breathing room" (at least 32px padding) in the sidebar.
*   **Do** use `primary_fixed_dim` for subtle highlight areas to keep the interface feeling "sunny" and professional.
*   **Do** use asymmetrical spacing (e.g., more top padding than bottom in headers) to achieve the high-end editorial look.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#1b1c1c) to maintain the "deep brown" professional warmth.
*   **Don't** use standard 1px borders for table rows. Use subtle background shifts.
*   **Don't** use sharp 90-degree corners. Everything must adhere to the 8px (`DEFAULT`) or `lg` (16px) rounding scale to maintain the "artisanal" softness.