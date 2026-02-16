import { ScholarAuthorResponse, ScholarArticle } from '@/lib/types/scholar';
import { GraphData, GraphNode, GraphLink } from '@/lib/types/graph';

/**
 * Generate deterministic angle and distance for radial dispersion
 * Uses golden angle spacing for even distribution around the circle
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

  // Use golden angle for even distribution around the circle
  const goldenAngle = 2.399963229728653;
  const baseAngle = index * goldenAngle;

  // Add some variation based on hash to avoid perfect symmetry
  const angleVariation = ((hash / 0xffffffff) * 0.5 - 0.25) * Math.PI / 6;
  const angle = baseAngle + angleVariation;

  // Calculate max safe distance to keep nodes within viewport
  const maxSafeDistance = Math.min(viewportWidth, viewportHeight) * 0.35;

  // Generate varied distance
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

  if (!data.author) {
    return { nodes: [], links: [] };
  }

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Add central researcher node
  const researcherId = `researcher-${data.author.name}`;
  nodes.push({
    id: researcherId,
    name: data.author.name,
    type: 'researcher',
    val: 12,
    color: '#134074',
    metadata: {
      affiliations: data.author.affiliations,
      thumbnail: data.author.thumbnail,
      link: data.author.author_id
        ? `https://openalex.org/authors/${data.author.author_id}`
        : undefined,
    },
  });

  // Add paper nodes (limited by maxPapers)
  const papers = (data.articles || []).slice(0, maxPapers);

  papers.forEach((article, index) => {
    const paperId = `paper-${article.citation_id || article.title}`;

    // Extract citation count
    let citationCount = 0;
    if (article.cited_by?.total) {
      citationCount = article.cited_by.total;
    } else if (article.cited_by?.value !== undefined) {
      const value = article.cited_by.value;
      citationCount = typeof value === 'string'
        ? parseInt(value.replace(/,/g, ''), 10)
        : (typeof value === 'number' ? value : 0);
    }

    // Calculate node size based on citation count (logarithmic scale)
    const nodeSize = citationCount > 0
      ? Math.min(10, 5 + Math.log10(citationCount) * 1.5)
      : 5;

    // Extract authors list - OpenAlex always provides structured arrays
    let authorsList: Array<{ name: string; id?: string; link?: string }> = [];
    if (Array.isArray(article.authors)) {
      authorsList = article.authors.map(author => ({
        name: author.name,
        id: author.id || author.author_id,
        link: author.link,
      }));
    } else if (typeof article.authors === 'string') {
      const authorsStr = article.authors.split(' - ')[0];
      authorsList = authorsStr.split(',').map(name => ({ name: name.trim() }));
    }

    // Generate radial position for dispersion
    const radialPos = generateRadialPosition(paperId, index, papers.length);

    nodes.push({
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
        link: article.link,
        venue: article.publication,
        authors: authorsList,
        citation_id: article.citation_id,
        cites_id: article.cited_by?.cites_id,
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
    const coAuthorsToShow = data.co_authors.slice(0, 10);

    coAuthorsToShow.forEach((coAuthor) => {
      const coAuthorId = `coauthor-${coAuthor.author_id}`;

      nodes.push({
        id: coAuthorId,
        name: coAuthor.name,
        type: 'coauthor',
        val: 8,
        color: '#8da9c4',
        metadata: {
          affiliations: coAuthor.affiliations,
          authorId: coAuthor.author_id,
          link: coAuthor.link,
        },
      });

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

    if (!newNodes.find(n => n.id === coAuthorId)) {
      newNodes.push({
        id: coAuthorId,
        name: coAuthorName,
        type: 'coauthor',
        val: 8,
        color: '#8da9c4',
        metadata: {},
      });

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
    const paperId = `paper-${article.result_id || article.data_cid || article.title}`;

    if (!newNodes.find(n => n.id === paperId)) {
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

      const currentPaperCount = newNodes.filter(n => n.type === 'paper').length;
      const radialPos = generateRadialPosition(paperId, currentPaperCount, additionalPapers.length + currentPaperCount);

      newNodes.push({
        id: paperId,
        name: article.title,
        type: 'paper',
        val: nodeSize,
        color: '#10b981',
        x: radialPos.x,
        y: radialPos.y,
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
 */
