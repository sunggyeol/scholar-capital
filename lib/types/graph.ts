// Graph visualization types

export interface GraphNode {
  id: string;
  name: string;
  type: 'researcher' | 'paper' | 'coauthor';
  val?: number; // Size of the node
  color?: string;
  x?: number; // x position
  y?: number; // y position
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
  metadata?: {
    citationCount?: number;
    year?: string;
    link?: string;
    affiliations?: string;
    thumbnail?: string;
    authorId?: string;
    expanded?: boolean;
    venue?: string;
    authors?: Array<{
      name: string;
      id?: string;
      link?: string;
    }>;
    data_cid?: string; // For fetching additional details
    citation_id?: string; // For fetching full author names via view_citation
    cites_id?: string; // For fetching citations
    layoutDistance?: number; // For deterministic layout positioning
    initialAngle?: number; // Initial angle for radial positioning
    loading?: boolean; // For async loading state
  };
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'authored' | 'coauthored' | 'cited';
  value?: number; // Link strength
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type NodeExpansionState = {
  [nodeId: string]: boolean;
};

