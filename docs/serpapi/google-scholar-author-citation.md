# Google Scholar Author Citation API - SerpApi

The Google Scholar Author Citation API allows users to scrape citation results from a Google Scholar Author search. SerpApi extracts and structures this information, adding it to a JSON output when citation results are encountered.

SerpApi is capable of extracting the following information: `title`, `link`, `resources`, `authors`, `publication_date`, `journal`, `description`, `total_citations` results, and more. These results are linked to each author's article and can be accessed by providing a `citation_id` and setting the `view_op` parameter to `view_citation`.

## API Parameters

*   **`citation_id`**
    *   **Required:** Yes
    *   **Description:** This parameter is used for retrieving individual article citations. It is required when `view_op=view_citation` is selected. IDs can be accessed within SerpApi's structured JSON response.

*   **`view_op`**
    *   **Required:** Yes
    *   **Description:** This parameter is used for viewing specific parts of a page. It has two options:
        *   `view_citation`: Select to view citations. `citation_id` is required.
        *   `list_colleagues`: Select to view all co-authors.

## API Examples

### Citation results overview

`GET https://serpapi.com/search.json?engine=google_scholar_author&view_op=view_citation&citation_id=LSsXyncAAAAJ:9yKSN-GCB0IC`

### JSON Example

```json
{
  "citation": {
    "title": "Genome-wide analysis of estrogen receptor binding sites",
    "link": "https://www.nature.com/articles/ng1901",
    "resources": [
      {
        "title": "from psu.edu",
        "file_format": "PDF",
        "link": "https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.1043.6139&rep=rep1&type=pdf"
      }
    ],
    "authors": "Jason S Carroll, Clifford A Meyer, Jun Song, Wei Li, Timothy R Geistlinger, Jérôme Eeckhoute, Alexander S Brodsky, Erika Krasnickas Keeton, Kirsten C Fertuck, Giles F Hall, Qianben Wang, Stefan Bekiranov, Victor Sementchenko, Edward A Fox, Pamela A Silver, Thomas R Gingeras, X Shirley Liu, Myles Brown",
    "publication_date": "2006/11",
    "journal": "Nature genetics",
    "volume": "38",
    "issue": "11",
    "pages": "1289-1297",
    "publisher": "Nature Publishing Group",
    "description": "The estrogen receptor is the master transcriptional regulator of breast cancer phenotype and the archetype of a molecular therapeutic target. We mapped all estrogen receptor and RNA polymerase II binding sites on a genome-wide scale, identifying the authentic cis binding sites and target genes, in breast cancer cells. Combining this unique resource with gene expression data demonstrates distinct temporal mechanisms of estrogen-mediated gene regulation, particularly in the case of estrogen-suppressed genes. Furthermore, this resource has allowed the identification of cis-regulatory sites in previously unexplored regions of the genome and the cooperating transcription factors underlying estrogen signaling in breast cancer.",
    "total_citations": {
      "cited_by": {
        "total": 1464,
        "link": "https://scholar.google.com/scholar?oi=bibs&hl=en&cites=7951096779388712529&as_sdt=5",
        "serpapi_link": "https://serpapi.com/search.json?cites=7951096779388712529&engine=google_scholar&hl=en",
        "cites_id": "7951096779388712529"
      },
      "table": [
        {
          "year": 2006,
          "citations": "5"
        },
        {
          "year": 2007,
          "citations": "75"
        },
        {
          "year": 2008,
          "citations": "126"
        }
      ]
    },
    "scholar_articles": [
      {
        "title": "Genome-wide analysis of estrogen receptor binding sites",
        "link": "https://scholar.google.com/scholar?oi=bibs&cluster=7951096779388712529&btnI=1&hl=en",
        "authors": "JS Carroll, CA Meyer, J Song, W Li, TR Geistlinger… - Nature genetics, 2006",
        "cited_by": {
          "total": 1464,
          "link": "https://scholar.google.com/scholar?oi=bibs&hl=en&cites=7951096779388712529&as_sdt=5",
          "serpapi_link": "https://serpapi.com/search.json?cites=7951096779388712529&engine=google_scholar&hl=en",
          "cites_id": "7951096779388712529"
        },
        "related_pages_link": {
          "total": null,
          "link": "https://scholar.google.com/scholar?oi=bibs&hl=en&q=related:UXY35mT4V24J:scholar.google.com/"
        },
        "versions": {
          "total": 21,
          "link": "https://scholar.google.com/scholar?oi=bibs&hl=en&cluster=7951096779388712529",
          "serpapi_link": "https://serpapi.com/search.json?cluster=7951096779388712529&engine=google_scholar&hl=en",
          "cluster_id": "7951096779388712529"
        }
      }
    ]
  }
}
```
