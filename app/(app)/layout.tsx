import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      <ServiceWorkerRegister />
      <main className="px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
