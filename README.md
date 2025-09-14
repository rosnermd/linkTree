# Biolink (Self-Hosted Link in Bio Tool)

A free, self-hosted alternative to subscription “link in bio” services.
This project lets you create your own personal landing page with profile image, social links, categories, and a contact form — all deployable for free on Cloudflare Pages.

## Features

- **Custom profile:** Easily swap your profile image, name, and username.
- **Markdown-based config:** Add/edit social links and categories directly in `data.md`.
- **Contact form:**
  - Scrolls into view when clicking an email link.
  - Posts JSON payloads to any endpoint (Zapier, Make, DataTruck, etc.).
  - Includes fallbacks for TikTok/Instagram/Facebook in-app browsers.
- **Analytics ready:** Drop in [Umami]([https://umami.is/](https://github.com/umami-software/umami)), [Plausible]([https://plausible.io/](https://github.com/plausible/analytics)), [Matomo]([https://mato.dev/](https://github.com/matomo-org/matomo)), or Google Analytics.
- **Accessible and responsive:** Works across devices, supports fallback for old webviews, and auto-adjusts layout.
- **Deploy for free:** Optimised for Cloudflare Pages with no server requirements.

## Getting Started

1. **Clone this repository**
   ```sh
   git clone https://github.com/kingfisherfox/clikkable.git
   cd clikkable
   ```
2. **Customise your profile**
   - Edit `data.md`:
     - Replace YOUR NAME, @YOURUSERNAME, and the hero image (`img/profile.jpg`).
     - Update or add social links (TikTok, GitHub, YouTube, Email, etc.).
     - Add categories with icons, URLs, and descriptions.
3. **Update HTML metadata**
   - Edit `index.html`:
     - Change `<title>`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, and `<meta property="og:image">`.
     - Update the JSON-LD Person schema with your name, username, and social profiles.
     - (Optional) Insert analytics tracking scripts before `</head>`.
4. **Configure the contact form**
   - Edit `form.js`:
     - Replace the placeholder:
       ```js
       const ENDPOINT = 'ADD YOUR OWN ENDPOINT HERE';
       ```
     - with your form endpoint (Zapier, Make, DataTruck.cc, etc.).
   - The form collects:
     - Name
     - Email
     - Message
     - Plus metadata (timestamp, user agent, origin)
   - It automatically falls back to sendBeacon or no-cors fetch for in-app browsers.
5. **Deploy with Cloudflare Pages**
   - Create a free Cloudflare account.
   - Go to Workers & Pages → Pages → Create Project → Connect to Git.
   - Select your repo (e.g., `clikkable-YOURUSERNAME`).
   - Use production branch = `main`.
   - Click Save and Deploy.
   - Cloudflare will give you a `.pages.dev` URL.
   - Optionally, buy a custom domain through Cloudflare for a few dollars.

## File Structure

```
.
├── index.html        # Main entry page with meta and contact form
├── data.md           # Markdown config for profile, links, and categories
├── js/
│   ├── bio.utils.js  
│   ├── bio.parser.js 
│   ├── bio.render.js 
│   ├── bio.analytics.js
│   ├── bio.main.js   
│   └── form.js       # Contact form logic
├── styles.css        # Page styling
├── img/
│   ├── profile.jpg   # Replace with your own hero/profile image
│   └── icons...      # Custom icons for links and categories
```

## Customisation Tips

- **Add more social icons:** Extend the list in `data.md`. You can use hosted icons (Flaticon, Iconify, etc.) or add PNGs/SVGs to `/img/`.
- **Change form behaviour:** Update `form.js` if you want extra fields. Copy `index.html` form block and adjust inputs accordingly.
- **Analytics:** Drop your tracking snippet (Umami, Plausible, GA, etc.) into `index.html` inside `<head>`.
- **Styling:** Modify `styles.css` or replace the font with your preference.

## Caveats

This is a basic project built to avoid SaaS lock-in. It's intentionally simple — perfect for creators who want a no-cost link-in-bio solution. If you’re a developer, feel free to fork and improve.

## Licence

MIT — free to use, modify, and distribute.
