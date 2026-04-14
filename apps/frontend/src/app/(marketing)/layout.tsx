export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  // Prevent white flash before React hydrates by setting dark bg at layout level
  return (
    <div style={{ backgroundColor: '#f2f1ee', minHeight: '100vh' }}>
      {children}
    </div>
  );
}
