import type { QrItem } from './types';

export type SequenceFields = {
  prefix: string;
  suffix: string;
  start: number;
  end: number;
  step: number;
  padTo: number;
};

/** Guard against a runaway range locking up the tab. */
export const SEQUENCE_LIMIT = 10000;

export const sequenceCount = ({ start, end, step }: SequenceFields): number => {
  const stride = Math.abs(step) || 1;
  if (end < start) return 0;
  return Math.floor((end - start) / stride) + 1;
};

/**
 * Expands a numeric range into codes — the asset-tag workflow, where the codes
 * are the identifiers themselves rather than a list you already have.
 */
export const buildSequence = (fields: SequenceFields): QrItem[] => {
  const { prefix, suffix, start, end, padTo } = fields;
  const stride = Math.abs(fields.step) || 1;

  if (end < start) return [];

  const items: QrItem[] = [];
  for (let n = start; n <= end && items.length < SEQUENCE_LIMIT; n += stride) {
    const value = `${prefix}${String(n).padStart(padTo, '0')}${suffix}`;
    items.push({ url: value, name: value });
  }

  return items;
};
