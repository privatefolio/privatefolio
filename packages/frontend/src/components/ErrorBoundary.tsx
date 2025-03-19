import { Paper } from "@mui/material"
import React, { Component, ReactNode } from "react"

import { StaggeredList } from "./StaggeredList"
import { Subheading } from "./Subheading"

interface Props {
  children: ReactNode
}

interface State {
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary did catch", error, errorInfo)
  }

  constructor(props: Props) {
    super(props)
    this.state = {}
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <StaggeredList component="main" gap={2} show>
          <Subheading>Something went wrong...</Subheading>
          <Paper sx={{ overflow: "auto", paddingX: 2 }}>
            <pre>{String(this.state.error.stack)}</pre>
          </Paper>
        </StaggeredList>
      )
    }

    return this.props.children
  }
}
