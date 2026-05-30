export function PdfViewer({
  reclamoId,
  archivoPath,
}: {
  reclamoId: string;
  archivoPath?: string | null;
}) {
  if (!archivoPath) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-800 text-sm">
        Examen aún no escaneado por DAAR. Entregue su examen físico en CAP.
      </div>
    );
  }

  const url = `/api/archivo/${reclamoId}`;
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden h-[500px]">
      <iframe src={url} title="Examen escaneado" className="w-full h-full" />
    </div>
  );
}
