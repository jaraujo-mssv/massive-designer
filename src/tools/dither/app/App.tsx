import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Upload } from 'lucide-react';
import { loadAsDataUrl } from '@/shared/utils/imageDataUrl';
import { definePreset } from '@/shared/dither/presets';
import {
  DEFAULT_DITHER_PRESET,
  clearDitherPreset,
  getDitherPreset,
  hasSavedDitherPreset,
  loadDitherLibrary,
  saveDitherLibrary,
  saveDitherPreset,
  type SavedDitherPreset,
} from '@/shared/dither/preset-store';
import type { LivePreset } from '@/shared/dither/types';
import { Controls } from './components/Controls';
import { Preview, type PreviewTarget } from './components/Preview';
import { FACTORY, SAMPLES } from './constants/factory';
import { exportPresetSource, parsePresetSource } from './utils/literal';

type DitherTheme = 'dither-light' | 'dither-dark';

/**
 * Loads an image ready for texture upload.
 *
 * Same-origin paths go straight in; anything remote goes through the proxy
 * first, because a cross-origin texture upload throws SECURITY_ERR — the same
 * reason the Social Media bake proxies everything.
 */
async function loadSourceImage(src: string): Promise<HTMLImageElement> {
  const resolved = src.startsWith('data:') || src.startsWith('/') ? src : await loadAsDataUrl(src);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('could not load that image'));
    image.src = resolved;
  });
}

