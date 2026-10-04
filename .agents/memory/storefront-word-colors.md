---
name: Storefront word colors
description: Rendering constraint for the Badshah storefront's per-word randomized text colors.
---

Use CSS Custom Highlights with ranges to color words. Do not wrap React-managed text nodes or rewrite their contents.

**Why:** The storefront needs per-word colors while React remains responsible for the page DOM.

**How to apply:** Keep the effect limited to customer-facing pages, preserve each word's color during the current visit, and clear highlights when the effect is disabled or unmounted.