'use client';

const SEMESTRES = ['2026-I', '2026-II', '2027-I'];

export function FiltrosDashboard({
  semestre,
  onSemestreChange,
}: {
  semestre: string;
  onSemestreChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-up-text-secondary">Semestre académico</label>
      <select
        value={semestre}
        onChange={(e) => onSemestreChange(e.target.value)}
        className="rounded-md border border-up-border px-3 py-1.5 text-sm text-up-text bg-white"
      >
        {SEMESTRES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <span className="text-xs text-up-text-muted">Actualización automática cada 30 s</span>
    </div>
  );
}
