export function PdfViewer({
  reclamoId,
  archivoPath,
}: {
  reclamoId: string;
  archivoPath?: string | null;
}) {
  if (!archivoPath) {
    return (
      <div className="rounded-lg border border-dashed border-up-border bg-up-surface-muted p-8 text-center text-up-text text-sm">
        Examen aún no escaneado por DAAR. Entregue su examen físico en CAP.
      </div>
    );
  }

  const url = `/api/archivo/${reclamoId}`;
  return (
    <div className="rounded-lg border border-up-border bg-up-surface-muted overflow-hidden h-[500px]">
      <iframe src={url} title="Examen escaneado" className="w-full h-full" />
    </div>
  );
}
