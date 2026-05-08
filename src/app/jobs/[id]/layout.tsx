import MobileBottomNav from "@/components/common/MobileBottomNav";

// /jobs/[id] sits outside the (shell) route group, so it doesn't inherit the
// shell's MobileBottomNav. This layout adds it back so the bottom rail is
// consistent across detail pages (mirrors /professionals/[id]/layout.tsx).
export default function JobDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <MobileBottomNav />
    </>
  );
}
