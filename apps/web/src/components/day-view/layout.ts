import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { DisplayTask } from '../today/helpers'
import type { Bucket } from './buckets'

export type AnchorNodeData = {
  kind: 'anchor'
  variant: 'start' | 'end'
  label: string
  sub: string
}

export type BucketNodeData = {
  kind: 'bucket'
  label: string
  hint: string
  count: number
}

export type TaskNodeData = {
  kind: 'task'
  task: DisplayTask
}

export type DayNodeData = AnchorNodeData | BucketNodeData | TaskNodeData
export type DayNode = Node<DayNodeData>

const NODE_W = {
  anchor: 240,
  bucket: 200,
  task: 300,
}
const NODE_H = {
  anchor: 96,
  bucket: 72,
  task: 132,
}

function nodeSize(kind: DayNodeData['kind']): {
  width: number
  height: number
} {
  return { width: NODE_W[kind], height: NODE_H[kind] }
}

export type BuildArgs = {
  buckets: Bucket[]
  startLabel: string
  endLabel: string
  startSub: string
  endSub: string
}

export type GraphPayload = {
  nodes: DayNode[]
  edges: Edge[]
}

export function buildGraph({
  buckets,
  startLabel,
  endLabel,
  startSub,
  endSub,
}: BuildArgs): GraphPayload {
  const nodes: DayNode[] = []
  const edges: Edge[] = []

  nodes.push({
    id: 'start',
    type: 'anchor',
    position: { x: 0, y: 0 },
    data: {
      kind: 'anchor',
      variant: 'start',
      label: startLabel,
      sub: startSub,
    },
  })
  nodes.push({
    id: 'end',
    type: 'anchor',
    position: { x: 0, y: 0 },
    data: { kind: 'anchor', variant: 'end', label: endLabel, sub: endSub },
  })

  let prevBucketId = 'start'
  for (const bucket of buckets) {
    const bucketNodeId = `bucket:${bucket.id}`
    nodes.push({
      id: bucketNodeId,
      type: 'bucket',
      position: { x: 0, y: 0 },
      data: {
        kind: 'bucket',
        label: bucket.label,
        hint: bucket.hint,
        count: bucket.tasks.length,
      },
    })
    edges.push({
      id: `${prevBucketId}->${bucketNodeId}`,
      source: prevBucketId,
      target: bucketNodeId,
      type: 'smoothstep',
      animated: true,
    })
    for (const task of bucket.tasks) {
      const taskNodeId = `task:${task.id}`
      nodes.push({
        id: taskNodeId,
        type: 'task',
        position: { x: 0, y: 0 },
        data: { kind: 'task', task },
      })
      edges.push({
        id: `${bucketNodeId}->${taskNodeId}`,
        source: bucketNodeId,
        target: taskNodeId,
        type: 'smoothstep',
        animated: bucket.id === 'overdue',
      })
    }
    prevBucketId = bucketNodeId
  }

  edges.push({
    id: `${prevBucketId}->end`,
    source: prevBucketId,
    target: 'end',
    type: 'smoothstep',
    animated: true,
  })

  return layoutGraph({ nodes, edges })
}

function layoutGraph(payload: GraphPayload): GraphPayload {
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'TB',
    nodesep: 40,
    ranksep: 80,
    edgesep: 20,
    marginx: 40,
    marginy: 40,
  })
  g.setDefaultEdgeLabel(() => ({}))

  for (const node of payload.nodes) {
    g.setNode(node.id, nodeSize(node.data.kind))
  }
  // For each bucket's task-fan, give tasks the SAME rank so they appear side-by-side.
  // dagre will infer ranks from edges; we don't need extra setup here because bucket->task
  // edges already place all tasks of a bucket at the same rank one below the bucket.
  for (const edge of payload.edges) {
    g.setEdge(edge.source, edge.target)
  }
  dagre.layout(g)

  // Find min x to normalize positioning, so the graph starts near x=0
  let minX = Infinity
  for (const node of payload.nodes) {
    const pos = g.node(node.id)
    if (!pos) continue
    const size = nodeSize(node.data.kind)
    const left = pos.x - size.width / 2
    if (left < minX) minX = left
  }
  if (!Number.isFinite(minX)) minX = 0

  return {
    nodes: payload.nodes.map((node) => {
      const pos = g.node(node.id)
      const size = nodeSize(node.data.kind)
      if (!pos) return node
      return {
        ...node,
        position: {
          x: pos.x - size.width / 2 - minX,
          y: pos.y - size.height / 2,
        },
        width: size.width,
        height: size.height,
      }
    }),
    edges: payload.edges,
  }
}
