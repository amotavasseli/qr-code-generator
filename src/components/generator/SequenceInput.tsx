import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SEQUENCE_LIMIT, type SequenceFields } from '@/lib/sequence';

type Props = {
  sequence: SequenceFields;
  updateSequence: <K extends keyof SequenceFields>(field: K, value: SequenceFields[K]) => void;
  count: number;
};

export function SequenceInput({ sequence, updateSequence, count }: Props) {
  const first = `${sequence.prefix}${String(sequence.start).padStart(sequence.padTo, '0')}${sequence.suffix}`;
  const last = `${sequence.prefix}${String(sequence.end).padStart(sequence.padTo, '0')}${sequence.suffix}`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Generate a numbered run of codes without a list — asset tags, seat numbers, ticket stubs.
        Each code encodes its own identifier.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="seq-prefix">Prefix</Label>
          <Input
            id="seq-prefix"
            value={sequence.prefix}
            onChange={(e) => updateSequence('prefix', e.target.value)}
            placeholder="ASSET-"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="seq-suffix">Suffix</Label>
          <Input
            id="seq-suffix"
            value={sequence.suffix}
            onChange={(e) => updateSequence('suffix', e.target.value)}
            placeholder="(none)"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="seq-start">From</Label>
          <Input
            id="seq-start"
            type="number"
            value={sequence.start}
            onChange={(e) => updateSequence('start', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="seq-end">To</Label>
          <Input
            id="seq-end"
            type="number"
            value={sequence.end}
            onChange={(e) => updateSequence('end', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="seq-step">Step</Label>
          <Input
            id="seq-step"
            type="number"
            min={1}
            value={sequence.step}
            onChange={(e) => updateSequence('step', Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="seq-pad">Pad to</Label>
          <Input
            id="seq-pad"
            type="number"
            min={0}
            max={12}
            value={sequence.padTo}
            onChange={(e) =>
              updateSequence('padTo', Math.min(12, Math.max(0, parseInt(e.target.value, 10) || 0)))
            }
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {count === 0 ? (
          '"To" must be greater than "From".'
        ) : (
          <>
            <strong className="text-foreground">{count}</strong> code{count === 1 ? '' : 's'} — from{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{first}</code> to{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{last}</code>
            {count >= SEQUENCE_LIMIT && ` (capped at ${SEQUENCE_LIMIT})`}
          </>
        )}
      </p>
    </div>
  );
}
