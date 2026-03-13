import { useLibraryStore } from "@/stores/library.store";

export function StatusBar() {
  const documents = useLibraryStore((s) => s.documents);

  return (
    <div className="status-bar col-span-2 flex items-center justify-center gap-4 px-4 py-1.5">
      <Stat label="Library Size" value={`${documents.length} Scrolls`} />
      <Divider />
      <Stat label="Graph Nodes" value="--" />
      <Divider />
      <Stat label="Memory Level" value="Long-Term (Adaptive)" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[10px] tracking-wide">
      <span className="text-muted-foreground/50">{label}:</span>{" "}
      <span className="text-muted-foreground/70 font-medium">{value}</span>
    </span>
  );
}

function Divider() {
  return <span className="text-muted-foreground/20 text-[10px]">|</span>;
}
