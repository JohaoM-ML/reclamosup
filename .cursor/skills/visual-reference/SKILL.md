---
name: visual-reference
description: Analyze visual designs and generate comprehensive style reference documents with persistent storage. Use when the user wants to analyze a screenshot, website design, or UI reference image to extract color palettes, typography, design tokens, and visual patterns. Also use when the user says /visual-reference, "extract design tokens", "analyze this design", or pastes a screenshot asking about its visual style.
---

# Visual Reference — Design Token Extractor

Analyze visual designs, extract structured design tokens, and persist them to disk.

Source: https://gist.github.com/Railly/379ba340be18017cc7d8fc141f466c68

## Input Modes

The skill accepts three input modes:

### Mode 1: Screenshot in conversation (most common)

User pastes/attaches an image. Use it directly.

### Mode 2: URL provided

User provides a website URL. Use `agent-browser` (if available) to capture a screenshot:

```bash
agent-browser open {url}
agent-browser screenshot /tmp/vr-{slug}.png --full
```

If `agent-browser` is not installed, ask the user for a screenshot instead.

### Mode 3: Existing folder

User references an existing folder with prior analysis. Read from that path.

## Workflow

### Step 1: Determine slug, date, and output directory

- Derive a slug from the site/design name (e.g., "cursor.directory" → "cursor-directory"). Slug must be lowercase, hyphenated, no special characters.
- Use today's date in `YYYY-MM-DD` format.
- **Default output dir**: `./visual-reference/{slug}/` (relative to the user's current working directory).
- If the user specifies an output path, use that instead.
- Create the directory if it doesn't exist.

### Step 2: Save the screenshot

- If the screenshot was pasted in conversation, save it to `{output_dir}/reference-desktop.png`. If the image is inline, ask the user to save it to a path first, then copy it.
- If `agent-browser` was used, the screenshot is already at `/tmp/vr-{slug}.png` — copy it to `{output_dir}/reference-desktop.png`.

### Step 3: Analyze the design

Generate a markdown document with these 5 sections:

1. **Core Aesthetic** — Style name (be specific and evocative, e.g. "Dark Minimal SaaS Directory"), one-sentence design philosophy, key influences or hybrid styles.
2. **Color Palette** — Table with: Color Name, Hex Code, Usage Context. Include ALL colors visible. Group into background, accent, text.
3. **Typography System** — Font families (display, body, mono), sizes, weights, line heights, tracking. Be specific with values.
4. **Key Design Elements** — Textures, graphic elements, layout structure, unique stylistic choices. List effects with slugified identifiers (e.g., "grid-background", "neon-glow-subtle", "card-hover-lift").
5. **Visual Concept** — Conceptual bridge, element relationships, ideal use cases.

Guidelines: Be specific with hex codes, font names, pixel values. Use tables for colors. Identify what makes the design distinctive.

Save to: `{output_dir}/visual-reference.md`

### Step 4: Generate design-tokens.json

Extract a structured JSON token file from the analysis. Follow this exact schema:

```json
{
  "slug": "site-name",
  "sourceUrl": "https://...",
  "date": "YYYY-MM-DD",
  "colors": {
    "background": { "primary": "#hex", "secondary": "#hex", "tertiary": "#hex" },
    "accent": { "primary": "#hex", "secondary": "#hex" },
    "text": { "primary": "#hex", "secondary": "#hex", "muted": "#hex" }
  },
  "typography": {
    "fontFamily": {
      "display": "Font Name",
      "body": "Font Name",
      "mono": "Font Name"
    },
    "fontSize": { "hero": "72px", "h1": "48px", "h2": "32px", "body": "16px", "small": "14px", "micro": "12px" },
    "fontWeight": { "bold": 700, "semibold": 600, "regular": 400 },
    "lineHeight": { "tight": 1.1, "normal": 1.5, "relaxed": 1.7 }
  },
  "spacing": { "section": "80px", "element": "24px", "tight": "8px" },
  "borderRadius": { "card": "12px", "button": "8px", "pill": "9999px" },
  "shadow": {},
  "animation": {
    "duration": { "fast": "150ms", "normal": "300ms" },
    "easing": { "default": "ease-out" }
  },
  "effects": ["slug-1", "slug-2"]
}
```

Fill in actual values from the analysis. Omit `sourceUrl` if no URL was provided. Save to: `{output_dir}/design-tokens.json`.

### Step 5: Output summary

Print a summary to the conversation:

```
Saved to: {output_dir}/
- reference-desktop.png ({size})
- visual-reference.md
- design-tokens.json
```

## Important Notes

- ALWAYS save all three files. The whole point of this skill is persistence.
- Hex codes must be real — extract them carefully from the image, don't guess generic values.
- The slug should be lowercase, hyphenated, no special characters.
- If the user gives a URL AND a screenshot, prefer the screenshot for analysis but include the URL as `sourceUrl` in the JSON.
- Effects list in `design-tokens.json` should use slugified names (e.g., "dark-premium-aesthetic", "card-hover-lift", "hairline-borders").
- This skill is agnostic to any specific vault or project structure. Output defaults to the current working directory; the user can override with any path.

## ReclamoUP (this project)

When analyzing for ReclamoUP UX improvements, default slug is `reclamoup` and output dir is `visual-reference/reclamoup/`. After generating tokens, ask the user if they want them applied to `app/globals.css` and UI components.
