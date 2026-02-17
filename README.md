# Scholar Capital

Academic network explorer. Search for researchers and visualize their papers, co-authors, and citations as an interactive graph.

**Live:** [scholar.capital](https://scholar.capital)

## Setup

```bash
pnpm install
pnpm dev
```

Optionally add an OpenAlex API key in `.env.local` for higher rate limits:

```
OPENALEX_API_KEY=your_key
```

## URL Swap

Replace `scholar.google.com` with `scholar.capital` in any Google Scholar profile URL.

## Stack

Next.js, TypeScript, Tailwind CSS, Cytoscape.js, OpenAlex API
