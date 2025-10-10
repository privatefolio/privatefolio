import * as React from "react"

import SvgDiagram, { Edge, Node } from "./SvgDiagram"

const nodes: Node[] = [
  {
    color: "#7b1fa2",
    height: 360,
    id: "electron",
    labelX: 40,
    labelY: 345,
    type: "process",
    width: 400,
    x: 20,
    y: 20,
  },
  {
    color: "#f9f1e1",
    height: 100,
    id: "backend",
    type: "process",
    width: 200,
    x: 40,
    y: 40,
  },
  {
    color: "#58c4dc",
    height: 100,
    id: "frontend",
    type: "process",
    width: 200,
    x: 40,
    y: 200,
  },
]

const edges: Edge[] = [
  {
    color: "#58c4dc",
    id: "frontend-backend",
    label: "REST & WebSocket API",
    labelX: 110,
    labelY: 160,
    source: "frontend",
    sourcePoint: { x: 80, y: 200 },
    target: "backend",
    targetPoint: { x: 80, y: 140 },
  },
  {
    color: "#f9f1e1",
    id: "backend-frontend",
    source: "backend",
    sourcePoint: { x: 100, y: 140 },
    target: "frontend",
    targetPoint: { x: 100, y: 200 },
  },
]

export default function ArchitectureDiagram() {
  return <SvgDiagram nodes={nodes} edges={edges} width={440} height={400} />
}
