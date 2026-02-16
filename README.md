# Scholar Capital

Explore any researcher's academic network as an interactive visualization. Search by name, click to expand co-author networks, and discover connections across papers and institutions.

## Features

- **Search Profiles**: Search for any researcher by name using OpenAlex
- **Instant Visualization**: Convert profiles to interactive network graphs
- **Progressive Disclosure**: Start with top 20 papers, expand to see more
- **Network Exploration**: Click nodes to explore co-authors and citations
- **Citation Analysis**: View citation counts, h-index, and publication metrics
- **Full Author Data**: Author names and venues available immediately (no extra API calls)

## Getting Started

### 1. Install Dependencies

This project uses `pnpm` as the package manager:

```bash
pnpm install
```

### 2. Configure API Key

Create a `.env.local` file with your OpenAlex API key:

```
OPENALEX_API_KEY=your_api_key_here
```

Get your free API key from [OpenAlex](https://openalex.org/settings/api). Without a key, the app is limited to 100 API credits per day.

### 3. Run the Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Usage

1. Visit the homepage
2. Search for researchers by name
3. Click on a profile from the search results
4. Explore the interactive network visualization
5. Click on paper nodes to see details, authors, and venue
6. Click on author names to expand their paper network into the graph

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
│   ├── api/scholar/        # API routes (proxies to OpenAlex)
│   ├── citations/          # Visualization page
│   └── page.tsx            # Homepage with search
├── components/
│   ├── graph/              # Graph visualization components
│   └── ui/                 # UI components (loading, error)
├── lib/
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── openalex.ts         # OpenAlex API client
│   └── scholar-client.ts   # Normalized scholar data client
└── public/                 # Static assets
```

## API Reference

This project uses [OpenAlex](https://openalex.org/) for scholarly data:

- [Authors API](https://docs.openalex.org/api-entities/authors) - Search and retrieve author profiles
- [Works API](https://docs.openalex.org/api-entities/works) - Papers, articles, and other scholarly works

OpenAlex is a fully open catalog of 240M+ scholarly works, authors, sources, and institutions.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: Cytoscape.js
- **Data Source**: OpenAlex API

## Deployment

Deploy to Vercel, Netlify, or any platform that supports Next.js:

```bash
# Build the app
pnpm build

# The app is ready to deploy
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
