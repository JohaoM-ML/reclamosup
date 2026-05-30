export function InsightBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
      <span className="font-medium">Insight: </span>
      {text}
    </div>
  );
}
