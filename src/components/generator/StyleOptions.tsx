import { AlertTriangle, ImageUp, Info, RotateCcw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inspectColors } from '@/lib/colors';
import type { Logo } from '@/lib/types';

type Props = {
  foreground: string;
  setForeground: (value: string) => void;
  background: string;
  setBackground: (value: string) => void;
  logo: Logo | null;
  setLogo: (logo: Logo | null) => void;
  onError: (message: string) => void;
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function ColorField({
  id,
  label,
  value,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-surface p-1"
        />
        <Input
          value={value.toUpperCase()}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next.toLowerCase());
          }}
          aria-label={`${label} hex value`}
          className="font-mono uppercase"
        />
      </div>
    </div>
  );
}

export function StyleOptions({
  foreground,
  setForeground,
  background,
  setBackground,
  logo,
  setLogo,
  onError
}: Props) {
  const contrast = inspectColors(foreground, background);
  const isDefault = foreground === '#000000' && background === '#ffffff';

  const handleLogo = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please choose an image file for the logo.');
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      onError('That logo is over 2 MB. Please use a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogo({ dataUrl: String(reader.result), scale: logo?.scale ?? 0.22 });
    reader.onerror = () => onError('Could not read that image.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField id="fg-color" label="Code colour" value={foreground} onChange={setForeground} />
        <ColorField id="bg-color" label="Background" value={background} onChange={setBackground} />
      </div>

      {!contrast.ok && (
        <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {contrast.message}
        </p>
      )}

      {contrast.ok && contrast.message && (
        <p className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          {contrast.message}
        </p>
      )}

      {!isDefault && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setForeground('#000000');
              setBackground('#ffffff');
            }}
          >
            <RotateCcw />
            Reset to black on white
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="logo-upload">Logo in the middle (optional)</Label>

        {logo ? (
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={logo.dataUrl}
              alt="Your logo"
              className="size-12 rounded-md border border-border bg-surface object-contain p-1"
            />
            <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
              <Label htmlFor="logo-scale" className="text-xs font-normal text-muted-foreground">
                Size — {Math.round(logo.scale * 100)}% of the code
              </Label>
              <input
                id="logo-scale"
                type="range"
                min={10}
                max={30}
                value={Math.round(logo.scale * 100)}
                onChange={(e) => setLogo({ ...logo, scale: Number(e.target.value) / 100 })}
                className="accent-primary"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setLogo(null)}>
              <X />
              Remove
            </Button>
          </div>
        ) : (
          <label
            htmlFor="logo-upload"
            className="flex cursor-pointer items-center gap-2 self-start rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-xs transition-colors hover:border-primary hover:text-primary"
          >
            <ImageUp className="size-4" />
            Choose an image
          </label>
        )}

        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
        />

        <p className="text-xs text-muted-foreground">
          {logo
            ? 'Error correction is forced to High while a logo is set, so the covered modules can still be recovered. Always test-scan a code with a logo before printing it.'
            : 'A logo covers part of the pattern. Keep it under about a quarter of the width.'}
        </p>
      </div>
    </div>
  );
}
