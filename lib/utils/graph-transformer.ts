import { ScholarAuthorResponse, ScholarArticle } from '@/lib/types/scholar';
import { GraphData, GraphNode, GraphLink } from '@/lib/types/graph';

function deterministicDistance(seed: string, min = 450, max = 1400) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const ratio = hash / 0xffffffff;
  return Math.round(min + ratio * (max - min));
}

/**
 * Transform Scholar API response into graph data structure
 */
export function transformAuthorToGraph(
  data: ScholarAuthorResponse,
  options: {
    maxPapers?: number;
    includeCoAuthors?: boolean;
  } = {}
): GraphData {
  const { maxPapers = 10, includeCoAuthors = false } = options;
  
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  
  // Add central researcher node
  const researcherId = `researcher-${data.author.name}`;
  nodes.push({
    id: researcherId,
    name: data.author.name,
    type: 'researcher',
    val: 12, // Main researcher node
    color: '#134074', // Yale blue
    metadata: {
      affiliations: data.author.affiliations,
      thumbnail: data.author.thumbnail,
      link: data.author.email,
    },
  });
  
  // Add paper nodes (limited by maxPapers)
  const papers = data.articles.slice(0, maxPapers);
  
  papers.forEach((article) => {
    const paperId = `paper-${article.citation_id || article.id || article.title}`;
    
    // Extract citation count from multiple possible locations
    let citationCount = 0;
    if (article.inline_links?.cited_by?.total) {
      citationCount = article.inline_links.cited_by.total;
    } else if (article.cited_by?.total) {
      citationCount = article.cited_by.total;
    } else if (article.cited_by?.value) {
      citationCount = parseInt(article.cited_by.value.replace(/,/g, ''), 10);
    }
    
    // Calculate node size based on citation count (logarithmic scale)
    const nodeSize = citationCount > 0 
      ? Math.min(10, 5 + Math.log10(citationCount) * 1.5)
      : 5;
    
    // Extract authors list
    let authorsList: Array<{ name: string; id?: string; link?: string }> = [];
    if (Array.isArray(article.authors)) {
      authorsList = article.authors.map(author => ({
        name: author.name,
        id: author.id || author.author_id,
        link: author.link,
      }));
    } else if (typeof article.authors === 'string') {
      // If authors is a string, parse it (format: "J Smith, K Doe - Publication")
      const authorsStr = article.authors.split(' - ')[0];
      authorsList = authorsStr.split(',').map(name => ({ name: name.trim() }));
    }
    
    nodes.push({
      id: paperId,
      name: article.title,
      type: 'paper',
      val: nodeSize,
      color: '#13315c', // Berkeley blue
      metadata: {
        citationCount,
        year: article.year?.toString(),
        link: article.link || article.title_link,
        venue: article.publication,
        authors: authorsList,
        data_cid: article.data_cid,
        citation_id: article.citation_id, // For fetching full author names
        cites_id: article.inline_links?.cited_by?.cites_id || article.cited_by?.cites_id,
        expanded: false,
        layoutDistance: deterministicDistance(paperId),
      },
    });
    
    // Link researcher to paper
    links.push({
      source: researcherId,
      target: paperId,
      type: 'authored',
      value: 2,
    });
  });
  
  // Optionally add co-authors
  if (includeCoAuthors && data.co_authors) {
    const coAuthorsToShow = data.co_authors.slice(0, 10); // Limit co-authors
    
    coAuthorsToShow.forEach((coAuthor) => {
      const coAuthorId = `coauthor-${coAuthor.author_id}`;
      
      nodes.push({
        id: coAuthorId,
        name: coAuthor.name,
        type: 'coauthor',
        val: 8,
        color: '#8da9c4', // Powder blue
        metadata: {
          affiliations: coAuthor.affiliations,
          authorId: coAuthor.author_id,
          link: coAuthor.link,
        },
      });
      
      // Link to main researcher
      links.push({
        source: researcherId,
        target: coAuthorId,
        type: 'coauthored',
        value: 1,
      });
    });
  }
  
  return { nodes, links };
}

/**
 * Expand a paper node to show its co-authors
 */
export function expandPaperNode(
  currentGraph: GraphData,
  paperId: string,
  coAuthors: string[]
): GraphData {
  const newNodes = [...currentGraph.nodes];
  const newLinks = [...currentGraph.links];
  
  // Mark the paper as expanded
  const paperNode = newNodes.find(n => n.id === paperId);
  if (paperNode && paperNode.metadata) {
    paperNode.metadata.expanded = true;
  }
  
  // Add co-author nodes if they don't exist
  coAuthors.forEach((coAuthorName, index) => {
    const coAuthorId = `coauthor-${paperId}-${index}`;
    
    // Check if node already exists
    if (!newNodes.find(n => n.id === coAuthorId)) {
      newNodes.push({
        id: coAuthorId,
        name: coAuthorName,
        type: 'coauthor',
        val: 8,
        color: '#8da9c4',
        metadata: {},
      });
      
      // Link co-author to paper
      newLinks.push({
        source: paperId,
        target: coAuthorId,
        type: 'coauthored',
        value: 1,
      });
    }
  });
  
  return { nodes: newNodes, links: newLinks };
}

/**
 * Load more papers for the researcher
 */
export function addMorePapers(
  currentGraph: GraphData,
  researcherId: string,
  additionalPapers: ScholarArticle[]
): GraphData {
  const newNodes = [...currentGraph.nodes];
  const newLinks = [...currentGraph.links];
  
  additionalPapers.forEach((article) => {
    const paperId = `paper-${article.citation_id || article.id || article.title}`;
    
    // Check if paper already exists
    if (!newNodes.find(n => n.id === paperId)) {
      const citationCount = article.cited_by?.value 
        ? parseInt(article.cited_by.value.replace(/,/g, ''), 10) 
        : 0;
      
      const nodeSize = citationCount > 0 
        ? Math.min(20, 8 + Math.log10(citationCount) * 3)
        : 8;
      
      newNodes.push({
        id: paperId,
        name: article.title,
        type: 'paper',
        val: nodeSize,
        color: '#10b981',
        metadata: {
          citationCount,
          year: article.year?.toString(),
          link: article.link || article.title_link,
          expanded: false,
          layoutDistance: deterministicDistance(paperId),
        },
      });
      
      newLinks.push({
        source: researcherId,
        target: paperId,
        type: 'authored',
        value: 2,
      });
    }
  });
  
  return { nodes: newNodes, links: newLinks };
}

