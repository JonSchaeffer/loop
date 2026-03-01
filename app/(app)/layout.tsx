export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav will be added in Phase 2 */}
      <main>{children}</main>
    </div>
  )
}
