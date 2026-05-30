export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-up-navy">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-up-text-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
