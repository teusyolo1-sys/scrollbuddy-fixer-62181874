// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-2xl px-6">
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          TaskFlow
        </h1>
        <p className="text-xl text-muted-foreground">
          Crie sites profissionais com nosso editor visual. Rápido, intuitivo e poderoso.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/auth"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Começar agora
          </a>
          <a
            href="/checkout"
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Ver planos
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
