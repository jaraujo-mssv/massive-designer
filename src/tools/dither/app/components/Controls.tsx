import React, { useRef } from 'react';
import { definePreset } from '@/shared/dither/presets';
import type {
  BayerSize,
  ColorMode,
  DriftParams,
  LiveParams,
  LivePreset,
  NoiseParams,
  NoiseType,
  Waveform,
  WiggleParams,
} from '@/shared/dither/types';
import { COLOR_DEFAULTS, LIVE_DEFAULTS, MASSIVE_SWATCHES } from '../constants/factory';
import { ColorWell, Group, Range, Segmented, Toggle } from './ControlKit';

interface ControlsProps {
  preset: LivePreset;
  onChange: (preset: LivePreset) => void;
}

/**
 * The tuner's control surface, minus Pointer and Scroll.
 *
 * Those two are dropped on purpose: what the Social Media templates render is a
 * baked still, which has no cursor to follow and no scroll position to react
 * to, and both resolve to no-ops at frame 0 anyway. Everything else is here
 * with the upstream ranges unchanged, so a preset means the same thing in both
 * tools.
 */
export function Controls({ preset, onChange }: ControlsProps) {
  // Switching colour mode and switching back should not silently discard the
  // palette you just built, so each mode's last state is kept.
  const colorMemory = useRef<Partial<Record<ColorMode['mode'], ColorMode>>>({});

  const patch = (next: Partial<LivePreset>) => onChange(definePreset({ ...preset, ...next }));

  const patchLive = (next: Partial<LiveParams>) =>
    onChange(definePreset({ ...preset, live: { ...preset.live, ...next } }));

  const noise = preset.live?.noise;
  const wiggle = preset.live?.wiggle;
  const drift = preset.live?.drift;

  const patchNoise = (next: Partial<NoiseParams>) =>
    patchLive({ noise: { ...LIVE_DEFAULTS.noise, ...noise, ...next } });
  const patchWiggle = (next: Partial<WiggleParams>) =>
    patchLive({ wiggle: { ...LIVE_DEFAULTS.wiggle, ...wiggle, ...next } });
  const patchDrift = (next: Partial<DriftParams>) =>
    patchLive({ drift: { ...LIVE_DEFAULTS.drift, ...drift, ...next } });

  const setColorMode = (mode: ColorMode['mode']) => {
    if (mode === preset.color.mode) return;
    colorMemory.current[preset.color.mode] = preset.color;
    patch({ color: colorMemory.current[mode] ?? COLOR_DEFAULTS[mode] });
  };

  const color = preset.color;

  return (
    <div className="flex flex-col">
      <Group title="Structure">
        <Range
          label="Scale"
          value={preset.scale}
          min={1}
          max={8}
          step={1}
          onChange={(scale) => patch({ scale })}
        />
        <Segmented<BayerSize>
          label="Matrix"
          value={preset.matrix}
          options={[
            { value: 2, label: '2×2' },
            { value: 4, label: '4×4' },
            { value: 8, label: '8×8' },
            { value: 16, label: '16×16' },
          ]}
          onChange={(matrix) => patch({ matrix })}
        />
        <Range
          label="Spread"
          value={preset.spread}
          min={0}
          max={2}
          step={0.01}
          onChange={(spread) => patch({ spread })}
        />
      </Group>

      <Group title="Tone">
        <Range
          label="Brightness"
          value={preset.brightness}
          min={-1}
          max={1}
          step={0.01}
          onChange={(brightness) => patch({ brightness })}
        />
        <Range
          label="Contrast"
          value={preset.contrast}
          min={0}
          max={4}
          step={0.01}
          onChange={(contrast) => patch({ contrast })}
        />
        <Range
          label="Gamma"
          value={preset.gamma}
          min={0.1}
          max={4}
          step={0.01}
          onChange={(gamma) => patch({ gamma })}
        />
        <Range
          label="Saturation"
          value={preset.saturation}
          min={0}
          max={2}
          step={0.01}
          onChange={(saturation) => patch({ saturation })}
        />
        <Toggle label="Invert" value={preset.invert} onChange={(invert) => patch({ invert })} />
      </Group>

      <Group title="Colour">
        <Segmented<ColorMode['mode']>
          label="Mode"
          value={color.mode}
          options={[
            { value: 'duotone', label: 'Duo' },
            { value: 'mono', label: 'Mono' },
            { value: 'palette', label: 'Palette' },
            { value: 'rgb', label: 'RGB' },
          ]}
          onChange={setColorMode}
        />

        {color.mode === 'duotone' && (
          <>
            <ColorWell
              label="Ink"
              value={color.ink}
              onChange={(ink) => patch({ color: { ...color, ink } })}
            />
            <ColorWell
              label="Paper"
              value={color.paper}
              onChange={(paper) => patch({ color: { ...color, paper } })}
            />
            <div className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-text-mid">Swatches</span>
              <div className="flex gap-1.5">
                {MASSIVE_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={`${hex} — click for ink, shift-click for paper`}
                    onClick={(event) =>
                      patch({
                        color: event.shiftKey ? { ...color, paper: hex } : { ...color, ink: hex },
                      })
                    }
                    style={{ background: hex }}
                    className="w-6 h-6 rounded border border-border-subtle"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {color.mode === 'palette' && (
          <>
            {color.colors.map((hex, index) => (
              <ColorWell
                key={index}
                label={`Colour ${index + 1}`}
                value={hex}
                onChange={(next) => {
                  const colors = [...color.colors];
                  colors[index] = next;
                  patch({ color: { ...color, colors } });
                }}
              />
            ))}
            <div className="flex items-center gap-2 pl-[108px]">
              <button
                type="button"
                disabled={color.colors.length >= 16}
                onClick={() =>
                  patch({ color: { ...color, colors: [...color.colors, '#ffffff'] } })
                }
                className="px-2 py-1 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary disabled:opacity-40"
              >
                + Colour
              </button>
              <button
                type="button"
                disabled={color.colors.length <= 2}
                onClick={() => patch({ color: { ...color, colors: color.colors.slice(0, -1) } })}
                className="px-2 py-1 rounded bg-surface-2 text-xs text-text-dim hover:text-text-primary disabled:opacity-40"
              >
                − Colour
              </button>
            </div>
          </>
        )}

        {color.mode === 'rgb' && (
          <Range
            label="Levels"
            value={color.levels}
            min={2}
            max={16}
            step={1}
            onChange={(levels) => patch({ color: { ...color, levels } })}
          />
        )}
      </Group>

      <Group
        title="Grain"
        enabled={Boolean(noise)}
        onToggle={(on) => patchLive({ noise: on ? LIVE_DEFAULTS.noise : undefined })}
      >
        <Range
          label="Amount"
          value={noise?.amount ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(amount) => patchNoise({ amount })}
        />
        <Range
          label="Cell"
          value={noise?.scale ?? 1}
          min={1}
          max={16}
          step={1}
          onChange={(scale) => patchNoise({ scale })}
        />
        <Range
          label="Speed"
          value={noise?.speed ?? 0}
          min={0}
          max={60}
          step={1}
          onChange={(speed) => patchNoise({ speed })}
        />
        <Segmented<NoiseType>
          label="Field"
          value={noise?.type ?? 'white'}
          options={[
            { value: 'white', label: 'White' },
            { value: 'perlin', label: 'Organic' },
          ]}
          onChange={(type) => patchNoise({ type })}
        />
      </Group>

      <Group
        title="Wiggle"
        enabled={Boolean(wiggle)}
        onToggle={(on) => patchLive({ wiggle: on ? LIVE_DEFAULTS.wiggle : undefined })}
      >
        <Segmented<Waveform>
          label="Wave"
          value={wiggle?.wave ?? 'sine'}
          options={[
            { value: 'sine', label: 'Sine' },
            { value: 'triangle', label: 'Tri' },
            { value: 'perlin', label: 'Drift' },
          ]}
          onChange={(wave) => patchWiggle({ wave })}
        />
        <Range
          label="Speed"
          value={wiggle?.speed ?? 0}
          min={0}
          max={4}
          step={0.01}
          onChange={(speed) => patchWiggle({ speed })}
        />
        <Range
          label="Bright"
          value={wiggle?.brightness ?? 0}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(brightness) => patchWiggle({ brightness })}
        />
        <Range
          label="Contrast"
          value={wiggle?.contrast ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(contrast) => patchWiggle({ contrast })}
        />
        <Range
          label="Phase"
          value={wiggle?.phase ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(phase) => patchWiggle({ phase })}
        />
      </Group>

      <Group
        title="Drift"
        enabled={Boolean(drift)}
        onToggle={(on) => patchLive({ drift: on ? LIVE_DEFAULTS.drift : undefined })}
      >
        <Range
          label="X px/s"
          value={drift?.x ?? 0}
          min={-60}
          max={60}
          step={1}
          onChange={(x) => patchDrift({ x })}
        />
        <Range
          label="Y px/s"
          value={drift?.y ?? 0}
          min={-60}
          max={60}
          step={1}
          onChange={(y) => patchDrift({ y })}
        />
      </Group>
    </div>
  );
}
