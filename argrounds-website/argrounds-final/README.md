# Grounds Maintenance Starter Site

This is a simple static starter site for **argrounds.com**.

## Stack
- HTML
- CSS
- Vanilla JavaScript

## Why this stack
This is the cleanest v1 for a local service business:
- fast to load
- easy to edit in Antigravity
- cheap or free to host
- no backend required for the first version

## File structure
```text
argrounds-starter/
├─ index.html
├─ 404.html
├─ robots.txt
├─ sitemap.xml
├─ CNAME
├─ css/
│  └─ styles.css
├─ js/
│  └─ main.js
└─ assets/
   ├─ favicon.svg
   └─ logo-mark.svg
```

## What to replace first
1. Replace the phone number everywhere in `index.html`.
2. Replace `grounds.helpme@gmail.com` with your real email.
3. Replace `FORM_ID` in the quote form action with your real Formspree form ID.
4. Replace the before/after placeholders with real photos.
5. Update service areas if needed.

## Sections already included
- Hero
- Offer section
- Proof/results section
- Process section
- Service area section
- Quote form
- Footer

## Fast launch path
### Option A: GitHub Pages
1. Create a GitHub repo.
2. Upload all files.
3. Turn on GitHub Pages in repo settings.
4. Keep the `CNAME` file so the site points at `argrounds.com`.
5. Set the domain DNS records with your registrar.

### Option B: Cloudflare Pages
1. Create a GitHub repo and push these files.
2. Create a Pages project in Cloudflare.
3. Connect the repo.
4. Build command: none
5. Output directory: `/`
6. Add `argrounds.com` in the custom domains section.

## Antigravity starting prompts
### Prompt 1 — project review
"Review this static website project for a local driveway and sidewalk cleaning business. Improve clarity, mobile conversion, and local-service trust signals without adding unnecessary complexity."

### Prompt 2 — homepage polish
"Refine the homepage copy for Grounds Maintenance. Keep the tone clean, direct, and conversion-focused. The business is starting with driveway cleaning, sidewalk cleaning, and bundled front concrete cleaning in Little Rock."

### Prompt 3 — image swap help
"Replace the placeholder proof section with a three-card gallery using my uploaded before-and-after concrete cleaning images. Optimize image sizing and mobile layout."

### Prompt 4 — lead capture upgrade
"Convert the quote form into a higher-converting local service lead form. Keep it simple and fast. Add hidden anti-spam handling and success-state UX for a static site using Formspree."

## Recommended next files later
- `privacy.html`
- `thank-you.html`
- `services/driveway-cleaning.html`
- `services/sidewalk-cleaning.html`
- `gallery.html`
- `reviews.html`

## Notes
Keep v1 focused. Do not turn this into a giant site before you have real reviews, photos, and job footage.
