import React from "react";

type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Erro capturado na interface", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen grid place-items-center p-6 bg-background text-foreground">
        <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Não foi possível carregar a pré-visualização</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Recarregue a página. Se persistir, o detalhe técnico abaixo ajuda a identificar a origem.
          </p>
          {this.state.message && (
            <pre className="mt-4 overflow-auto rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.message}
            </pre>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Recarregar
          </button>
        </section>
      </main>
    );
  }
}