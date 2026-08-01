import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ErrorLevel, OutputFormat } from '@/lib/types';

type Props = {
  qrPerImage: number;
  setQrPerImage: (value: number) => void;
  includeLabels: boolean;
  setIncludeLabels: (value: boolean) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (value: OutputFormat) => void;
  qrSize: number;
  setQrSize: (value: number) => void;
  errorLevel: ErrorLevel;
  setErrorLevel: (value: ErrorLevel) => void;
  svgAvailable: boolean;
  logoActive: boolean;
};

const SIZES = [
  { value: '300', label: '300 × 300 px — labels, badges' },
  { value: '600', label: '600 × 600 px — flyers, signage' },
  { value: '1000', label: '1000 × 1000 px — posters, large print' }
];

const ERROR_LEVELS: { value: ErrorLevel; label: string }[] = [
  { value: 'L', label: 'Low — smallest pattern, screens only' },
  { value: 'M', label: 'Medium — the usual choice' },
  { value: 'Q', label: 'Quartile — printed labels' },
  { value: 'H', label: 'High — harsh conditions, logos' }
];

export function OutputOptions({
  qrPerImage,
  setQrPerImage,
  includeLabels,
  setIncludeLabels,
  outputFormat,
  setOutputFormat,
  qrSize,
  setQrSize,
  errorLevel,
  setErrorLevel,
  svgAvailable,
  logoActive
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="qr-per-image">QR codes per image</Label>
        <Input
          id="qr-per-image"
          type="number"
          min={1}
          max={100}
          value={qrPerImage}
          onChange={(e) => setQrPerImage(parseInt(e.target.value, 10) || 1)}
        />
        <p className="text-xs text-muted-foreground">
          1 gives individual files; higher combines them into a labelled grid.
        </p>
        {qrPerImage > 1 && (
          <Label htmlFor="include-labels" className="mt-1 font-normal">
            <Checkbox
              id="include-labels"
              checked={includeLabels}
              onCheckedChange={(checked) => setIncludeLabels(checked === true)}
            />
            Print a label under each QR code
          </Label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="output-format">File format</Label>
        <Select
          value={svgAvailable ? outputFormat : 'png'}
          onValueChange={(value) => setOutputFormat(value as OutputFormat)}
          disabled={!svgAvailable}
        >
          <SelectTrigger id="output-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="png">PNG (image)</SelectItem>
            <SelectItem value="svg">SVG (vector, scales to any size)</SelectItem>
          </SelectContent>
        </Select>
        {!svgAvailable && (
          <p className="text-xs text-muted-foreground">
            Combined sheets are composed as a raster image. Set "QR codes per image" back to 1 to
            choose SVG.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="qr-size">{qrPerImage > 1 ? 'Size of each code' : 'Image size'}</Label>
        <Select value={String(qrSize)} onValueChange={(value) => setQrSize(parseInt(value, 10))}>
          <SelectTrigger id="qr-size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="error-level">Error correction</Label>
        <Select
          value={logoActive ? 'H' : errorLevel}
          onValueChange={(value) => setErrorLevel(value as ErrorLevel)}
          disabled={logoActive}
        >
          <SelectTrigger id="error-level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ERROR_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {logoActive
            ? 'Locked to High while a logo is set — the logo covers modules that only High can recover. '
            : 'Higher levels stay scannable when a code is scuffed or partly covered. '}
          <a
            href="guides/qr-code-error-correction-levels.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Which level should I pick?
          </a>
        </p>
      </div>
    </div>
  );
}
