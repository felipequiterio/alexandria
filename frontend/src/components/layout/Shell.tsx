import { Header } from "./Header";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
}
