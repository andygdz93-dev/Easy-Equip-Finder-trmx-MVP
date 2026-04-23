import { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-100">
          <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-5">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-rose-100">
              {this.state.error.message}
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900"
            >
              Back to mode selector
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
