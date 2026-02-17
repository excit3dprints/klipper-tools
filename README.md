# Klipper Tools

A collection of browser-based utilities for Klipper 3D printer configuration.

## Features

### Pin Mapper
- Paste your `printer.cfg` and validate stepper pin assignments against known board pinouts
- Auto-detects board from pin signatures
- Highlights mismatches with suggested fixes
- Detects pin conflicts across sections
- Visual board layout + comparison table view

### PA Calculator
- Enter test speeds and accel values
- Flow rate auto-calculates from `Speed × Line Width × Layer Height`
- Individual PA value per speed/accel combo
- One-click copy of output strings in `PA, Flow, Accel` format

## Supported Boards

- BTT Octopus Pro v1.0 / v1.1
- BTT Octopus v1.1
- BTT Kraken
- BTT Manta M8P v1.0/1.1 / v2.0

## GitHub Pages Setup

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **main branch / root**
4. Access at `https://<username>.github.io/<repo-name>/`

No build step required — pure HTML/CSS/JS.

## File Structure

```
├── index.html          # Main entry point
├── css/
│   ├── main.css        # Shared design system & nav
│   ├── pin-mapper.css  # Pin mapper styles
│   └── pa-calc.css     # PA calculator styles
└── js/
    ├── boards.js           # Board pin definitions
    ├── pin-mapper.js       # Config parsing & detection logic
    ├── pin-mapper-ui.js    # Pin mapper render & UI actions
    └── pa-calc.js          # PA calculator logic & UI
```
