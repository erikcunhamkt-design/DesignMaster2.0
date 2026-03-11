

## Problem

The carousel-master hero image is very dark (black background with red neon accents). At `opacity: 0.15` with a gradient overlay on a dark card, it's nearly invisible — appearing as if it doesn't fill the card.

## Solution

Increase the opacity of the image specifically for darker hero images, and reduce the gradient overlay intensity so the image is more visible. Two approaches:

**Approach: Increase image opacity in ToolCard**
- Change the background image `opacity` from `0.15` to `0.25-0.30` to make darker images more visible
- Lighten the gradient overlay from `from-card via-card/80` to `from-card via-card/60`

This affects all cards with images, but since other hero images (extrator, chat, etc.) are also on dark backgrounds, a slightly higher opacity will improve visibility across the board while keeping text readable.

### Files to modify
- `src/components/dashboard/ToolCard.tsx` — Change `style={{ opacity: 0.15 }}` to `style={{ opacity: 0.28 }}` and adjust gradient overlay to `via-card/60`

