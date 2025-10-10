import * as React from "react"

export interface Node {
  color: string
  height: number
  id: string
  label?: string
  labelX?: number
  labelY?: number
  type: "input" | "process" | "decision" | "output"
  width: number
  x: number
  y: number
}

export interface Edge {
  color: string
  id: string
  label?: string
  labelX?: number
  labelY?: number
  source: string
  sourcePoint?: { x: number; y: number }
  target: string
  targetPoint?: { x: number; y: number }
}

export type SvgDiagramProps = {
  edges: Edge[]
  height?: number
  nodes: Node[]
  width?: number
}

export default function SvgDiagram(props: SvgDiagramProps) {
  const { nodes, edges, width = 350, height = 500 } = props

  // Font size configuration
  const nodeFontSize = "1rem"
  const edgeLabelFontSize = "0.875rem"

  const getNodeCenter = (node: Node) => ({
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  })

  // Function to get colors for nodes - use provided color for border and lower opacity for background
  const getNodeColors = (node: Node) => {
    const backgroundOpacity = 0.33
    const backgroundOpacityPercent = Math.round(backgroundOpacity * 100)

    // Use the provided color for border and create a lower opacity version for background
    const borderColor = node.color

    // Convert color to rgba with lower opacity for background
    // Handle different color formats (hex, rgb, rgba, hsl, css variables)
    let backgroundColor: string

    if (node.color.startsWith("#")) {
      // Hex color - convert to rgba
      const hex = node.color.replace("#", "")
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      backgroundColor = `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`
    } else if (node.color.startsWith("rgb")) {
      // RGB or RGBA color
      if (node.color.includes("rgba")) {
        // Already rgba, just reduce the alpha
        backgroundColor = node.color.replace(/,\s*[\d.]+\)/, `, ${backgroundOpacity})`)
      } else {
        // RGB, convert to rgba
        backgroundColor = node.color
          .replace("rgb(", "rgba(")
          .replace(")", `, ${backgroundOpacity})`)
      }
    } else {
      // For CSS variables or other formats, use color with opacity
      backgroundColor = `color-mix(in srgb, ${node.color} ${backgroundOpacityPercent}%, transparent)`
    }

    return { fill: backgroundColor, stroke: borderColor }
  }

  const renderNode = (node: Node) => {
    const { x, y, width, height, label, labelX, labelY, type, id } = node
    const { fill, stroke } = getNodeColors(node)

    // Use label if provided, otherwise use id
    const displayLabel = label || id

    // Calculate label position - use custom position if provided, otherwise center
    const textX = labelX !== undefined ? labelX : x + width / 2
    const textY = labelY !== undefined ? labelY : y + height / 2
    const textAnchor = labelX !== undefined ? "start" : "middle"
    const dominantBaseline = labelY !== undefined ? "hanging" : "middle"

    if (type === "decision") {
      // Diamond shape for decision nodes
      const centerX = x + width / 2
      const centerY = y + height / 2
      const points = `${centerX},${y} ${x + width},${centerY} ${centerX},${y + height} ${x},${centerY}`

      return (
        <g key={node.id}>
          <polygon points={points} fill={fill} stroke={stroke} strokeWidth="2" />
          <text
            x={textX}
            y={textY}
            textAnchor={textAnchor}
            dominantBaseline={dominantBaseline}
            fontSize={nodeFontSize}
            fontWeight="500"
            fill="var(--vocs-color_heading)"
          >
            {displayLabel}
          </text>
        </g>
      )
    }

    // Rectangle shape for other node types
    const rx = type === "input" || type === "output" ? 20 : 8

    return (
      <g key={node.id}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={rx}
          ry={rx}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
        />
        <text
          x={textX}
          y={textY}
          textAnchor={textAnchor}
          dominantBaseline={dominantBaseline}
          fontSize={nodeFontSize}
          fontWeight="500"
          fill="var(--vocs-color_heading)"
        >
          {displayLabel}
        </text>
      </g>
    )
  }

  const renderEdge = (edge: Edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)

    if (!sourceNode || !targetNode) return null

    // Use custom connection points if provided, otherwise calculate default points
    let sourcePoint: { x: number; y: number }
    let targetPoint: { x: number; y: number }

    if (edge.sourcePoint) {
      sourcePoint = edge.sourcePoint
    } else {
      const source = getNodeCenter(sourceNode)
      const sourceY = sourceNode.y + sourceNode.height
      sourcePoint = { x: source.x, y: sourceY }

      if (sourceNode.type === "decision") {
        sourcePoint.y = source.y + sourceNode.height / 2
      }
    }

    if (edge.targetPoint) {
      targetPoint = edge.targetPoint
    } else {
      const target = getNodeCenter(targetNode)
      const targetY = targetNode.y
      targetPoint = { x: target.x, y: targetY }
    }

    // Use the provided edge color
    const edgeColor = edge.color

    // Create arrow marker
    const markerId = `arrow-${edge.id}`

    return (
      <g key={edge.id}>
        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0,0 0,6 9,3" fill={edgeColor} />
          </marker>
        </defs>
        <line
          x1={sourcePoint.x}
          y1={sourcePoint.y}
          x2={targetPoint.x}
          y2={targetPoint.y}
          stroke={edgeColor}
          strokeWidth="2"
          markerEnd={`url(#${markerId})`}
        />
        {edge.label && (
          <text
            x={edge.labelX !== undefined ? edge.labelX : (sourcePoint.x + targetPoint.x) / 2}
            y={edge.labelY !== undefined ? edge.labelY : (sourcePoint.y + targetPoint.y) / 2 - 5}
            textAnchor={edge.labelX !== undefined ? "start" : "middle"}
            dominantBaseline={edge.labelY !== undefined ? "hanging" : "middle"}
            fontSize={edgeLabelFontSize}
            fontWeight="500"
            fill="var(--vocs-color_heading)"
          >
            {edge.label}
          </text>
        )}
      </g>
    )
  }

  return (
    <div
      // className="vocs_CodeBlock"
      style={{
        marginLeft: -18,
        // backgroundColor: "var(--vocs-color_codeBlockBackground)",
        maxWidth: width,
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Render nodes */}
        {nodes.map(renderNode)}
        {/* Render edges first (behind nodes) */}
        {edges.map(renderEdge)}
      </svg>
    </div>
  )
}
