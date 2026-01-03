# Google Scholar Author Cited By API - SerpApi

The Google Scholar Author Cited By API by SerpApi allows users to scrape, extract, and interpret "cited by" results from Google Scholar author searches. This API provides structured JSON output containing citation data.

## Extracted Information

The API extracts the following information:

*   **Table Results**:
    *   **Citations**: Total citations and citations since 2016.
    *   **h-index**: The largest number `h` such that `h` publications have at least `h` citations. It also includes a "recent" version based on citations in the last 5 years.
    *   **i10-index**: The number of publications with at least 10 citations. It also includes a "recent" version based on new citations in the last 5 years.
*   **Graph Results**:
    *   **Year**: The year of citation.
    *   **Citations**: The number of citations for that year.

## API Example

To use the API, you can make a GET request to:
`https://serpapi.com/search.json?engine=google_scholar_author&author_id=EicYvbwAAAAJ`

The API provides code examples for integration in various languages including cURL, Ruby, Python, JavaScript, Go, PHP, Java, Rust, .NET, and Google Sheets.

## JSON Output Example

A sample JSON output for the `cited_by` field shows the structure for table and graph data:

```json
{
  "cited_by": {
    "table": [
      {
        "citations": {
          "all": 466834,
          "since_2016": 184564
        }
      },
      {
        "h_index": {
          "all": 314,
          "since_2016": 197
        }
      },
      {
        "i10_index": {
          "all": 1164,
          "since_2016": 936
        }
      }
    ],
    "graph": [
      {
        "year": 1993,
        "citations": 1180
      },
      {
        "year": 1994,
        "citations": 1553
      },
      {
        "year": 1995,
        "citations": 1981
      }
    ]
  }
}
```
