import { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  buildEmail,
  buildSms,
  buildTel,
  buildVCard,
  buildWifi,
  DATA_TYPE_LABELS,
  type VCardFields,
  type WifiFields
} from '@/lib/payloads';
import type { DataType } from '@/lib/types';

type Props = {
  setPayload: (value: string) => void;
  setName: (value: string) => void;
};

const TYPES: DataType[] = ['wifi', 'vcard', 'tel', 'sms', 'email', 'text'];

const EMPTY_WIFI: WifiFields = { ssid: '', password: '', encryption: 'WPA', hidden: false };
const EMPTY_VCARD: VCardFields = {
  firstName: '',
  lastName: '',
  organization: '',
  title: '',
  phone: '',
  email: '',
  website: ''
};

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text'
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function TypedInput({ setPayload, setName }: Props) {
  const [dataType, setDataType] = useState<DataType>('wifi');
  const [wifi, setWifi] = useState<WifiFields>(EMPTY_WIFI);
  const [vcard, setVcard] = useState<VCardFields>(EMPTY_VCARD);
  const [tel, setTel] = useState('');
  const [sms, setSms] = useState({ number: '', message: '' });
  const [email, setEmail] = useState({ address: '', subject: '', body: '' });
  const [text, setText] = useState('');

  // Whatever the active form builds becomes the single item the generator sees.
  useEffect(() => {
    let payload = '';
    let name = 'qr_code';

    if (dataType === 'wifi') {
      payload = buildWifi(wifi);
      name = wifi.ssid ? `wifi_${wifi.ssid}` : 'wifi';
    } else if (dataType === 'vcard') {
      payload = buildVCard(vcard);
      name = [vcard.firstName, vcard.lastName].filter(Boolean).join('_') || 'contact';
    } else if (dataType === 'tel') {
      payload = buildTel(tel);
      name = tel ? `tel_${tel}` : 'phone';
    } else if (dataType === 'sms') {
      payload = buildSms(sms.number, sms.message);
      name = sms.number ? `sms_${sms.number}` : 'sms';
    } else if (dataType === 'email') {
      payload = buildEmail(email.address, email.subject, email.body);
      name = email.address || 'email';
    } else {
      payload = text.trim();
      name = 'text';
    }

    setPayload(payload);
    setName(name);
  }, [dataType, wifi, vcard, tel, sms, email, text, setPayload, setName]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="data-type">What should this code do?</Label>
        <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
          <SelectTrigger id="data-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {DATA_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dataType === 'wifi' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="wifi-ssid"
            label="Network name (SSID)"
            value={wifi.ssid}
            onChange={(v) => setWifi({ ...wifi, ssid: v })}
            placeholder="Guest Wi-Fi"
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="wifi-enc">Security</Label>
            <Select
              value={wifi.encryption}
              onValueChange={(v) => setWifi({ ...wifi, encryption: v as WifiFields['encryption'] })}
            >
              <SelectTrigger id="wifi-enc">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA / WPA2 / WPA3</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">Open — no password</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {wifi.encryption !== 'nopass' && (
            <Field
              id="wifi-pass"
              label="Password"
              value={wifi.password}
              onChange={(v) => setWifi({ ...wifi, password: v })}
            />
          )}
          <Label htmlFor="wifi-hidden" className="self-end font-normal">
            <Checkbox
              id="wifi-hidden"
              checked={wifi.hidden}
              onCheckedChange={(c) => setWifi({ ...wifi, hidden: c === true })}
            />
            This network is hidden
          </Label>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Anyone who scans this joins the network. The password is encoded in the pattern in plain
            text, so treat a printed code the same way you would treat the password itself.
          </p>
        </div>
      )}

      {dataType === 'vcard' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="vc-first" label="First name" value={vcard.firstName} onChange={(v) => setVcard({ ...vcard, firstName: v })} />
          <Field id="vc-last" label="Last name" value={vcard.lastName} onChange={(v) => setVcard({ ...vcard, lastName: v })} />
          <Field id="vc-org" label="Organisation" value={vcard.organization} onChange={(v) => setVcard({ ...vcard, organization: v })} />
          <Field id="vc-title" label="Job title" value={vcard.title} onChange={(v) => setVcard({ ...vcard, title: v })} />
          <Field id="vc-phone" label="Phone" type="tel" value={vcard.phone} onChange={(v) => setVcard({ ...vcard, phone: v })} />
          <Field id="vc-email" label="Email" type="email" value={vcard.email} onChange={(v) => setVcard({ ...vcard, email: v })} />
          <Field id="vc-web" label="Website" type="url" value={vcard.website} onChange={(v) => setVcard({ ...vcard, website: v })} />
        </div>
      )}

      {dataType === 'tel' && (
        <Field id="tel-number" label="Phone number" type="tel" value={tel} onChange={setTel} placeholder="+1 555 010 0100" />
      )}

      {dataType === 'sms' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sms-number" label="Phone number" type="tel" value={sms.number} onChange={(v) => setSms({ ...sms, number: v })} />
          <Field id="sms-message" label="Message (optional)" value={sms.message} onChange={(v) => setSms({ ...sms, message: v })} />
        </div>
      )}

      {dataType === 'email' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="em-addr" label="Email address" type="email" value={email.address} onChange={(v) => setEmail({ ...email, address: v })} />
          <Field id="em-subj" label="Subject (optional)" value={email.subject} onChange={(v) => setEmail({ ...email, subject: v })} />
          <div className="sm:col-span-2">
            <Field id="em-body" label="Message (optional)" value={email.body} onChange={(v) => setEmail({ ...email, body: v })} />
          </div>
        </div>
      )}

      {dataType === 'text' && (
        <Field id="plain-text" label="Text" value={text} onChange={setText} placeholder="Anything you like" />
      )}
    </div>
  );
}
