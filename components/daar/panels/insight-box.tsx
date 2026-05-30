export function InsightBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-up-blue/20 bg-up-blue/5 px-4 py-3 text-sm text-up-navy">
      <span className="font-medium">Insight: </span>
      {text}
    </div>
  );
}
