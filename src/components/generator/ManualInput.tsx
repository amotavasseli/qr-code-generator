import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ManualEntry } from '@/lib/types';

type Props = {
  entries: ManualEntry[];
  updateEntry: <K extends keyof ManualEntry>(id: number, field: K, value: ManualEntry[K]) => void;
  addEntry: () => void;
  removeEntry: (id: number) => void;
};

export function ManualInput({ entries, updateEntry, addEntry, removeEntry }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-[1fr_1fr_5rem_2.25rem] gap-2 text-xs font-medium text-muted-foreground sm:grid">
        <span>URL</span>
        <span>Filename (optional)</span>
        <span>Copies</span>
        <span className="sr-only">Remove</span>
      </div>

      {entries.map((entry, index) => (
        <div key={entry.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_5rem_2.25rem]">
          <Input
            type="url"
            value={entry.url}
            onChange={(e) => updateEntry(entry.id, 'url', e.target.value)}
            placeholder="https://example.com"
            aria-label={`URL for row ${index + 1}`}
          />
          <Input
            value={entry.filename}
            onChange={(e) => updateEntry(entry.id, 'filename', e.target.value)}
            placeholder={`qr_code_${index + 1}`}
            aria-label={`Filename for row ${index + 1}`}
          />
          <Input
            type="number"
            min={1}
            max={500}
            value={entry.copies}
            onChange={(e) =>
              updateEntry(
                entry.id,
                'copies',
                Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 1))
              )
            }
            aria-label={`Copies for row ${index + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeEntry(entry.id)}
            disabled={entries.length === 1}
            aria-label={`Remove row ${index + 1}`}
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>
      ))}

      <div>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus />
          Add another
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Set <strong>Copies</strong> to repeat the same URL — one row with 20 copies and "QR codes per
        image" set to 20 fills a single sheet with that one code.
      </p>
    </div>
  );
}
