import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook point for Sentry or similar.
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div className="max-w-md">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="mt-3 text-4xl">We knocked something off the desk.</h1>
          <p className="mt-4 text-muted">An unexpected error occurred. Reloading usually fixes it — your bag is saved.</p>
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={() => window.location.reload()} className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">
              Reload page
            </button>
            <a href="/" className="grid h-11 place-items-center rounded-full border border-border px-6 text-sm font-semibold">
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
