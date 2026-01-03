# Google Scholar Author Articles API - SerpApi

The Google Scholar Author Articles API allows users to scrape article results from a Google Scholar Author search. SerpApi extracts and structures this information, providing it in a JSON output.

## Extracted Information
SerpApi is able to extract the following details for each article:
*   `title`
*   `link`
*   `citation_id`
*   `authors`
*   `publication`
*   `cited_by` results (including `value`, `link`, `serpapi_link`, and `cites_id`)
*   `year`

## Features
*   **Maximum Results:** Up to 100 results can be returned per page.
*   **Sorting:** Articles are sorted by `cited_by.value` by default.
    *   You can also sort by "title" or "year" using the `sort` parameter.

## API Parameters

### `sort`
*   **Type:** Optional
*   **Description:** Used for sorting and refining articles.
*   **Available Options:**
    *   `title`: Sorts articles by title.
    *   `pubdate`: Sorts articles by publication date.

## API Examples

### Articles results overview
**GET Request:**
`https://serpapi.com/search.json?engine=google_scholar_author&author_id=EicYvbwAAAAJ`

### Code to integrate (Python Example)
```python
import serpapi

client = serpapi.Client(
    engine="google_scholar_author",
    author_id="EicYvbwAAAAJ",
    api_key="secret_api_key"
)

results = client.search()
articles = results["articles"]
```

### JSON Example (Partial)
```json
{
  "articles": [
    {
      "title": "Lifetime prevalence and age-of-onset distributions of DSM-IV disorders in the National Comorbidity Survey Replication",
      "link": "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=EicYvbwAAAAJ&citation_for_view=EicYvbwAAAAJ:UeHWp8X0CEIC",
      "citation_id": "EicYvbwAAAAJ:UeHWp8X0CEIC",
      "authors": "RC Kessler, P Berglund, O Demler, R Jin, KR Merikangas, EE Walters",
      "publication": "Archives of general psychiatry 62 (6), 593-602, 2005",
      "cited_by": {
        "value": 29693,
        "link": "https://scholar.google.com/scholar?oi=bibs&hl=en&cites=...",
        "serpapi_link": "https://serpapi.com/search.json?cites=...&engine=google_scholar&hl=en",
        "cites_id": "..."
      },
      "year": "2005"
    },
    {
      "title": "Lifetime and 12-month prevalence of DSM-III-R psychiatric disorders in the United States: results from the National Comorbidity Survey",
      "link": "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=EicYvbwAAAAJ&citation_for_view=EicYvbwAAAAJ:u5HHmVD_uO8C",
      "citation_id": "EicYvbwAAAAJ:u5HHmVD_uO8C",
      "authors": "RC Kessler, KA McGonagle, S Zhao, CB Nelson, M Hughes, S Eshleman, ...",
      "publication": "Archives of general psychiatry 51 (1), 8-19, 1994",
      "cited_by": {
        "value": 18077,
        "link": "https://scholar.google.com/scholar?oi=bibs&hl=en&cites=...",
        "serpapi_link": "https://serpapi.com/search.json?cites=...&engine=google_scholar&hl=en",
        "cites_id": "..."
      },
      "year": "1994"
    }
  ]
}
```
