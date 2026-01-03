# Google Scholar Author API - SerpApi

The Google Scholar Author API by SerpApi allows you to scrape author results from the Google Scholar Author search page.

## API Endpoint

The API is accessed through the following endpoint:
`https://serpapi.com/search?engine=google_scholar_author`

A user can query this endpoint using a `GET` request.

## API Parameters

### Search Query Parameters

*   **`author_id`** (Required): Defines the ID of an author. This can be found using the Google Scholar Profiles API or directly from the Google Scholar user profile page (e.g., `https://scholar.google.com/citations?user={author_id}`).
*   **`hl`** (Optional): Defines the language for the search (e.g., `en` for English, `es` for Spanish). It's a two-letter language code.

### Advanced Google Scholar Author Parameters

*   **`view_op`** (Optional): Used for viewing specific parts of a page.
    *   `view_citation`: Select to view citations. Requires `citation_id`.
    *   `list_colleagues`: Select to view all co-authors.
*   **`sort`** (Optional): Used for sorting and refining articles.
    *   `title`: Sorts articles by "Title".
    *   `pubdate`: Sorts articles by publish "date".
    *   By default, articles are sorted by the number of citations.
*   **`citation_id`** (Optional): Used for retrieving individual article citations. Required when `view_op=view_citation` is selected.

### Pagination Parameters

*   **`start`** (Optional): Defines the result offset. Skips the given number of results. Used for pagination (e.g., `0` for the first page, `20` for the second page).
*   **`num`** (Optional): Defines the number of results to return (e.g., `20` returns 20 results, `40` returns 40 results). The maximum is `100`.

### SerpApi Parameters

*   **`engine`** (Required): Set to `google_scholar_author` to use this API.
*   **`no_cache`** (Optional): If `true`, forces SerpApi to fetch new results even if a cached version exists. Cached searches are free and expire after 1 hour. Cannot be used with `async`.
*   **`async`** (Optional): If `true`, submits the search to SerpApi and allows retrieval later using the Searches Archive API. Cannot be used with `no_cache`.
*   **`zero_trace`** (Optional): Enterprise only. If `true`, enables ZeroTrace mode to skip storing search parameters, files, and metadata on servers.
*   **`api_key`** (Required): Your SerpApi private key.
*   **`output`** (Optional): Defines the final output format. Can be `json` (default) for structured JSON or `html` for raw HTML.
*   **`json_restrictor`** (Optional): Defines fields to restrict in the output for smaller, faster responses.

## API Results

### JSON Results

JSON output includes structured data for articles, citations, cited by, co-authors, and more.
The search status is accessible through `search_metadata.status`.

### HTML Results

HTML output provides the raw HTML results from the Google Scholar Author page, useful for debugging or supporting features not yet in SerpApi.

## API Examples

### Example with `author_id`: `LSsXyncAAAAJ`

**GET Request:**
`https://serpapi.com/search.json?engine=google_scholar_author&author_id=LSsXyncAAAAJ`

**Code to Integrate (Ruby Example):**
```ruby
require "serpapi"
client = SerpApi::Client.new(
  engine: "google_scholar_author",
  author_id: "LSsXyncAAAAJ",
  api_key: "secret_api_key"
)
results = client.search
author = results[:author]
```
