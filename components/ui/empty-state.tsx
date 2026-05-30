export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-up-border bg-up-surface px-8 py-12 text-center">
      <p className="text-base font-semibold text-up-text">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-up-text-secondary">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
