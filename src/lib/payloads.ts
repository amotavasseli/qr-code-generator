import type { DataType } from './types';

/**
 * Every one of these is still a plain static QR code — the only difference is
 * how the payload string is assembled. Phones recognise these prefixes and
 * offer the matching action (join this network, save this contact, dial this
 * number) instead of opening a browser.
 */

export const DATA_TYPE_LABELS: Record<DataType, string> = {
  url: 'Website URL',
  text: 'Plain text',
  wifi: 'Wi-Fi network',
  vcard: 'Contact card (vCard)',
  tel: 'Phone number',
  sms: 'SMS message',
  email: 'Email'
};

/**
 * In WIFI: and MECARD-style payloads, backslash, semicolon, comma and double
 * quote are structural, so they have to be escaped or the string is misparsed.
 */
const escapeWifi = (value: string): string => value.replace(/([\\;,":])/g, '\\$1');

/** vCard folds on CRLF and treats these as field separators. */
const escapeVCard = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([;,])/g, '\\$1');

export type WifiFields = {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
};

export const buildWifi = ({ ssid, password, encryption, hidden }: WifiFields): string => {
  if (!ssid.trim()) return '';

  const parts = [`T:${encryption}`, `S:${escapeWifi(ssid)}`];
  if (encryption !== 'nopass' && password) parts.push(`P:${escapeWifi(password)}`);
  if (hidden) parts.push('H:true');

  return `WIFI:${parts.join(';')};;`;
};

export type VCardFields = {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
};

export const buildVCard = (f: VCardFields): string => {
  const full = [f.firstName, f.lastName].filter(Boolean).join(' ').trim();
  if (!full && !f.organization.trim()) return '';

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(f.lastName)};${escapeVCard(f.firstName)};;;`,
    `FN:${escapeVCard(full)}`
  ];

  if (f.organization) lines.push(`ORG:${escapeVCard(f.organization)}`);
  if (f.title) lines.push(`TITLE:${escapeVCard(f.title)}`);
  if (f.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(f.phone)}`);
  if (f.email) lines.push(`EMAIL:${escapeVCard(f.email)}`);
  if (f.website) lines.push(`URL:${escapeVCard(f.website)}`);

  lines.push('END:VCARD');

  // vCard requires CRLF line endings.
  return lines.join('\r\n');
};

export const buildTel = (number: string): string =>
  number.trim() ? `tel:${number.replace(/[^\d+]/g, '')}` : '';

export const buildSms = (number: string, message: string): string => {
  if (!number.trim()) return '';
  const clean = number.replace(/[^\d+]/g, '');
  return message ? `SMSTO:${clean}:${message}` : `SMSTO:${clean}`;
};

export const buildEmail = (address: string, subject: string, body: string): string => {
  if (!address.trim()) return '';

  const query = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`
  ]
    .filter(Boolean)
    .join('&');

  return query ? `mailto:${address}?${query}` : `mailto:${address}`;
};
