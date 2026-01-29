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

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

## Deployment

The app is configured for Heroku deployment.

```bash
# Create Heroku app (if not already created)
heroku create app-name --team your-team

# Deploy
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
