# Google Scholar API

The Google Scholar API from SerpApi allows users to scrape SERP (Search Engine Results Page) results from Google Scholar search queries.

## Endpoint

The API is accessed through the following endpoint: `/search?engine=google_scholar`.
A user can query this endpoint using a GET request, for example: `https://serpapi.com/search?engine=google_scholar`.

## API Parameters

### Search Query

*   **`q`** (Required): Defines the search query.
    *   Helpers like `author:` or `source:` can be used within the query.
    *   Usage of `cites` parameter makes `q` optional.
    *   Using `cites` together with `q` triggers a search within citing articles.
    *   Usage of `cluster` together with `q` and `cites` parameters is prohibited; use `cluster` parameter only.

### Advanced Google Scholar Parameters

*   **`cites`** (Optional): Defines a unique ID for an article to trigger "Cited By" searches.
    *   Example value: `cites=1275980731835430123`.
    *   Usage of `cites` and `q` parameters together triggers a search within citing articles.
*   **`as_ylo`** (Optional): Defines the starting year for results (e.g., `2018` to include results from 2018 onwards).
*   **`as_yhi`** (Optional): Defines the ending year for results (e.g., `2018` to include results up to 2018).
*   **`scisbd`** (Optional): Controls sorting for articles added in the last year.
    *   `1`: Include only abstracts.
    *   `2`: Include everything.
    *   `0` (default): Articles sorted by relevance.
*   **`cluster`** (Optional): Defines a unique ID for an article to trigger "All Versions" searches.
    *   Example value: `cluster=1275980731835430123`.
    *   Usage of `cluster` together with `q` and `cites` parameters is prohibited; use `cluster` parameter only.

### Localization

*   **`hl`** (Optional): Two-letter language code for the search language (e.g., `en` for English).
*   **`lr`** (Optional): One or multiple languages to limit the search to (e.g., `lang_fr|lang_de`).

### Pagination

*   **`start`** (Optional): Defines the result offset, used for pagination.
    *   `0` (default): First page.
    *   `10`: Second page.
*   **`num`** (Optional): Maximum number of results to return, ranging from 1 to 20, with a default of 10.

### Search Type

*   **`as_sdt`** (Optional): Can be used as a search type or a filter.
    *   **As a Filter (only for articles):**
        *   `0` (default): Exclude patents.
        *   `7`: Include patents.
    *   **As a Search Type:**
        *   `4`: Select case law (US courts only).
        *   To select specific courts, values are separated by commas (e.g., `4,33,192`).

### Advanced Filters

*   **`safe`** (Optional): Defines the level of filtering for adult content.
    *   `active` or `off`.
    *   By default, Google blurs explicit content.
*   **`filter`** (Optional): Controls filters for 'Similar Results' and 'Omitted Results'.
    *   `1` (default): Enable filters.
    *   `0`: Disable filters.
*   **`as_vis`** (Optional): Includes citations.
    *   `1`: Exclude citations.
    *   `0` (default): Include citations.
*   **`as_rr`** (Optional): Shows only review articles.
    *   `1`: Enable this filter.
    *   `0` (default): Show all results.

### SerpApi Parameters

*   **`engine`** (Required): Set to `google_scholar`.
*   **`no_cache`** (Optional): Forces SerpApi to fetch new results even if a cached version exists.
    *   `false` (default): Allows cached results.
    *   `true`: Disallows cached results.
    *   Cannot be used with `async`.
*   **`async`** (Optional): Defines how the search is submitted.
    *   `false` (default): Keeps an HTTP connection open until results are received.
    *   `true`: Submits the search to SerpApi for later retrieval via the Searches Archive API.
    *   Cannot be used with `no_cache`.
*   **`zero_trace`** (Optional): Enterprise only. Enables ZeroTrace mode to skip storing search parameters, files, and metadata.
    *   `false` (default) or `true`.
*   **`api_key`** (Required): Your SerpApi private key.
*   **`output`** (Optional): Defines the desired output format.
    *   `json` (default): Structured JSON of results.
    *   `html`: Raw HTML retrieved.
*   **`json_restrictor`** (Optional): Restricts fields in the JSON output for smaller, faster responses.

## API Results

*   **JSON Results**: Include structured data for organic results.
    *   Search status is accessible through `search_metadata.status` (Processing -> Success || Error).
    *   If a search fails, `error` will contain a message.
    *   `search_metadata.id` is the search ID within SerpApi.
*   **HTML Results**: Provide the raw HTML results from Google, useful for debugging JSON results or supporting features not yet covered by SerpApi.

## API Examples

### Example with `q: biology`

**GET Request:**
`https://serpapi.com/search.json?engine=google_scholar&q=biology`

**Code to Integrate (Python Example):**
```python
require "serpapi"
client = SerpApi::Client.new(
  engine: "google_scholar",
  q: "biology",
  api_key: "secret_api_key"
)
results = client.search
organic_results = results[:organic_results]
```
