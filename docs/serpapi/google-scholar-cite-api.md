# Google Scholar Cite API - SerpApi

The Google Scholar Cite API by SerpApi allows users to scrape citation results from Google Scholar organic results.

## API Endpoint

The API is accessed via the following endpoint:
`/search?engine=google_scholar_cite`

A GET request can be made to: `https://serpapi.com/search?engine=google_scholar_cite`

## API Parameters

### Search Query Parameters

*   **`q`** (Required): Defines the ID of an individual Google Scholar organic search result. This ID can be found within the `result_id` or `serpapi_cite_link` using the Google Scholar API.
*   **`hl`** (Optional): Defines the language for the Google Scholar Cite. It's a two-letter language code (e.g., `en` for English, `es` for Spanish, `fr` for French).

### SerpApi Parameters

*   **`engine`** (Required): Must be set to `google_scholar_cite` to use this API engine.
*   **`no_cache`** (Optional): If set to `true`, forces SerpApi to fetch new results even if a cached version exists. Defaults to `false`. Cannot be used with `async`.
*   **`async`** (Optional): If set to `true`, submits the search to SerpApi and allows retrieval later via the Searches Archive API. Defaults to `false`. Cannot be used with `no_cache`.
*   **`zero_trace`** (Optional): (Enterprise only) If set to `true`, enables ZeroTrace mode, skipping storage of search parameters, files, and metadata. Defaults to `false`.
*   **`api_key`** (Required): Your SerpApi private key.
*   **`output`** (Optional): Defines the desired output format. Can be `json` (default) for structured JSON or `html` for raw HTML.
*   **`json_restrictor`** (Optional): Restricts fields in the JSON output for smaller, faster responses.

## API Results

### JSON Results

The JSON output provides structured data for scholar cite results.
*   `search_metadata.status`: Indicates the search status (Processing -> Success || Error).
*   `search_metadata.id`: The search ID within SerpApi.

When cite results are encountered, they are added to the JSON output as `citations` and `links` arrays.
*   For each `citations` result, `title` and `snippet` are extracted.
*   For each `links` result, `name` and `link` are extracted.

**JSON Structure Overview:**

```json
{
  "citations": [
    {
      "title": "String - Citation title",
      "snippet": "String - Citation snippet"
    }
  ],
  "links": [
    {
      "name": "String - Link name. E.g BibTeX, EndNote, RefMan, RefWorks",
      "link": "String - Link URL"
    }
  ]
}
```

### HTML Results

HTML output provides the raw HTML results from Google, useful for debugging JSON results or supporting features not yet covered by SerpApi.

## API Examples

To acquire the `q` ID, first make a GET request to the Google Scholar API and grab either the `result_id` or `serpapi_cite_link` from the Organic Results. Then, use this ID or link with the Google Scholar Cite API.

**Example with `q`: `FDc6HiktlqEJ`**

GET request:
`https://serpapi.com/search.json?engine=google_scholar_cite&q=FDc6HiktlqEJ`

**Code to Integrate (Python Example):**

```python
import serpapi

client = serpapi.Client(
    engine="google_scholar_cite",
    q="FDc6HiktlqEJ",
    api_key="secret_api_key"
)
results = client.search()
citations = results["citations"]
```

**JSON Example Output:**

```json
{
  "search_metadata": {
    "id": "66617537ab6e333342bd547b",
    "status": "Success",
    "json_endpoint": "https://serpapi.com/searches/aaa8f881f6ec4224/66617537ab6e333342bd547b.json",
    "created_at": "2024-06-06 08:37:11 UTC",
    "processed_at": "2024-06-06 08:37:11 UTC",
    "google_scholar_cite_url": "https://scholar.google.com/scholar?q=info:FDc6HiktlqEJ:scholar.google.com&output=cite",
    "raw_html_file": "https://serpapi.com/searches/aaa8f881f6ec4224/66617537ab6e333342bd547b.html",
    "prettify_html_file": "https://serpapi.com/searches/aaa8f881f6ec4224/66617537ab6e333342bd547b.prettify",
    "total_time_taken": 1.57
  },
  "search_parameters": {
    "engine": "google_scholar_cite",
    "q": "FDc6HiktlqEJ"
  },
  "citations": [
    {
      "title": "MLA",
      "snippet": "Schwertmann, U. T. R. M., and Reginald M. Taylor. Iron oxides. Minerals in soil environments 1 (1989): 379-438."
    },
    {
      "title": "APA",
      "snippet": "Schwertmann, U. T. R. M., & Taylor, R. M. (1989). Iron oxides. Minerals in soil environments, 1, 379-438."
    },
    {
      "title": "Chicago",
      "snippet": "Schwertmann, U. T. R. M., and Reginald M. Taylor. Iron oxides. Minerals in soil environments 1 (1989): 379-438."
    },
    {
      "title": "Harvard",
      "snippet": "Schwertmann, U.T.R.M. and Taylor, R.M., 1989. Iron oxides. Minerals in soil environments, 1, pp.379-438."
    },
    {
      "title": "Vancouver",
      "snippet": "Schwertmann UT, Taylor RM. Iron oxides. Minerals in soil environments. 1989 Jan 1;1:379-438."
    }
  ],
  "links": [
    {
      "name": "BibTeX",
      "link": "https://scholar.googleusercontent.com/scholar.bib?q=info:FDc6HiktlqEJ:scholar.google.com/&output=citation&scisdr=ClGWBVL5GAA:AFWwaeYAAAAAZmF3lHkz3kdCUVvSbM5C_Msq62Q&scisig=AFWwaeYAAAAAZmF3lBXgwnMk3BS3W9KIJ9XaCUs&scisf=4&ct=citation&cd=-1&hl=en"
    },
    {
      "name": "EndNote",
      "link": "https://scholar.googleusercontent.com/scholar.enw?q=info:FDc6HiktlqEJ:scholar.google.com/&output=citation&scisdr=ClGWBVL5GAA:AFWwaeYAAAAAZmF3lHkz3kdCUVvSbM5C_Msq62Q&scisig=AFWwaeYAAAAAZmF3lBXgwnMk3BS3W9KIJ9XaCUs&scisf=3&ct=citation&cd=-1&hl=en"
    },
    {
      "name": "RefMan",
      "link": "https://scholar.googleusercontent.com/scholar.ris?q=info:FDc6HiktlqEJ:scholar.google.com/&output=citation&scisdr=ClGWBVL5GAA:AFWwaeYAAAAAZmF3lHkz3kdCUVvSbM5C_Msq62Q&scisig=AFWwaeYAAAAAZmF3lBXgwnMk3BS3W9KIJ9XaCUs&scisf=2&ct=citation&cd=-1&hl=en"
    },
    {
      "name": "RefWorks",
      "link": "https://scholar.googleusercontent.com/scholar.rfw?q=info:FDc6HiktlqEJ:scholar.google.com/&output=citation&scisdr=ClGWBVL5GAA:AFWwaeYAAAAAZmF3lHkz3kdCUVvSbM5C_Msq62Q&scisig=AFWwaeYAAAAAZmF3lBXgwnMk3BS3W9KIJ9XaCUs&scisf=1&ct=citation&cd=-1&hl=en"
    }
  ]
}
```
