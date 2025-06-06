import { Paper } from "@mui/material"
import React, { Component, createRef, ReactNode } from "react"

import { BackButton } from "./BackButton"
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

  componentDidUpdate(_: Props, prevState: State) {
    if (!prevState.error && this.state.error) {
      document.addEventListener("mousedown", this.onDocumentClick)
    } else if (prevState.error && !this.state.error) {
      document.removeEventListener("mousedown", this.onDocumentClick)
    }
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.onDocumentClick)
  }

  constructor(props: Props) {
    super(props)
    this.state = {}
    this.onDocumentClick = this.onDocumentClick.bind(this)
  }

  private errorContainer = createRef<HTMLDivElement>()

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  private onDocumentClick(ev: MouseEvent) {
    const container = this.errorContainer.current
    if (container && !container.contains(ev.target as Node)) {
      this.setState({ error: undefined }, () => {
        window.history.back()
      })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div ref={this.errorContainer}>
          <StaggeredList component="main" gap={2} show>
            <BackButton
              sx={{ marginLeft: 1 }}
              fallback="/"
              onClick={() => {
                window.history.back()
                this.setState({ error: undefined })
              }}
            >
              Back
            </BackButton>
            <Subheading>Something went wrong…</Subheading>
            <Paper sx={{ overflow: "auto", paddingX: 2 }}>
              <pre>{String(this.state.error.stack)}</pre>
            </Paper>
          </StaggeredList>
        </div>
      )
    }

    return this.props.children
  }
}
