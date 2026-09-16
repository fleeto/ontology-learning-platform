// Graph geometry helpers shared by the Ontology Explorer and case simulators.

export interface NodePosition {
  x: number;
  y: number;
}

export interface LinkWithEndpoints {
  source: string;
  target: string;
}

export interface QuadraticPath {
  path: string;
  cx: number;
  cy: number;
}

export function getDefaultPosition(objectId: string): NodePosition {
  return { x: 400, y: 300 };
}

// Two-dimensional quadratic Bézier with a fixed perpendicular offset.
export function getLinkPath(
  source: NodePosition,
  target: NodePosition,
  offset = 25,
): QuadraticPath {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cx = midX + (-dy / len) * offset;
  const cy = midY + (dx / len) * offset;
  return {
    path: `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`,
    cx,
    cy,
  };
}

export function getPointOnPath(path: string, progress: number): NodePosition {
  const parts = path.match(/M ([\d.]+) ([\d.]+) Q ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)/);
  if (!parts) return { x: 0, y: 0 };
  const [, x1, y1, cx, cy, x2, y2] = parts.map(Number);
  const t = progress;
  const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
  const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
  return { x, y };
}

// Breadth-first shortest path over an undirected graph defined by link endpoints.
export function findShortestPath(
  links: LinkWithEndpoints[],
  from: string,
  to: string,
): string[] {
  if (from === to) return [from];
  const queue: string[][] = [[from]];
  const visited = new Set([from]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const link of links) {
      let next: string | null = null;
      if (link.source === current) next = link.target;
      else if (link.target === current) next = link.source;
      if (next && !visited.has(next)) {
        if (next === to) return [...path, next];
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return [];
}
