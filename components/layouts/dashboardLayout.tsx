interface DashboardLayoutProps {
  title: string;
  subTitle: string;
  children: React.ReactNode;
}

export default function DashboardLayout({
  title,
  subTitle,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="border-b border-border bg-background px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-3">
            {/* Main Title */}
            <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance">
              {title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground leading-relaxed text-pretty max-w-2xl">
              {subTitle}
            </p>
          </div>
        </div>
      </header>

      {/* Content Area - Placeholder */}
      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
