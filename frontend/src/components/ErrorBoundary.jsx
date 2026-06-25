import { Component } from 'react';

// Top-level safety net: any uncaught render error in the tree below is caught
// here and shown as a friendly screen instead of blanking the whole app (the
// failure mode behind the auth white-screen bugs). Class component because
// React error boundaries require getDerivedStateFromError / componentDidCatch.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface it for debugging; swap for a logging service later if desired.
    console.error('Uncaught render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-nom-50 to-orange-100 flex items-center justify-center px-4">
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center space-y-3">
            <p className="text-5xl">🍔💥</p>
            <h1 className="text-xl font-extrabold text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-500">
              The app hit an unexpected error. Let's get you back to a fresh start.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full bg-nom-500 hover:bg-nom-600 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
            >
              Back to safety
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
