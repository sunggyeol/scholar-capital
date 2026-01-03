# Google Scholar Co-Authors API - SerpApi

The Google Scholar Author Co-Authors API allows users to scrape co-author results from a Google Scholar Author search. SerpApi extracts and structures this information into a JSON output.

## Extracted Information

SerpApi is able to extract the following details for each co-author:

*   `name`
*   `link`
*   `author_id`
*   `affiliations`
*   `email`
*   `thumbnail`

## API Examples

### Co-authors results overview

To get an overview of co-authors, a GET request can be made to the following endpoint:

`GET https://serpapi.com/search.json?engine=google_scholar_author&author_id=wwxk-JMAAAAJ`

**Code Integration (Python example):**

```python
require "serpapi"
client = SerpApi::Client.new(
  engine: "google_scholar_author",
  author_id: "wwxk-JMAAAAJ",
  api_key: "secret_api_key"
)
results = client.search
co_authors = results[:co_authors]
```

**JSON Example:**

```json
{
  "co_authors": [
    {
      "name": "Cliff Meyer",
      "link": "https://scholar.google.com/citations?user=LSsXyncAAAAJ&hl=en",
      "serpapi_link": "https://serpapi.com/search.json?author_id=LSsXyncAAAAJ&engine=google_scholar_author&hl=en",
      "author_id": "LSsXyncAAAAJ",
      "affiliations": "Dana-Farber Cancer Institute and Harvard T.H. Chan School of Public Health",
      "email": "Verified email at jimmy.harvard.edu",
      "thumbnail": "https://scholar.google.com/citations/images/avatar_scholar_56.png"
    }
  ]
}
```

### View all Co-authors

The main Google Scholar Author page typically shows up to 20 co-authors. To retrieve all co-authors, the `view_op` parameter can be set to `list_colleagues`:

`GET https://serpapi.com/search.json?engine=google_scholar_author&author_id=wwxk-JMAAAAJ&view_op=list_colleagues`

**Code Integration (Python example):**

```python
require "serpapi"
client = SerpApi::Client.new(
  engine: "google_scholar_author",
  author_id: "wwxk-JMAAAAJ",
  view_op: "list_colleagues",
  api_key: "secret_api_key"
)
results = client.search
co_authors = results[:co_authors]
```

**JSON Example:**

```json
{
  "co_authors": [
    {
      "name": "Cliff Meyer",
      "link": "https://scholar.google.com/citations?hl=en&user=LSsXyncAAAAJ",
      "serpapi_link": "https://serpapi.com/search.json?author_id=LSsXyncAAAAJ&engine=google_scholar_author&hl=en",
      "author_id": "LSsXyncAAAAJ",
      "affiliations": "Dana-Farber Cancer Institute and Harvard TH Chan School of Public Health",
      "email": "Verified email at jimmy.harvard.edu",
      "thumbnail": "https://scholar.google.com/citations/images/avatar_scholar_56.png"
    }
  ]
}
```
