import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      <main className="px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
