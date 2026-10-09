import React from 'react';

// Catches render-time errors in whatever it wraps (e.g. a bug triggered by
// an unexpected server payload) so one broken component shows a fallback
// card instead of blanking the entire app for every user.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <p>Something went wrong displaying this document.</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
