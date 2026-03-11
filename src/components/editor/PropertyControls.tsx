'use client';

import { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

// ─── Color Picker ──────────────────────────────────────────────────────────────

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  palette?: string[];
}

export function ColorPicker({ label, value, onChange, palette }: ColorPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-surface-600">{label}</label>
      {palette && palette.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {palette.map((c) => (
            <button
              key={c}
              className={`w-6 h-6 rounded border-2 transition-all ${
                value === c ? 'border-brand-600 scale-110 shadow-sm' : 'border-surface-200 hover:border-surface-400'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
              title={c}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-surface-200 cursor-pointer p-0"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 px-2 py-1 text-xs border border-surface-300 rounded bg-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
      </div>
    </div>
  );
}

// ─── Font Select ────────────────────────────────────────────────────────────────

interface FontSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  brandFonts?: string[];
}

const WEB_SAFE_FONTS = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Tahoma, sans-serif',
];

export function FontSelect({ label, value, onChange, brandFonts }: FontSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-surface-600">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-surface-300 rounded bg-white focus:ring-1 focus:ring-brand-500 outline-none"
        style={{ fontFamily: value || 'inherit' }}
      >
        <option value="">Par défaut</option>
        {brandFonts && brandFonts.length > 0 && (
          <optgroup label="Polices de la marque">
            {brandFonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>&#9733; {f.split(',')[0]}</option>
            ))}
          </optgroup>
        )}
        <optgroup label="Web-safe">
          {WEB_SAFE_FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0]}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

// ─── Size Input ─────────────────────────────────────────────────────────────────

interface SizeInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  unit?: string;
}

export function SizeInput({ label, value, onChange, min = 0, max = 200, unit = 'px' }: SizeInputProps) {
  const numVal = parseInt(value) || 0;
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-surface-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={numVal}
          onChange={(e) => onChange(`${e.target.value}${unit}`)}
          className="flex-1 h-1.5 accent-brand-600 cursor-pointer"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 px-2 py-1 text-xs border border-surface-300 rounded bg-white text-center focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>
    </div>
  );
}

// ─── Text Input ─────────────────────────────────────────────────────────────────

interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function TextInput({ label, value, onChange, placeholder, multiline }: TextInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-surface-600">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-2 py-1.5 text-xs border border-surface-300 rounded bg-white resize-y focus:ring-1 focus:ring-brand-500 outline-none"
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-2 py-1.5 text-xs border border-surface-300 rounded bg-white focus:ring-1 focus:ring-brand-500 outline-none"
        />
      )}
    </div>
  );
}

// ─── Select ─────────────────────────────────────────────────────────────────────

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function SelectInput({ label, value, onChange, options }: SelectInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-surface-600">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-surface-300 rounded bg-white focus:ring-1 focus:ring-brand-500 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Padding Input ──────────────────────────────────────────────────────────────

interface PaddingInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function PaddingInput({ label, value, onChange }: PaddingInputProps) {
  const parts = (value || '0px 0px 0px 0px').split(/\s+/);
  const [top, right, bottom, left] = [
    parts[0] || '0px',
    parts[1] || parts[0] || '0px',
    parts[2] || parts[0] || '0px',
    parts[3] || parts[1] || parts[0] || '0px',
  ];

  const [linked, setLinked] = useState(top === right && right === bottom && bottom === left);

  const update = (pos: number, val: string) => {
    const p = [top, right, bottom, left];
    if (linked) {
      onChange([val, val, val, val].join(' '));
    } else {
      p[pos] = val;
      onChange(p.join(' '));
    }
  };

  const labels = ['H', 'D', 'B', 'G'];
  const values = [top, right, bottom, left];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-surface-600">{label}</label>
        <button
          onClick={() => setLinked(!linked)}
          className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${linked ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}
        >
          {linked ? 'Lié' : 'Libre'}
        </button>
      </div>
      {/* Visual padding box */}
      <div className="relative flex items-center justify-center py-3">
        <div className="relative w-full border border-surface-200 rounded bg-surface-50 p-2">
          {/* Top */}
          <div className="flex justify-center mb-1">
            <input
              type="text"
              value={values[0]}
              onChange={(e) => update(0, e.target.value)}
              className="w-14 px-1 py-0.5 text-[10px] border border-surface-300 rounded bg-white text-center focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          {/* Middle row */}
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={values[3]}
              onChange={(e) => update(3, e.target.value)}
              className="w-14 px-1 py-0.5 text-[10px] border border-surface-300 rounded bg-white text-center focus:ring-1 focus:ring-brand-500 outline-none"
            />
            <div className="w-12 h-6 bg-surface-200 rounded mx-2 shrink-0" />
            <input
              type="text"
              value={values[1]}
              onChange={(e) => update(1, e.target.value)}
              className="w-14 px-1 py-0.5 text-[10px] border border-surface-300 rounded bg-white text-center focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          {/* Bottom */}
          <div className="flex justify-center mt-1">
            <input
              type="text"
              value={values[2]}
              onChange={(e) => update(2, e.target.value)}
              className="w-14 px-1 py-0.5 text-[10px] border border-surface-300 rounded bg-white text-center focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Alignment Buttons ──────────────────────────────────────────────────────────

interface AlignmentProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function AlignmentButtons({ label, value, onChange }: AlignmentProps) {
  const options = [
    { val: 'left', Icon: AlignLeft },
    { val: 'center', Icon: AlignCenter },
    { val: 'right', Icon: AlignRight },
  ];

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-surface-600">{label}</label>
      <div className="flex gap-1">
        {options.map((o) => (
          <button
            key={o.val}
            onClick={() => onChange(o.val)}
            className={`flex-1 flex items-center justify-center py-1.5 rounded border transition-colors ${
              value === o.val
                ? 'bg-brand-100 border-brand-300 text-brand-700'
                : 'bg-white border-surface-200 text-surface-400 hover:bg-surface-50 hover:text-surface-600'
            }`}
          >
            <o.Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
