import { QrCode } from 'lucide-react';

type Props = {
  preview: string;
  itemCount: number;
};

export function LivePreview({ preview, itemCount }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
      {preview ? (
        <img
          src={preview}
          alt="Preview of the first QR code"
          width={160}
          height={160}
          className="size-40 rounded-md bg-surface"
        />
      ) : (
        <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground">
          <QrCode className="size-6" />
          <span className="text-xs">Preview</span>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {itemCount === 0
          ? 'Add something to see it here.'
          : itemCount === 1
            ? 'Live preview.'
            : `Showing the first of ${itemCount} codes.`}
      </p>
    </div>
  );
}
