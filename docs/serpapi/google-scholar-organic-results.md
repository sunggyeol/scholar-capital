# Google Scholar Organic Results API - SerpApi

The Google Scholar Organic Results API by SerpApi allows for the scraping, extraction, and interpretation of organic results from Google Scholar. These results can range from simple entries to rich data including citations, resources, and other specialized snippets.

## Key Extracted Data for Organic Results

When SerpApi encounters organic results, they are added to the `organic_results` array in the JSON output. For each organic result, the API can extract:

*   `position`
*   `title`
*   `link`
*   `publication_info`
*   `snippet`
*   `resources`
*   `cited_by`
*   `versions`
*   `cached_page_link`
*   `related_pages_link`
*   And more.

## API Examples

### Organic Results Overview

This example demonstrates how to retrieve organic results for a given query (e.g., "biology").

**GET Request:**
`https://serpapi.com/search.json?engine=google_scholar&q=biology`

**Python Code Example:**
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

### Inline Sitelinks

This section shows how inline sitelinks are handled within the organic results.

**JSON Example Snippet:**
```json
{
  "inline_links": {
    "serpapi_cite_link": "https://serpapi.com/search.json?engine=google_scholar_cite&q=JC4Acibs_4kJ&token=a57f24e24842c7de",
    "cited_by": {
      "total": 14003,
      "link": "https://scholar.google.com/scholar?cites=9943926152122871332&as_sdt=5,38&sciodt=0,38&hl=en",
      "cites_id": "9943926152122871332",
      "serpapi_scholar_link": "https://serpapi.com/search.json?cites=9943926152122871332&engine=google_scholar&hl=en"
    },
    "related_pages_link": "https://scholar.google.com/scholar?q=related:JC4Acibs_4kJ:scholar.google.com/&scioq=biology&hl=en&as_sdt=0,38",
    "serpapi_related_pages_link": "https://serpapi.com/search.json?as_sdt=0%2C38&engine=google_scholar&hl=en&q=related%3AJC4Acibs_4kJ%3Ascholar.google.com%2F",
    "versions": {
      "total": 6,
      "link": "https://scholar.google.com/scholar?cluster=9943926152122871332&hl=en&as_sdt=0,38",
      "cluster_id": "9943926152122871332",
      "serpapi_scholar_link": "https://serpapi.com/search.json?cluster=9943926152122871332&engine=google_scholar&hl=en"
    },
    "cached_page_link": "https://scholar.google.comhttps://scholar.googleusercontent.com/scholar?q=cache:JC4Acibs_4kJ:scholar.google.com/+biology&hl=en&as_sdt=0,38"
  }
}
```

### Authors Link

The API can extract author information, including links to their Google Scholar profiles.

**JSON Example Snippet:**
```json
{
  "publication_info": {
    "summary": "PJ DiMaggio, WW Powell - American sociological review, 1983 - JSTOR",
    "authors": [
      {
        "name": "PJ DiMaggio",
        "link": "https://scholar.google.com/citations?user=0A5Gnc0AAAAJ&hl=en&oi=sra",
        "serpapi_scholar_link": "https://serpapi.com/search.json?author_id=0A5Gnc0AAAAJ&engine=google_scholar_author&hl=en"
      },
      {
        "name": "WW Powell",
        "link": "https://scholar.google.com/citations?user=T7Q62kgAAAAJ&hl=en&oi=sra",
        "serpapi_scholar_link": "https://serpapi.com/search.json?author_id=T7Q62kgAAAAJ&engine=google_scholar_author&hl=en"
      }
    ]
  }
}
```

### Resources

The API can identify and link to resources associated with an organic result, such as PDF files.

**JSON Example Snippet:**
```json
{
  "resources": [
    {
      "title": "researchgate.net",
      "file_format": "PDF",
      "link": "https://www.researchgate.net/profile/Michael_Madigan/publication/48363170_Brock_Biology_of_Micro-Organisms/links/5573057208aeb6d8c017dcd8.pdf"
    }
  ]
}
```

### Profiles Section

The API can also retrieve user profiles for authors.

**GET Request:**
`https://serpapi.com/search.json?engine=google_scholar&q=author:john`

**JSON Example Snippet:**
```json
{
  "profiles": {
    "title": "User profiles for author:john",
    "link": "https://scholar.google.com/citations?view_op=search_authors&mauthors=author:john&hl=en&oi=ao",
    "serpapi_link": "https://serpapi.com/search.json?engine=google_scholar_profiles&hl=en&mauthors=author%3Ajohn",
    "authors": [
      {
        "name": "Oliver P. JOHN",
        "link": "https://scholar.google.com/citations?user=Iin2LSIAAAAJ&hl=en&oi=ao",
        "serpapi_link": "https://serpapi.com/search.json?author_id=Iin2LSIAAAAJ&engine=google_scholar_author&hl=en",
        "author_id": "Iin2LSIAAAAJ",
        "email": "Verified email at berkeley.edu",
        "cited_by": 95066
      }
    ]
  }
}
```
