# Colorado Tax Credit Calculator

A React-based calculator that helps Colorado residents estimate their eligibility for various state and federal tax credits.

## Tax Credits Covered

- Colorado Child Tax Credit (COCTC)
- Colorado Family Affordability Tax Credit (FATC)
- Colorado Earned Income Tax Credit (EITC)
- Colorado Care Worker Credit
- Federal Child Tax Credit (CTC)
- Federal Earned Income Tax Credit (EITC)

## Tech Stack

- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS
- Radix UI components

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env

# Start development server (runs on http://localhost:3000)
npm run dev
```

### Environment Variables

All `VITE_*` variables are baked in at **build time** by Vite. They must be set before running `npm run build` or `npm run dev`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_MFB_API_KEY` | Yes | — | API key for the MyFriendBen backend |
| `VITE_MFB_DOMAIN` | Yes | — | Base URL of the MFB API (e.g. `https://myfriendben.org`) |
| `VITE_MFB_FRONTEND_DOMAIN` | Yes | — | MFB frontend URL for the "Meet MyFriendBen" link (e.g. `https://co.myfriendben.org`) |
| `VITE_PARENT_ORIGIN` | No | `*` | Target origin for `postMessage` iframe height sync. Set to your parent site's origin in production. |
| `VITE_DEFAULT_WHITE_LABEL` | No | `gac` | Default white label slug used for the root `/` route redirect |
| `PORT` | No | `3000` | Port for the Express production server (runtime, not build time) |

See `.env.example` for a template.

## Deployment

### Heroku

```bash
# Create Heroku app (first time only)
heroku create app-name --team your-team

# Set required environment variables and deploy
heroku config:set \
  VITE_MFB_API_KEY=your_key \
  VITE_MFB_DOMAIN=https://api.myfriendben.org \
  VITE_MFB_FRONTEND_DOMAIN=https://screener.myfriendben.org \
  --app app-name

git push heroku main
```

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── Calculator.tsx    # Main calculator component
│   │   └── ui/               # Reusable UI components
│   ├── utils/
│   │   └── taxCalculator.ts  # Tax credit calculation logic
│   ├── styles/
│   │   └── globals.css       # Global styles and CSS variables
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── server.js                 # Express server for production
├── vite.config.ts            # Vite configuration
└── package.json
```
