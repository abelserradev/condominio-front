import { getLabelTextoArchivo } from "../utils/comprobante";

type ComprobanteUploadFieldProps = {
  comprimiendo: boolean;
  extrayendoOcr: boolean;
  errorOcr: string | null;
  archivo: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function ComprobanteUploadField({
  comprimiendo,
  extrayendoOcr,
  errorOcr,
  archivo,
  onFileChange,
}: ComprobanteUploadFieldProps) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">
        Cargue su comprobante aquí (máximo 5MB)
      </span>
      <label className="inline-block cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          required
          disabled={comprimiendo || extrayendoOcr}
          className="sr-only"
        />
        {getLabelTextoArchivo(comprimiendo, extrayendoOcr, archivo)}
      </label>
      {comprimiendo && (
        <p className="mt-1 text-xs text-accent-foreground">
          Optimizando imagen para reducir tamaño...
        </p>
      )}
      {extrayendoOcr && (
        <p className="mt-1 text-xs text-accent-foreground">
          Extrayendo datos del comprobante...
        </p>
      )}
      {errorOcr && (
        <p className="mt-1 text-xs text-accent-foreground">{errorOcr}</p>
      )}
    </div>
  );
}
