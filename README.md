# Scholar Capital

Transform any Google Scholar profile into an interactive network visualization by simply replacing "scholar.google.com" with "scholar.capital" in the URL.

## Features

- 🔍 **Search Profiles**: Search for any researcher by name, just like Google Scholar
- 📊 **Instant Visualization**: Convert profiles to interactive network graphs
- 🎯 **Progressive Disclosure**: Start with top 10 papers, expand to see more
- 🔗 **Network Exploration**: Click nodes to explore co-authors and citations
- 📈 **Citation Analysis**: View citation counts and publication metrics
- 🔄 **URL Replacement**: Replace "scholar.google.com" with "scholar.capital" in any URL

## Getting Started

### 1. Install Dependencies

This project uses `pnpm` as the package manager:

```bash
pnpm install
```

### 2. Configure API Key

Copy the example environment file and add your SearchAPI key:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API key:
```
SEARCHAPI_API_KEY=your_api_key_here
```

Get your API key from [SearchAPI](https://www.searchapi.io/).

### 3. Run the Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 4. (Optional) Test Domain Replacement Locally

To test the `scholar.google.com` → `scholar.capital` URL replacement locally:

**Edit your hosts file:**

Linux/Mac:
```bash
sudo nano /etc/hosts
```

Windows: Edit `C:\Windows\System32\drivers\etc\hosts` as Administrator

**Add this line:**
```
127.0.0.1    scholar.capital
```

**Then visit:**
```
http://scholar.capital:3000
```

See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for detailed instructions.

## Usage

### Method 1: URL Replacement (Recommended)

This is the primary feature of Scholar Capital!

Replace `scholar.google.com` with `scholar.capital` in any Google Scholar profile URL:

```bash
# Original
https://scholar.google.com/citations?user=Yua2oBoAAAAJ&hl=en

# New
https://scholar.capital/citations?user=Yua2oBoAAAAJ&hl=en
```

### Method 2: Search for Researchers (Limited)

1. Visit the homepage
2. Search by common first names only (e.g., "Mike", "John", "David")
3. Click on a profile from the search results
4. Explore the interactive network visualization

**Note:** Profile search has very limited data coverage. For best results, use the URL replacement method above.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Project Structure

```
scholarcapital/
├── app/
│   ├── api/scholar/        # API routes for Google Scholar data
│   ├── citations/          # Visualization page
│   └── page.tsx            # Homepage with search
├── components/
│   ├── graph/              # Graph visualization components
│   ├── search/             # Search result components
│   └── ui/                 # UI components (loading, error)
├── lib/
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── searchapi.ts        # API client for SearchAPI
└── public/                 # Static assets
```

## Documentation

- [API Documentation](./API_DOCUMENTATION.md) - API routes and endpoints
- [Local Testing Guide](./LOCAL_TESTING.md) - Testing domain replacement locally
- [Usage Guide](./USAGE_GUIDE.md) - How to use the visualization

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: react-force-graph-2d
- **Data Source**: Google Scholar (via SearchAPI)

## Deployment

Deploy to Vercel, Netlify, or any platform that supports Next.js:

```bash
# Build the app
pnpm build

# The app is ready to deploy
```

For the URL replacement feature to work in production, deploy to the `scholar.capital` domain.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
