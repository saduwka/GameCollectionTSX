import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Unhandled render error:", error, info);
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className={styles.wrapper} role="alert" aria-live="assertive">
          <div className={styles.card}>
            <div className={styles.emoji} aria-hidden="true">🎮💥</div>
            <h1 className={styles.title}>Что-то сломалось</h1>
            <p className={styles.message}>
              Произошла непредвиденная ошибка. Мы уже знаем о ней.
              Попробуйте обновить страницу или вернуться на главную.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className={styles.errorDetails}>
                {this.state.error.message}
              </pre>
            )}
            <div className={styles.actions}>
              <button className={styles.btnPrimary} onClick={this.handleReload}>
                Обновить страницу
              </button>
              <button className={styles.btnSecondary} onClick={this.handleHome}>
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