export function addResearcherToGraph(
  currentGraph: GraphData,
  researcherData: ScholarAuthorResponse,
  sourcePaperId?: string,
  options: { maxPapers?: number } = {}
): GraphData {
  const { maxPapers = 20 } = options;

  if (!researcherData.author) {
    return currentGraph;
  }

  const newNodes = [...currentGraph.nodes];
  const newLinks = [...currentGraph.links];

  // Determine position for the new researcher
  let researcherX = 0;
  let researcherY = 0;

  if (sourcePaperId) {
    const sourceNode = newNodes.find(n => n.id === sourcePaperId);
    if (sourceNode && sourceNode.x !== undefined && sourceNode.y !== undefined) {
      const angle = Math.atan2(sourceNode.y, sourceNode.x);
      const distance = 600;
      researcherX = sourceNode.x + Math.cos(angle) * distance;
      researcherY = sourceNode.y + Math.sin(angle) * distance;
    } else {
      researcherX = 800;
      researcherY = 0;
    }
  }

  // Add researcher node
  const researcherId = `researcher-${researcherData.author.name}`;

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
        link: researcherData.author.author_id
          ? `https://openalex.org/authors/${researcherData.author.author_id}`
          : undefined,
      },
    });
  }

  // Link source paper to new researcher
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

  // Add new papers around the new researcher
  const papers = (researcherData.articles || []).slice(0, maxPapers);

  papers.forEach((article, index) => {
    const paperId = `paper-${article.citation_id || article.title}`;

    if (paperId === sourcePaperId) return;

    if (!newNodes.find(n => n.id === paperId)) {
      let citationCount = 0;
      if (article.cited_by?.total) {
        citationCount = article.cited_by.total;
      } else if (article.cited_by?.value !== undefined) {
        const value = article.cited_by.value;
        citationCount = typeof value === 'string'
          ? parseInt(value.replace(/,/g, ''), 10)
          : (typeof value === 'number' ? value : 0);
      }

      const nodeSize = citationCount > 0
        ? Math.min(10, 5 + Math.log10(citationCount) * 1.5)
        : 5;

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
          link: article.link,
          venue: article.publication,
          authors: Array.isArray(article.authors)
            ? article.authors.map(a => ({ name: a.name, id: a.id }))
            : [],
          citation_id: article.citation_id,
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
    } else {
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

  let researcherX = 0;
  let researcherY = 0;

  if (sourcePaperId) {
    const sourceNode = newNodes.find(n => n.id === sourcePaperId);
    if (sourceNode && sourceNode.x !== undefined && sourceNode.y !== undefined) {
      const existingResearcherLinks = newLinks.filter(l =>
        (l.source === sourcePaperId && l.target.startsWith('researcher-')) ||
        (l.target === sourcePaperId && l.source.startsWith('researcher-'))
      );

      const neighborCount = existingResearcherLinks.length;
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

  // Add researcher node (if not exists)
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
        loading: true,
      },
    });
  }

  // Link source paper to new researcher
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

  // Add placeholder papers
  for (let i = 0; i < count; i++) {
    const placeholderId = `placeholder-${researcherName}-${i}`;

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
      val: 5,
      color: '#e5e7eb',
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
  const researcherName = placeholderResearcherName || researcherData.author?.name;
  if (!researcherName) {
    return currentGraph;
  }
  const researcherId = `researcher-${researcherName}`;

  // Update researcher node metadata
  const researcherNodeIndex = newNodes.findIndex(n => n.id === researcherId);
  if (researcherNodeIndex !== -1 && researcherData.author) {
    newNodes[researcherNodeIndex] = {
      ...newNodes[researcherNodeIndex],
      metadata: {
        ...newNodes[researcherNodeIndex].metadata,
        affiliations: researcherData.author.affiliations,
        thumbnail: researcherData.author.thumbnail,
        link: researcherData.author.author_id
          ? `https://openalex.org/authors/${researcherData.author.author_id}`
          : undefined,
        loading: false,
      },
    };
  }

  // Find and replace placeholders
  const placeholderIndices = newNodes
    .map((n, i) => (n.id.startsWith(`placeholder-${researcherName}-`) ? i : -1))
    .filter(i => i !== -1);

  const papers = (researcherData.articles || []).slice(0, placeholderIndices.length);

  papers.forEach((article, i) => {
    if (i < placeholderIndices.length) {
      const index = placeholderIndices[i];
      const placeholderNode = newNodes[index];
      const paperId = `paper-${article.citation_id || article.title}`;

      let citationCount = 0;
      if (article.cited_by?.total) {
        citationCount = article.cited_by.total;
      } else if (article.cited_by?.value !== undefined) {
        const value = article.cited_by.value;
        citationCount = typeof value === 'string'
          ? parseInt(value.replace(/,/g, ''), 10)
          : (typeof value === 'number' ? value : 0);
      }

      const nodeSize = citationCount > 0
        ? Math.min(10, 5 + Math.log10(citationCount) * 1.5)
        : 5;

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
          link: article.link,
          venue: article.publication,
          authors: Array.isArray(article.authors) ? article.authors.map(a => ({ name: a.name, id: a.id })) : [],
          citation_id: article.citation_id,
          expanded: false,
          layoutDistance: placeholderNode.metadata?.layoutDistance,
          initialAngle: placeholderNode.metadata?.initialAngle,
        },
      };

      const oldId = placeholderNode.id;
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

  // Remove remaining placeholders if we had fewer papers than placeholders
  if (papers.length < placeholderIndices.length) {
    const indicesToRemove = placeholderIndices.slice(papers.length);
    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach(idx => {
      const nodeIdToRemove = newNodes[idx].id;
      newNodes.splice(idx, 1);

      for (let j = newLinks.length - 1; j >= 0; j--) {
        if (newLinks[j].source === nodeIdToRemove || newLinks[j].target === nodeIdToRemove) {
          newLinks.splice(j, 1);
        }
      }
    });
  }

  return { nodes: newNodes, links: newLinks };
}