function App() {
  const [preset, setPreset] = useState<LivePreset>(() => getDitherPreset());
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState(SAMPLES[0]);
  const [urlInput, setUrlInput] = useState('');
  const [target, setTarget] = useState<PreviewTarget>('linkedin');
  const [theme, setTheme] = useState<DitherTheme>('dither-light');
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('');
  const [library, setLibrary] = useState<SavedDitherPreset[]>(() => loadDitherLibrary());
  const [presetName, setPresetName] = useState('');
  const [importBox, setImportBox] = useState('');
  const [saved, setSaved] = useState(() => hasSavedDitherPreset());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadSourceImage(sourceUrl)
      .then((image) => {
        if (!cancelled) setSource(image);
      })
      .catch((error: Error) => {
        if (!cancelled) setStatus(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSourceUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const applyDefault = () => {
    saveDitherPreset(preset);
    setSaved(true);
    setStatus('saved — the Social Media dither themes now use this');
  };

  const resetDefault = () => {
    clearDitherPreset();
    setPreset(DEFAULT_DITHER_PRESET);
    setSaved(false);
    setStatus('reset to the shipped preset');
  };

  const copyExport = async () => {
    const text = exportPresetSource(preset);
    try {
      await navigator.clipboard.writeText(text);
      setStatus('export copied — paste it over DEFAULT_DITHER_PRESET');
    } catch {
      setImportBox(text);
      setStatus('clipboard blocked — the export is in the box below');
    }
  };

  const saveNamed = () => {
    const name = presetName.trim() || 'Untitled';
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'preset';
    const next = definePreset({ ...preset, id, name });
    const list = library.filter((entry) => entry.preset.id !== id);
    list.push({ name, preset: next });
    saveDitherLibrary(list);
    setLibrary(list);
    setPreset(next);
    setStatus(`saved “${name}” to the library`);
  };

  const deleteNamed = (id: string) => {
    const list = library.filter((entry) => entry.preset.id !== id);
    saveDitherLibrary(list);
    setLibrary(list);
  };

  const runImport = () => {
    const parsed = parsePresetSource(importBox);
    if (!parsed) {
      setStatus('that is not a preset — check the JSON');
      return;
    }
    setPreset(parsed);
    setStatus('imported');
  };

  return (
    <div className="flex h-full bg-bg">
      {/* Controls */}
      <div className="w-96 shrink-0 bg-surface border-r border-border-subtle flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border-subtle">
          <h1 className="text-base font-semibold text-text-primary tracking-tight">Dither</h1>
          <p className="mt-1 text-xs text-text-dim">
            The blog's dither, tuned for the Social Media <code>dither-light</code> and{' '}
            <code>dither-dark</code> themes.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Source */}
          <div className="px-5 py-4 border-b border-border-subtle flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Source</h3>
            <div className="flex gap-2">
              {SAMPLES.map((sample, index) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setSourceUrl(sample)}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                    sourceUrl === sample
                      ? 'bg-brand text-white'
                      : 'bg-surface-2 text-text-dim hover:text-text-primary'
                  }`}
                >
                  Sample {index + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlInput.trim()) setSourceUrl(urlInput.trim());
                }}
                placeholder="Image URL"
                className="flex-1 bg-surface-2 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary"
              >
                <Upload size={13} />
                File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <Controls preset={preset} onChange={setPreset} />

          {/* Library */}
          <div className="px-5 py-4 border-b border-border-subtle flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Presets</h3>
            <div className="flex flex-wrap gap-1.5">
              {FACTORY.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setPreset(entry)}
                  className="px-2 py-1 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary"
                >
                  {entry.name}
                </button>
              ))}
            </div>
            {library.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {library.map((entry) => (
                  <span
                    key={entry.preset.id}
                    className="flex items-center gap-1 pl-2 pr-1 py-1 rounded bg-surface-2 text-xs text-text-mid"
                  >
                    <button type="button" onClick={() => setPreset(entry.preset)}>
                      {entry.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNamed(entry.preset.id)}
                      className="px-1 text-text-dim hover:text-brand-light"
                      title="Delete"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="flex-1 bg-surface-2 border border-border-subtle rounded px-2 py-1 text-xs text-text-primary"
              />
              <button
                type="button"
                onClick={saveNamed}
                className="px-3 py-1 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary"
              >
                Save
              </button>
            </div>
          </div>

          {/* Export / import */}
          <div className="px-5 py-4 flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">
              Use in Social Media
            </h3>
            <button
              type="button"
              onClick={applyDefault}
              className="px-3 py-2 rounded bg-brand text-white text-sm font-medium hover:opacity-90"
            >
              Save as default
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyExport}
                className="flex-1 px-3 py-1.5 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary"
              >
                Copy TS
              </button>
              <button
                type="button"
                onClick={resetDefault}
                className="flex-1 px-3 py-1.5 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary"
              >
                Reset
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-text-dim">
              {saved
                ? 'A saved preset is in use. It lives in this browser — use Copy TS and paste it over DEFAULT_DITHER_PRESET to ship it.'
                : 'The shipped preset is in use.'}
            </p>
            <textarea
              value={importBox}
              onChange={(e) => setImportBox(e.target.value)}
              placeholder="Paste a preset literal or JSON to import"
              rows={4}
              className="bg-surface-2 border border-border-subtle rounded px-2 py-1 text-[11px] font-mono text-text-primary"
            />
            <button
              type="button"
              onClick={runImport}
              className="px-3 py-1.5 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary"
            >
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Stage */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-6 p-8 overflow-auto"
        style={{
          backgroundImage: `
            linear-gradient(rgba(250, 244, 236, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(250, 244, 236, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          backgroundColor: '#242333',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex rounded border border-border-subtle overflow-hidden">
            {(
              [
                ['free', 'Free'],
                ['linkedin', 'LinkedIn'],
                ['twitter', 'X / Twitter'],
              ] as [PreviewTarget, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTarget(value)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  target === value ? 'bg-brand text-white' : 'bg-surface text-text-dim hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex rounded border border-border-subtle overflow-hidden">
            {(
              [
                ['dither-light', 'Light'],
                ['dither-dark', 'Dark'],
              ] as [DitherTheme, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  theme === value ? 'bg-brand text-white' : 'bg-surface text-text-dim hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            title={
              playing
                ? 'Pause — frame 0 is what the Social Media templates bake'
                : 'Play the animation'
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-subtle bg-surface text-xs text-text-dim hover:text-text-primary"
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>

        <Preview
          preset={preset}
          source={source}
          target={target}
          theme={theme}
          playing={playing}
          headingText="Text"
          bodyText="Text"
        />

        <p className="text-xs text-text-dim h-4">
          {status ||
            (playing
              ? 'Playing — the exported post is frame 0, so pause to judge what ships.'
              : 'Frame 0 — this is exactly what the Social Media export bakes.')}
        </p>
      </div>
    </div>
  );
}

export default App;
