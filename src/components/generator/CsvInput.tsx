import { FileSpreadsheet, Upload } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = {
  sheetFile: File | null;
  sheetHeaders: string[];
  urlColumn: string;
  setUrlColumn: (value: string) => void;
  filenameColumn: string;
  setFilenameColumn: (value: string) => void;
  filenamePrefix: string;
  setFilenamePrefix: (value: string) => void;
  onFileChange: (file: File | null) => void;
};

const NUMBERED = '__numbered__';

export function CsvInput({
  sheetFile,
  sheetHeaders,
  urlColumn,
  setUrlColumn,
  filenameColumn,
  setFilenameColumn,
  filenamePrefix,
  setFilenamePrefix,
  onFileChange
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor="csv-upload"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-6 py-8 text-center transition-colors hover:border-primary hover:bg-primary-subtle/40"
      >
        <Upload className="size-6 text-primary" />
        <span className="text-sm font-medium">Choose a CSV or Excel file</span>
        <span className="text-xs text-muted-foreground">
          .csv, .xlsx or .xls — a header row and a column of URLs is all it needs
        </span>
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv,.xlsx,.xls"
        className="sr-only"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />

      {sheetFile && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileSpreadsheet className="size-4 text-primary" />
          {sheetFile.name}
        </p>
      )}

      {sheetHeaders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="url-column">Column containing URLs</Label>
            <Select value={urlColumn} onValueChange={setUrlColumn}>
              <SelectTrigger id="url-column">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sheetHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="filename-column">Column to name files after</Label>
            <Select
              value={filenameColumn || NUMBERED}
              onValueChange={(value) => setFilenameColumn(value === NUMBERED ? '' : value)}
            >
              <SelectTrigger id="filename-column">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NUMBERED}>Numbered (qr_code_1, qr_code_2…)</SelectItem>
                {sheetHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filenameColumn && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="filename-prefix">Filename prefix (optional)</Label>
              <Input
                id="filename-prefix"
                value={filenamePrefix}
                onChange={(e) => setFilenamePrefix(e.target.value)}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground sm:col-span-2">
            Characters other than letters and numbers become underscores, and duplicates get a
            numeric suffix so nothing is silently overwritten.
          </p>
        </div>
      )}
    </div>
  );
}
