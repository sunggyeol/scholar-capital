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
 * Generate deterministic angle and distance for radial dispersion
 * Uses golden angle spacing for even distribution around the circle
 * Distances are scaled to ensure nodes stay within viewport
 */
function generateRadialPosition(
  seed: string,
  index: number,
  totalNodes: number,
  center: { x: number, y: number } = { x: 0, y: 0 },
  viewportWidth: number = 1200,
  viewportHeight: number = 800
) {
  // Generate hash for deterministic distance variation
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  // Use golden angle (≈137.508°) for even distribution around the circle
  // This ensures nodes are spread evenly without clustering
  const goldenAngle = 2.399963229728653; // Golden angle in radians (137.508°)
  const baseAngle = index * goldenAngle;

  // Add some variation based on hash to avoid perfect symmetry
  const angleVariation = ((hash / 0xffffffff) * 0.5 - 0.25) * Math.PI / 6; // ±15 degrees variation
  const angle = baseAngle + angleVariation;

  // Calculate max safe distance to keep nodes within viewport
  // Use 35% of the smaller dimension to ensure nodes stay visible
  const maxSafeDistance = Math.min(viewportWidth, viewportHeight) * 0.35;

  // Generate varied distance (30% to 35% of viewport size for better dispersion)
  // Use hash for deterministic but varied distances
  const distanceRatio = (hash / 0xffffffff);
  const distance = maxSafeDistance * 0.85 + (distanceRatio * maxSafeDistance * 0.15);

  return {
    angle,
    distance: Math.round(distance),
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
  };
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
      link: `https://scholar.google.com/citations?user=${data.author.author_id || data.search_parameters?.author_id}&hl=${data.search_parameters?.hl || 'en'}`,
    },
  });

  // Add paper nodes (limited by maxPapers)
  // Note: Articles should already be sorted by the caller (e.g., citations page)
  const papers = data.articles.slice(0, maxPapers);

  papers.forEach((article, index) => {
    const paperId = `paper-${article.citation_id || article.id || article.title}`;

    // Extract citation count from multiple possible locations
    let citationCount = 0;
    if (article.inline_links?.cited_by?.total) {
      citationCount = article.inline_links.cited_by.total;
    } else if (article.cited_by?.total) {
      citationCount = article.cited_by.total;
    } else if (article.cited_by?.value !== undefined) {
      // Handle both string and number formats
      const value = article.cited_by.value;
      citationCount = typeof value === 'string' 
        ? parseInt(value.replace(/,/g, ''), 10) 
        : (typeof value === 'number' ? value : 0);
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

    // Generate radial position for dispersion (using default viewport size)
    // Actual viewport size will be adjusted in the graph component
    const radialPos = generateRadialPosition(paperId, index, papers.length);

    nodes.push({
      id: paperId,
      name: article.title,
      type: 'paper',
      val: nodeSize,
      color: '#13315c', // Berkeley blue
      x: radialPos.x, // Initial x position
      y: radialPos.y, // Initial y position
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
        layoutDistance: radialPos.distance,
        initialAngle: radialPos.angle,
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

  additionalPapers.forEach((article, index) => {
    const paperId = `paper-${article.citation_id || article.id || article.title}`;

    // Check if paper already exists
    if (!newNodes.find(n => n.id === paperId)) {
      // Handle both string and number formats for citation count
      let citationCount = 0;
      if (article.cited_by?.value !== undefined) {
        const value = article.cited_by.value;
        citationCount = typeof value === 'string' 
          ? parseInt(value.replace(/,/g, ''), 10) 
          : (typeof value === 'number' ? value : 0);
      }

      const nodeSize = citationCount > 0
        ? Math.min(20, 8 + Math.log10(citationCount) * 3)
        : 8;

      // Generate radial position for dispersion
      // Use the current total number of papers for spacing
      const currentPaperCount = newNodes.filter(n => n.type === 'paper').length;
      const radialPos = generateRadialPosition(paperId, currentPaperCount, additionalPapers.length + currentPaperCount);

      newNodes.push({
        id: paperId,
        name: article.title,
        type: 'paper',
        val: nodeSize,
        color: '#10b981',
        x: radialPos.x, // Initial x position
        y: radialPos.y, // Initial y position
        metadata: {
          citationCount,
          year: article.year?.toString(),
          link: article.link || article.title_link,
          expanded: false,
          layoutDistance: radialPos.distance,
          initialAngle: radialPos.angle,
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

/**
 * Add a new researcher and their papers to the graph
 * Creates a new cluster centered around the new researcher
 */
export function addResearcherToGraph(
  currentGraph: GraphData,
  researcherData: ScholarAuthorResponse,
  sourcePaperId?: string,
  options: { maxPapers?: number } = {}
): GraphData {
  const { maxPapers = 20 } = options;
  const newNodes = [...currentGraph.nodes];
  const newLinks = [...currentGraph.links];

  // 1. Determine position for the new researcher
  let researcherX = 0;
  let researcherY = 0;

  if (sourcePaperId) {
    const sourceNode = newNodes.find(n => n.id === sourcePaperId);
    if (sourceNode && sourceNode.x !== undefined && sourceNode.y !== undefined) {
      // Place new researcher away from the center relative to the source node
      // Or just at a fixed distance from the source node in a somewhat random direction
      // Let's try extending the vector from (0,0) to sourceNode
      const angle = Math.atan2(sourceNode.y, sourceNode.x);
      const distance = 600; // Distance from source paper to new researcher

      researcherX = sourceNode.x + Math.cos(angle) * distance;
      researcherY = sourceNode.y + Math.sin(angle) * distance;
    } else {
      // Fallback: Random position far away
      researcherX = 800;
      researcherY = 0;
    }
  }

  // 2. Add researcher node
  const researcherId = `researcher-${researcherData.author.name}`;

  // Check if researcher already exists
  if (!newNodes.find(n => n.id === researcherId)) {
    newNodes.push({
      id: researcherId,
      name: researcherData.author.name,
      type: 'researcher',
      val: 12,
      color: '#134074',
      x: researcherX,
      y: researcherY,
      metadata: {
        affiliations: researcherData.author.affiliations,
        thumbnail: researcherData.author.thumbnail,
        link: `https://scholar.google.com/citations?user=${researcherData.author.author_id || researcherData.search_parameters?.author_id}&hl=${researcherData.search_parameters?.hl || 'en'}`,
      },
    });
  }

  // 3. Link source paper to new researcher if applicable
  if (sourcePaperId) {
    // Check if link already exists
    const linkExists = newLinks.some(
      l => (l.source === researcherId && l.target === sourcePaperId) ||
        (l.source === sourcePaperId && l.target === researcherId)
    );

    if (!linkExists) {
      newLinks.push({
        source: researcherId,
        target: sourcePaperId,
        type: 'authored',
        value: 2,
      });
    }
  }

  // 4. Add new papers around the new researcher
  const papers = researcherData.articles.slice(0, maxPapers);

  papers.forEach((article, index) => {
    const paperId = `paper-${article.citation_id || article.id || article.title}`;

    // Skip if paper is the source paper (already handled)
    if (paperId === sourcePaperId) return;

    // Check if paper already exists
    if (!newNodes.find(n => n.id === paperId)) {
      // Extract citation count
      let citationCount = 0;
      if (article.inline_links?.cited_by?.total) {
        citationCount = article.inline_links.cited_by.total;
      } else if (article.cited_by?.total) {
        citationCount = article.cited_by.total;
      } else if (article.cited_by?.value !== undefined) {
        // Handle both string and number formats
        const value = article.cited_by.value;
        citationCount = typeof value === 'string' 
          ? parseInt(value.replace(/,/g, ''), 10) 
          : (typeof value === 'number' ? value : 0);
      }

      const nodeSize = citationCount > 0
        ? Math.min(10, 5 + Math.log10(citationCount) * 1.5)
        : 5;

      // Generate radial position CENTERED on the new researcher
      const radialPos = generateRadialPosition(
        paperId,
        index,
        papers.length,
        { x: researcherX, y: researcherY }
      );

      newNodes.push({
        id: paperId,
        name: article.title,
        type: 'paper',
        val: nodeSize,
        color: '#13315c',
        x: radialPos.x,
        y: radialPos.y,
        metadata: {
          citationCount,
          year: article.year?.toString(),
          link: article.link || article.title_link,
          venue: article.publication,
          // We don't have full authors list here usually, just the string
          authors: typeof article.authors === 'string'
            ? article.authors.split(',').map(name => ({ name: name.trim() }))
            : [],
          citation_id: article.citation_id,
          expanded: false,
          layoutDistance: radialPos.distance,
          initialAngle: radialPos.angle,
        },
      });

      // Link researcher to paper
      newLinks.push({
        source: researcherId,
        target: paperId,
        type: 'authored',
        value: 2,
      });
    } else {
      // If paper exists but not linked to this researcher, link it
      const linkExists = newLinks.some(
        l => (l.source === researcherId && l.target === paperId) ||
          (l.source === paperId && l.target === researcherId)
      );

      if (!linkExists) {
        newLinks.push({
          source: researcherId,
          target: paperId,
          type: 'authored',
          value: 2,
        });
      }
    }
  });

  return { nodes: newNodes, links: newLinks };
}

/**
 * Add researcher and placeholder papers immediately
 */
export function addResearcherPlaceholders(
  currentGraph: GraphData,
  researcherName: string,
  sourcePaperId?: string,
  count: number = 20
): GraphData {
  const newNodes = [...currentGraph.nodes];
  const newLinks = [...currentGraph.links];

  // 1. Determine position for the new researcher
  let researcherX = 0;
  let researcherY = 0;

  if (sourcePaperId) {
    const sourceNode = newNodes.find(n => n.id === sourcePaperId);
    if (sourceNode && sourceNode.x !== undefined && sourceNode.y !== undefined) {
      // Count existing researcher neighbors to determine angle
      const existingResearcherLinks = newLinks.filter(l => 
        (l.source === sourcePaperId && l.target.startsWith('researcher-')) ||
        (l.target === sourcePaperId && l.source.startsWith('researcher-'))
      );
      
      const neighborCount = existingResearcherLinks.length;
      
      // Distribute researchers: start at a different angle for each new one
      // Use a base angle + offset based on count
      // Adding Math.PI/4 (45 degrees) offset for each new researcher
      const baseAngle = Math.atan2(sourceNode.y, sourceNode.x);
      const angleOffset = (neighborCount + 1) * (Math.PI / 3); 
      const angle = baseAngle + angleOffset;
      
      const distance = 600;
      researcherX = sourceNode.x + Math.cos(angle) * distance;
      researcherY = sourceNode.y + Math.sin(angle) * distance;
    } else {
      researcherX = 800;
      researcherY = 0;
    }
  }

  // 2. Add researcher node (if not exists)
  const researcherId = `researcher-${researcherName}`;
  if (!newNodes.find(n => n.id === researcherId)) {
    newNodes.push({
      id: researcherId,
      name: researcherName,
      type: 'researcher',
      val: 12,
      color: '#134074',
      x: researcherX,
      y: researcherY,
      metadata: {
        loading: true, // Mark as loading
      },
    });
  }

  // 3. Link source paper to new researcher
  if (sourcePaperId) {
    const linkExists = newLinks.some(
      l => (l.source === researcherId && l.target === sourcePaperId) ||
        (l.source === sourcePaperId && l.target === researcherId)
    );

    if (!linkExists) {
      newLinks.push({
        source: researcherId,
        target: sourcePaperId,
        type: 'authored',
        value: 2,
      });
    }
  }

  // 4. Add placeholder papers
  for (let i = 0; i < count; i++) {
    const placeholderId = `placeholder-${researcherName}-${i}`;

    // Calculate position
    const radialPos = generateRadialPosition(
      placeholderId,
      i,
      count,
      { x: researcherX, y: researcherY }
    );

    newNodes.push({
      id: placeholderId,
      name: 'Loading...',
      type: 'paper',
      val: 5, // Small size for placeholders
      color: '#e5e7eb', // Grey color for placeholders
      x: radialPos.x,
      y: radialPos.y,
      metadata: {
        loading: true,
        expanded: false,
        layoutDistance: radialPos.distance,
        initialAngle: radialPos.angle,
      },
    });

    newLinks.push({
      source: researcherId,
      target: placeholderId,
      type: 'authored',
      value: 1,
    });
  }

  return { nodes: newNodes, links: newLinks };
}

/**
 * Update researcher and replace placeholders with actual data
 */
export function updateResearcherPapers(
  currentGraph: GraphData,
  researcherData: ScholarAuthorResponse,
  placeholderResearcherName?: string
): GraphData {
  const newNodes = [...currentGraph.nodes];
  const newLinks = [...currentGraph.links];
  // Use the name that was used to create the placeholders/researcher node if provided
  const researcherName = placeholderResearcherName || researcherData.author.name;
  const researcherId = `researcher-${researcherName}`;

  // 1. Update researcher node metadata
  const researcherNodeIndex = newNodes.findIndex(n => n.id === researcherId);
  if (researcherNodeIndex !== -1) {
    newNodes[researcherNodeIndex] = {
      ...newNodes[researcherNodeIndex],
      metadata: {
        ...newNodes[researcherNodeIndex].metadata,
        affiliations: researcherData.author.affiliations,
        thumbnail: researcherData.author.thumbnail,
        link: `https://scholar.google.com/citations?user=${researcherData.author.author_id || researcherData.search_parameters?.author_id}&hl=${researcherData.search_parameters?.hl || 'en'}`,
        loading: false,
      },
    };
  }

  // 2. Find and replace placeholders
  // We identify placeholders by ID pattern `placeholder-${researcherName}-`
  const placeholderIndices = newNodes
    .map((n, i) => (n.id.startsWith(`placeholder-${researcherName}-`) ? i : -1))
    .filter(i => i !== -1);

  const papers = researcherData.articles.slice(0, placeholderIndices.length); // Fill up to the number of placeholders (or less)

  papers.forEach((article, i) => {
    if (i < placeholderIndices.length) {
      const index = placeholderIndices[i];
      const placeholderNode = newNodes[index];
      const paperId = `paper-${article.citation_id || article.id || article.title}`;

      // Calculate citation count and size
      let citationCount = 0;
      if (article.inline_links?.cited_by?.total) {
        citationCount = article.inline_links.cited_by.total;
      } else if (article.cited_by?.total) {
        citationCount = article.cited_by.total;
      } else if (article.cited_by?.value !== undefined) {
        // Handle both string and number formats
        const value = article.cited_by.value;
        citationCount = typeof value === 'string' 
          ? parseInt(value.replace(/,/g, ''), 10) 
          : (typeof value === 'number' ? value : 0);
      }

      const nodeSize = citationCount > 0
        ? Math.min(10, 5 + Math.log10(citationCount) * 1.5)
        : 5;

      // Replace placeholder with actual paper node
      // Keep x, y from placeholder to maintain layout stability
      newNodes[index] = {
        id: paperId,
        name: article.title,
        type: 'paper',
        val: nodeSize,
        color: '#13315c',
        x: placeholderNode.x,
        y: placeholderNode.y,
        metadata: {
          citationCount,
          year: article.year?.toString(),
          link: article.link || article.title_link,
          venue: article.publication,
          authors: Array.isArray(article.authors) ? article.authors.map(a => ({ name: a.name, id: a.id })) : [], // Simplified author mapping
          data_cid: article.data_cid,
          citation_id: article.citation_id,
          expanded: false,
          layoutDistance: placeholderNode.metadata?.layoutDistance,
          initialAngle: placeholderNode.metadata?.initialAngle,
        },
      };

      // Update links: find links to placeholder and point them to new paperId
      // Actually, since we are replacing the node object in the array, we also need to update links that reference the OLD id
      const oldId = placeholderNode.id;

      // Update links in place
      for (let j = 0; j < newLinks.length; j++) {
        if (newLinks[j].target === oldId) {
          newLinks[j] = { ...newLinks[j], target: paperId };
        }
        if (newLinks[j].source === oldId) {
          newLinks[j] = { ...newLinks[j], source: paperId };
        }
      }
    }
  });

  // 3. Remove remaining placeholders if we had fewer papers than placeholders
  if (papers.length < placeholderIndices.length) {
    const indicesToRemove = placeholderIndices.slice(papers.length);
    // Sort descending to remove from end without shifting indices of earlier items
    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach(idx => {
      const nodeIdToRemove = newNodes[idx].id;
      newNodes.splice(idx, 1);

      // Remove associated links
      for (let j = newLinks.length - 1; j >= 0; j--) {
        if (newLinks[j].source === nodeIdToRemove || newLinks[j].target === nodeIdToRemove) {
          newLinks.splice(j, 1);
        }
      }
    });
  }

  return { nodes: newNodes, links: newLinks };
}

