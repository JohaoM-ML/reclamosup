type Props = {
  label: string;
  value: string | number;
  meta?: string;
  ok?: boolean;
};

export function AnalyticsKpi({ label, value, meta, ok }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="text-2xl font-bold text-up-text">{value}</p>
      <p className="text-xs text-up-text-secondary mt-1">{label}</p>
      {meta && (
        <p className={`text-xs mt-1 ${ok === false ? 'text-red-600' : ok === true ? 'text-green-600' : 'text-up-text-muted'}`}>
          {meta}
        </p>
      )}
    </div>
  );
}
