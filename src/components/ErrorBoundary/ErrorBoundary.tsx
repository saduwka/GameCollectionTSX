import { Component, type ErrorInfo, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";
import styles from "./ErrorBoundary.module.scss";

interface Props extends WithTranslation {
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
    const { t } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className={styles.wrapper} role="alert" aria-live="assertive">
          <div className={styles.card}>
            <div className={styles.emoji} aria-hidden="true">🎮💥</div>
            <h1 className={styles.title}>{t('common.error')}</h1>
            <p className={styles.message}>
              {t('not_found.description')}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className={styles.errorDetails}>
                {this.state.error.message}
              </pre>
            )}
            <div className={styles.actions}>
              <button className={styles.btnPrimary} onClick={this.handleReload}>
                {t('common.update_error').split(' ')[0]} {/* Placeholder for "Reload" */}
              </button>
              <button className={styles.btnSecondary} onClick={this.handleHome}>
                {t('common.home')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
