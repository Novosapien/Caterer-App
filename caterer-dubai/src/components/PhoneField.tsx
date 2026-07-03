"use client";

import { useMemo, useState } from "react";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";

// A lightweight international phone input: country dial-code selector + number field.
// Emits an E.164-ish string (e.g. "+971501234567") via onChange. No external deps.

export interface Country {
  code: string; // ISO for the key
  name: string;
  dial: string; // e.g. "+971"
  flag: string;
}

// Curated list — UAE first (primary market), then common source countries for
// Dubai hospitality talent, then a broad tail.
export const COUNTRIES: Country[] = [
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "TR", name: "Türkiye", dial: "+90", flag: "🇹🇷" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
];

// Longest dial-code prefix match, so we can split an existing E.164 value.
function splitE164(value: string): { dial: string; national: string } {
  if (value?.startsWith("+")) {
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => value.startsWith(c.dial));
    if (match) return { dial: match.dial, national: value.slice(match.dial.length) };
  }
  return { dial: "+971", national: value?.replace(/^\+/, "") ?? "" };
}

interface Props {
  value: string;
  onChange: (e164: string) => void;
  label?: string;
  autoFocus?: boolean;
}

export default function PhoneField({ value, onChange, label = "Mobile number", autoFocus }: Props) {
  const initial = useMemo(() => splitE164(value), [value]);
  const [dial, setDial] = useState(initial.dial);
  const [national, setNational] = useState(initial.national);

  function emit(nextDial: string, nextNational: string) {
    const digits = nextNational.replace(/\D/g, "").replace(/^0+/, "");
    onChange(digits ? `${nextDial}${digits}` : "");
  }

  return (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        label="Country"
        value={dial}
        onChange={(e) => {
          setDial(e.target.value);
          emit(e.target.value, national);
        }}
        sx={{ minWidth: 112, maxWidth: 128 }}
        slotProps={{
          select: {
            renderValue: (v) => {
              const c = COUNTRIES.find((x) => x.dial === (v as string));
              return c ? `${c.flag} ${c.dial}` : String(v);
            },
          },
        }}
      >
        {COUNTRIES.map((c) => (
          <MenuItem key={c.code} value={c.dial}>
            {c.flag}&nbsp;&nbsp;{c.name}&nbsp;({c.dial})
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={label}
        value={national}
        onChange={(e) => {
          setNational(e.target.value);
          emit(dial, e.target.value);
        }}
        fullWidth
        type="tel"
        autoComplete="tel"
        autoFocus={autoFocus}
        placeholder="50 123 4567"
      />
    </Stack>
  );
}
