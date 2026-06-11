# whatprogramstoday

A lightweight, browser-based daily schedule board for schools. Staff can quickly build a roster of which programs are visiting which schools today, then display it as a clean, large-screen signage board — perfect for TVs and reception screens.

## Features

- **Schedule Builder** — Search or type a school name and program name, add multiple entries, and publish in one click.
- **Display Board** — A full-screen view optimised for large monitors and signage screens, showing today's schedule as cards.
- **Smart date handling** — Schedules are automatically reset each new day (based on the Australia/Sydney timezone), so you always start fresh.
- **Custom entries** — Schools and programs not in the preset lists can be typed in freely.
- **Shareable link** — Copy a share link from the display board to send to colleagues.
- **Light / Dark mode** — Toggle between themes; preference is persisted in `localStorage`.
- **No backend required** — Everything runs in the browser. State is stored in `localStorage`.

## Project Structure

```
whatprogramstoday/
├── index.html        # Schedule builder (home page)
├── view.html         # Display board page
├── vercel.json       # Vercel deployment config (clean URLs)
├── schools.txt       # Preset list of school names (one per line)
├── programs.txt      # Preset list of program names (one per line)
├── css/
│   └── style.css     # All styles (light + dark theme)
└── js/
    ├── app.js        # Builder logic, combobox dropdowns, localStorage management
    └── view.js       # Display board rendering logic
```

## Customising Schools & Programs

Edit `schools.txt` and `programs.txt` to match your organisation's schools and programs. Each entry goes on its own line:

```
# schools.txt
Sydney Grammar School
Melbourne High School
Albert Park Primary
```

```
# programs.txt
Science Camp
Robotics Workshop
Coding Bootcamp
```

Users can also type any custom name directly in the form — it doesn't have to appear in either list.

## Deployment

The project is a static site with no build step required.

### Vercel (recommended)

1. Push the repository to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Deploy — no build command or output directory needed.

The `vercel.json` enables clean URLs so `/view` serves `view.html` without the `.html` extension.

### Local development

Open `index.html` directly in a browser, or serve the folder with any static file server:

```bash
npx serve .
```

> **Note:** Fetching `schools.txt` / `programs.txt` requires a server (even a local one). If you open `index.html` as a `file://` URL the app falls back to built-in default lists.

## How It Works

1. **Build** — Open the home page, click **Create Today's Schedule**, then add school + program pairs.
2. **Publish** — Click **Publish & View**. The schedule is saved to `localStorage` tagged with today's date.
3. **Display** — The display board reads from `localStorage` and renders each entry as a card. Share the URL for others on the same network to view.
4. **Next day** — On the next day the app detects the date change and clears the previous schedule automatically.

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styles | Vanilla CSS (custom properties for theming) |
| Logic | Vanilla JavaScript (ES2020+) |
| Icons | [Lucide](https://lucide.dev) (via CDN) |
| Hosting | Vercel |
