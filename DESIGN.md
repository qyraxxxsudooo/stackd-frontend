# STAKED design system

The site sells food deals in Baku. It should read like a calm, well-made native app: one material, one accent, no decoration that does not carry information. Values live as CSS variables in `staked-glass.css` (the last stylesheet loaded); pages use the names, never raw values.

## Color

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--accent` | #c2500a | #f07a2a | Primary buttons, links, the selected item in any control |
| `--text` | #1f1d1a | #f1ece3 | Body and headings |
| `--muted` | #6b665e | #a39c90 | Secondary text, labels, inactive tabs |
| `--bg` | #f7f3ec | #141311 | Page behind everything |
| `--m-card` | white 92% | #262628 88% | Product cards |
| `--m-bar` | #fafafb 74% + blur | #18181a 72% + blur | Header, tab bar, category switch |
| `--m-panel` | #fafafb 86% + blur | #1e1e20 86% + blur | Settings, profile, dialogs |
| `--m-group` | white 78% | white 5% | Grouped rows inside a panel |
| `--m-fill` / `--m-fill-2` | grey 12% / 8% | grey 24% / 14% | Quiet buttons, inputs, steppers |
| `--m-tint` | accent 13% | accent 20% | Selected pill in tabs, chips, segmented controls |
| `--m-danger` | #d70015 | #ff453a | Destructive actions, field errors |
| `--m-ok` | #248a3d | #30d158 | Success messages |

Text contrast stays at 4.5:1 or more. Telegram blue (#2aabee) appears only on the "Open Telegram channel" button.

## Typography

Inter, falling back to the system UI font. Headings 600 to 700 with −0.018em tracking. Body 15 to 16px, labels 13px at 500 to 600, captions 12.5px. No all-caps labels; badges and section labels use sentence case. Prices and balances use tabular figures.

## Spacing and layout

8px grid with 4px half-steps. Page column 1120px plus 16 to 40px side padding; the header bar is full width, but its contents align to that column. Panels have 16 to 20px padding; groups inside them have 14px padding and sit 10px apart.

## Shape and depth

Radii: cards 22px, panels 24px, groups 16px, controls 12px, small actions and selected pills fully round. Three shadows: resting (`--m-shadow`), hover (`--m-shadow-hover`), floating (`--m-shadow-float`, panels only). Backdrop blur only on fixed chrome (header, tab bar, panels); scrolling content never blurs what is behind it, which keeps phones at 60 fps.

## Components

- **Primary button:** solid accent, 12px radius, or a full pill when small. Hover brightens by 6%, press scales to 0.98, disabled is 50% opacity.
- **Quiet button:** `--m-fill` with text colour and no border.
- **Destructive:** text-only in `--m-danger`.
- **Segmented control, category chips and tab bar:** the same capsule, with a `--m-tint` pill that slides between items on a soft spring (0.42s).
- **Inputs:** `--m-fill-2` with no border. On focus they get the card colour, an accent edge and a 3px tint ring.
- **Panels:** a title row with a round 32px close button, then grouped rows. List rows are 46px tall with a chevron, separated by hairlines.

## Motion

- **Easing:** `cubic-bezier(.2,.8,.2,1)` for everything that is not a slide between items. The sliding pill uses `cubic-bezier(.3,1.25,.45,1)`.
- **Durations:** 0.15s for presses, 0.2 to 0.25s for colour and fade, 0.34 to 0.42s for layout.
- **Theme change:** one 0.26s cross-fade.
- **Clearing the cart:** rows slide out one after another, then the sheet closes to its new height.
- **Reduced motion:** all of these are removed.

## Imagery and icons

Product photos fill the top of the card edge to edge. Icons are 1.8px-stroke line icons from the site's own sprite. Empty states use text and one action, with no illustration.
