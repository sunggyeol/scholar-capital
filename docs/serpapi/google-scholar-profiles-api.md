# Google Scholar Profiles API - SerpApi

**Status:** Discontinued

The Google Scholar Profiles API has been discontinued due to recent changes by Google Scholar that require users to log in to access profile information.

## Description
This API allowed scraping profile results from the Google Scholar Profiles search page.

## API Endpoint
The API was accessed through the following endpoint:
`https://serpapi.com/search?engine=google_scholar_profiles`

A user could query this endpoint utilizing a `GET` request.

## API Parameters

### Search Query Parameters

*   **`mauthors`** (Required): Defines the author to search for. Helpers like `label:` could also be used.
*   **`hl`** (Optional): Defines the language for the Google Scholar Profiles search. It's a two-letter language code (e.g., `en` for English, `es` for Spanish, or `fr` for French).

### Pagination Parameters

*   **`after_author`** (Optional): Defines the next page token, used for retrieving subsequent page results. This parameter takes precedence over `before_author`.
*   **`before_author`** (Optional): Defines the previous page token, used for retrieving previous page results.

### SerpApi Parameters

*   **`engine`** (Required): Must be set to `google_scholar_profiles` to use this API engine.
*   **`no_cache`** (Optional): If set to `true`, forces SerpApi to fetch new results even if a cached version exists. Cached searches are free and expire after 1 hour. Cannot be used with `async`.
*   **`async`** (Optional): If set to `true`, submits the search to SerpApi and allows retrieval of results later via the Searches Archive API. Cannot be used with `no_cache` or on accounts with Ludicrous Speed enabled.
*   **`zero_trace`** (Optional): (Enterprise only) If set to `true`, enables ZeroTrace mode, skipping storage of search parameters, files, and metadata on SerpApi servers.
*   **`api_key`** (Required): The SerpApi private key.
*   **`output`** (Optional): Defines the desired output format. Can be `json` (default) for structured JSON or `html` for raw HTML.
*   **`json_restrictor`** (Optional): Restricts fields in the JSON output for smaller, faster responses.

## API Results

### JSON Results
The JSON output includes structured data for Scholar Profiles results. The search status is available via `search_metadata.status` (Processing -> Success || Error). If an error occurs, `error` will contain a message. `search_metadata.id` is the SerpApi search ID.

### HTML Results
The HTML output provides the raw HTML results from the Google Scholar Profiles page, useful for debugging or supporting features not yet covered by SerpApi.

## API Examples

### Example with `mauthors`: Mike

**GET Request:**
`https://serpapi.com/search.json?engine=google_scholar_profiles&mauthors=Mike`

**Code to Integrate (Ruby Example):**
```ruby
require "serpapi"
client = SerpApi::Client.new(
  engine: "google_scholar_profiles",
  mauthors: "Mike",
  api_key: "secret_api_key"
)
results = client.search
profiles = results[:profiles]
```

**JSON Example (Partial):**
```json
{
  "search_metadata": {
    "id": "608bd969de9834008f5acf90",
    "status": "Success",
    "json_endpoint": "https://serpapi.com/searches/1e4ed326db04eb0c/608bd969de9834008f5acf90.json",
    "created_at": "2021-04-30 10:18:17 UTC",
    "processed_at": "2021-04-30 10:18:17 UTC",
    "google_scholar_profiles_url": "https://scholar.google.com/citations?mauthors=mike&view_op=search_authors&hl=en",
    "raw_html_file": "https://serpapi.com/searches/1e4ed326db04eb0c/608bd969de9834008f5acf90.html",
    "total_time_taken": 1.12
  },
  "search_parameters": {
    "engine": "google_scholar_profiles",
    "mauthors": "mike",
    "hl": "en"
  },
  "profiles": [
    {
      "name": "Mike Robb",
      "link": "https://scholar.google.com/citations?hl=en&user=kq0NYnMAAAAJ",
      "serpapi_link": "https://serpapi.com/search.json?author_id=kq0NYnMAAAAJ&engine=google_scholar_author&hl=en",
      "author_id": "kq0NYnMAAAAJ",
      "affiliations": "Chemistry Department Imperial College",
      "email": "Verified email at imperial.ac.uk",
      "cited_by": 154267,
      "interests": [
        {
          "title": "Computational chemistry",
          "serpapi_link": "https://serpapi.com/search.json?engine=google_scholar_profiles&hl=en&mauthors=label%3Acomputational_chemistry",
          "link": "https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=label:computational_chemistry"
        },
        {
          "title": "Theoretical Chemistry",
          "serpapi_link": "https://serpapi.com/search.json?engine=google_scholar_profiles&hl=en&mauthors=label%3Atheoretical_chemistry",
          "link": "https://scholar.google.com/citations?hl=en&view_op=search_authors&mauthors=label:theoretical_chemistry"
        }
      ],
      "thumbnail": "https://scholar.google.com/citations/images/avatar_scholar_56.png"
    }
  ],
  "pagination": {
    "next": "https://serpapi.com/search.json?after_author=yiOzABZU__8J&engine=google_scholar_profiles&hl=en&mauthors=mike",
    "next_page_token": "yiOzABZU__8J"
  }
}
```
