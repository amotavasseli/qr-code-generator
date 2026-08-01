import { Label } from '@/components/ui/label';

type Props = {
  value: string;
  onChange: (value: string) => void;
  count: number;
};

const PLACEHOLDER = [
  'https://example.com/a, welcome-packet',
  'https://example.com/b, badge-ada',
  'https://example.com/c'
].join('\n');

export function PasteInput({ value, onChange, count }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="pasted-list">One URL per line. Add a filename after a comma or a tab:</Label>
      <textarea
        id="pasted-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={PLACEHOLDER}
        className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <p className="text-xs text-muted-foreground">
        {count === 0
          ? 'Nothing to generate yet.'
          : `${count} URL${count === 1 ? '' : 's'} ready. Tab-separated works too, so you can paste two columns straight out of a spreadsheet.`}
      </p>
    </div>
  );
}
