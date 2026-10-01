import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { centerCrop, makeAspectCrop, PercentCrop } from 'react-image-crop';
import { ClipboardText, Copy, Check, DownloadSimple, ImageSquare, Link as LinkIcon, UploadSimple, X } from '@phosphor-icons/react';
import { Toaster, toast } from 'sonner';
import { Segmented } from '@/shared/canvas/DesignPanel';
import {
  SidebarColumn,
  SidebarLayout,
  SidebarWarning,
  sidebarButtonClass,
  sidebarHeadingClass,
  sidebarInputClass,
} from '@/shared/components/SidebarLayout';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { useIsMobile } from '@/shared/components/ui/use-mobile';
import { loadAsDataUrl } from '@/shared/utils/imageDataUrl';
import { saveFile } from '@/shared/utils/saveFile';
import { ResultPreview, Stage } from './components/Stage';
import {
  copyText,
  CropArea,
  encodeSquare,
  nameFromUrl,
  naturalSize,
  SHEETS_CELL_LIMIT,
  sourceSide,
  SquareMode,
} from './utils/encode';

interface Source {
  /** A data URL, so the canvas is never tainted. */
  src: string;
  name: string;
  img: HTMLImageElement;
}

type SizeChoice = '32' | '64' | '128' | '256' | '512' | 'custom';
const SIZE_OPTIONS: { id: SizeChoice; label: string }[] = [
  { id: '32', label: '32' },
  { id: '64', label: '64' },
  { id: '128', label: '128' },
  { id: '256', label: '256' },
  { id: '512', label: '512' },
  { id: 'custom', label: 'Custom' },
];
const MODE_OPTIONS: { id: SquareMode; label: string }[] = [
  { id: 'crop', label: 'Crop' },
  { id: 'fit', label: 'Fit' },
];
const MAX_SIDE = 1024;
/** Wait this long after the last change before encoding again. */
const ENCODE_DELAY_MS = 150;

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** The largest square, centred, as a percent crop. */
function centredSquare(width: number, height: number): PercentCrop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 100 }, 1, width, height), width, height);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the image'));
    img.src = src;
  });
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Logo Encoder: turns an image into a square PNG data URL (base64), for the
 * `logo` column of Top List and Market Map sheets. The output updates live as
 * the crop, mode or size changes.
 */
export default function App() {
  const isMobile = useIsMobile();
  const [source, setSource] = useState<Source | null>(null);
  const [mode, setMode] = useState<SquareMode>('crop');
  const [lockCenter, setLockCenter] = useState(false);
  const [crop, setCrop] = useState<PercentCrop>();
  const [area, setArea] = useState<CropArea | null>(null);
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>('128');
  const [customSide, setCustomSide] = useState('300');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const side = useMemo(() => {
    if (sizeChoice !== 'custom') return Number(sizeChoice);
    const n = Math.round(Number(customSide));
    return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_SIDE) : 128;
  }, [sizeChoice, customSide]);

  const natural = source ? naturalSize(source.img) : null;

  const openSource = useCallback(async (src: string, name: string) => {
    try {
      const img = await loadImage(src);
      const { width, height } = naturalSize(img);
      const square = centredSquare(width, height);
      setSource({ src, name, img });
      setCrop(square);
      setArea(square);
      setOutput('');
      setDrawerOpen(false);
    } catch {
      toast.error("That file couldn't be read as an image.");
    }
  }, []);

  const openFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please choose an image file.');
        return;
      }
      openSource(await readFile(file), file.name.replace(/\.[^.]+$/, '') || 'Pasted image');
    },
    [openSource],
  );

  // Encodes once changes settle, so dragging the crop doesn't encode every frame.
  useEffect(() => {
    if (!source) return;
    const id = setTimeout(() => setOutput(encodeSquare(source.img, mode, area, side)), ENCODE_DELAY_MS);
    return () => clearTimeout(id);
  }, [source, mode, area, side]);

  // ⌘V / Ctrl+V anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) openFile(file);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [openFile]);

  /** The Paste button, for phones (no keyboard) and anyone who prefers clicking. */
  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          openFile(new File([blob], 'Pasted image', { type }));
          return;
        }
      }
      toast.error('There is no image in the clipboard.');
    } catch {
      toast.error(`Couldn't read the clipboard here. Try ${isMac ? '⌘V' : 'Ctrl+V'} instead.`);
    }
  };

  const importUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setLoadingUrl(true);
    // Directly when the host allows it, else through the image proxy; either way a data URL.
    const dataUrl = await loadAsDataUrl(url);
    setLoadingUrl(false);
    if (!dataUrl.startsWith('data:')) {
      toast.error("Couldn't load that image. Check that the link opens the image itself.");
      return;
    }
    setShowUrlDialog(false);
    setUrlInput('');
    openSource(dataUrl, nameFromUrl(url));
  };

  const clearImage = () => {
    setSource(null);
    setCrop(undefined);
    setArea(null);
    setOutput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const changeCrop = (next: PercentCrop) =>
    setCrop(lockCenter ? { ...next, x: (100 - next.width) / 2, y: (100 - next.height) / 2 } : next);
  const completeCrop = (next: PercentCrop) =>
    setArea(lockCenter ? { ...next, x: (100 - next.width) / 2, y: (100 - next.height) / 2 } : next);

  const toggleLockCenter = (on: boolean) => {
    setLockCenter(on);
    if (on && crop) {
      const centred = { ...crop, x: (100 - crop.width) / 2, y: (100 - crop.height) / 2 };
      setCrop(centred);
      setArea(centred);
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    if (await copyText(output)) {
      setCopied(true);
      toast.success('Data URL copied. Paste it into the logo column.');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Copying failed. Select the data URL under Output and copy it by hand.');
    }
  };

  const downloadPng = async () => {
    if (!output || !source) return;
    const blob = await fetch(output).then((r) => r.blob());
    await saveFile(blob, `${source.name} - ${side}x${side}.png`.replace(/[^a-z0-9\s\-_.]/gi, '_'));
  };

  const tooLong = output.length > SHEETS_CELL_LIMIT;
  const upscaledFrom = source ? Math.round(sourceSide(source.img, mode, area)) : 0;
  const upscaled = source !== null && upscaledFrom < side;

  const warnings = (
    <>
      {tooLong && (
        <SidebarWarning>
          {output.length.toLocaleString()} characters is too long for a Google Sheets cell (
          {SHEETS_CELL_LIMIT.toLocaleString()} max). Try a smaller size.
        </SidebarWarning>
      )}
      {upscaled && (
        <SidebarWarning>
          Upscaled from {upscaledFrom} × {upscaledFrom} px, so it may look soft. Use a bigger image or a smaller size.
        </SidebarWarning>
      )}
    </>
  );

  const sourceSection = (
    <div className="p-4 space-y-2 border-b border-border-subtle">
      <h3 className={`${sidebarHeadingClass} mb-3`}>Source</h3>
      {source && natural ? (
        <>
          <p className="text-sm text-text-primary truncate">{source.name}</p>
          <p className="text-xs text-text-dim">
            {natural.width} × {natural.height} px
          </p>
          <button onClick={clearImage} className={`${sidebarButtonClass} mt-3`}>
            <X size={16} />
            Clear image
          </button>
        </>
      ) : (
        <>
          <button onClick={() => fileInputRef.current?.click()} className={sidebarButtonClass}>
            <UploadSimple size={16} />
            Upload image
          </button>
          <button onClick={pasteFromClipboard} className={sidebarButtonClass}>
            <ClipboardText size={16} />
            Paste image
          </button>
          <button
            onClick={() => {
              setDrawerOpen(false);
              setShowUrlDialog(true);
            }}
            className={sidebarButtonClass}
          >
            <LinkIcon size={16} />
            Import from URL
          </button>
          {!isMobile && (
            <p className="text-xs text-text-dim pt-1">
              Or drop an image anywhere, or paste one with {isMac ? '⌘V' : 'Ctrl+V'}.
            </p>
          )}
        </>
      )}
    </div>
  );

  const settingsSections = (
    <>
      <div className="p-4 space-y-3 border-b border-border-subtle">
        <h3 className={sidebarHeadingClass}>Square</h3>
        <Segmented options={MODE_OPTIONS} value={mode} onChange={setMode} />
        {mode === 'crop' ? (
          <>
            <p className="text-xs text-text-dim">Drag the box on the image to choose the square.</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="lock-center" className="text-sm text-text-primary">
                Lock to center
              </Label>
              <Switch id="lock-center" checked={lockCenter} onCheckedChange={toggleLockCenter} />
            </div>
          </>
        ) : (
          <p className="text-xs text-text-dim">The whole image, centred, with transparent padding.</p>
        )}
      </div>

      <div className="p-4 space-y-3 border-b border-border-subtle">
        <h3 className={sidebarHeadingClass}>Size</h3>
        <Segmented options={SIZE_OPTIONS} value={sizeChoice} onChange={setSizeChoice} />
        {sizeChoice === 'custom' && (
          <label className="flex items-center gap-2 text-sm text-text-dim">
            Side
            <input
              type="number"
              min={1}
              max={MAX_SIDE}
              value={customSide}
              onChange={(e) => setCustomSide(e.target.value)}
              className={`${sidebarInputClass} w-28`}
            />
            px
          </label>
        )}
      </div>

      {output && (
        <div className="p-4 space-y-2">
          <h3 className={sidebarHeadingClass}>Output</h3>
          <p className="text-sm text-text-primary">
            {side} × {side} PNG · {output.length.toLocaleString()} characters
          </p>
          <details className="text-xs text-text-dim">
            <summary className="cursor-pointer">Show data URL</summary>
            <textarea
              readOnly
              value={output}
              onFocus={(e) => e.currentTarget.select()}
              className={`${sidebarInputClass} mt-2 h-28 font-mono text-[11px] resize-none`}
            />
          </details>
          {isMobile && (
            <button onClick={downloadPng} className={`${sidebarButtonClass} mt-2`}>
              <DownloadSimple size={16} />
              Download PNG
            </button>
          )}
        </div>
      )}
    </>
  );

  const copyButton = (
    <button
      onClick={copyOutput}
      disabled={!output}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:opacity-90 font-medium text-sm transition-opacity disabled:opacity-50"
    >
      {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
      {copied ? 'Copied' : 'Copy data URL'}
    </button>
  );

  const desktopFooter = (
    <>
      <h3 className={`${sidebarHeadingClass} mb-3`}>Export</h3>
      {warnings}
      {copyButton}
      <button onClick={downloadPng} disabled={!output} className={`${sidebarButtonClass} justify-center disabled:opacity-50`}>
        <DownloadSimple size={16} />
        Download PNG
      </button>
    </>
  );

  const emptyState = (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border-subtle p-8 text-center">
        <ImageSquare size={40} weight="fill" className="text-text-dim" />
        <div>
          <p className="text-text-primary font-medium">{isMobile ? 'Choose an image' : 'Drop an image here'}</p>
          <p className="text-xs text-text-dim mt-1">It becomes a square PNG data URL for a sheet's logo column.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <UploadSimple size={16} />
            Upload
          </button>
          <button
            onClick={pasteFromClipboard}
            className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border-subtle text-text-primary rounded-lg text-sm hover:border-brand"
          >
            <ClipboardText size={16} />
            Paste
          </button>
          <button
            onClick={() => setShowUrlDialog(true)}
            className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-border-subtle text-text-primary rounded-lg text-sm hover:border-brand"
          >
            <LinkIcon size={16} />
            From URL
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="h-full relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) openFile(file);
      }}
    >
      <Toaster position="top-center" richColors />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) openFile(file);
        }}
      />

      <SidebarLayout
        sidebar={
          <SidebarColumn toolName="Logo Encoder" footer={desktopFooter}>
            {sourceSection}
            {settingsSections}
          </SidebarColumn>
        }
        drawerTitle="Logo Encoder"
        drawerContent={
          <>
            <div className="p-4 space-y-2 border-b border-border-subtle empty:hidden">{warnings}</div>
            {sourceSection}
            {settingsSections}
          </>
        }
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        attention={tooLong || upscaled}
        barAction={copyButton}
      >
        <div
          className="flex-1 min-h-0 min-w-0 flex flex-col"
          style={{
            backgroundImage: `
              linear-gradient(rgba(250, 244, 236, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(250, 244, 236, 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
            backgroundColor: '#13121a',
          }}
        >
          {source && natural ? (
            <>
              <div className="relative flex-1 min-h-0 m-4 md:m-8">
                <Stage
                  src={source.src}
                  natural={natural}
                  mode={mode}
                  crop={crop}
                  onCropChange={changeCrop}
                  onCropComplete={completeCrop}
                />
              </div>
              <div className="shrink-0 border-t border-border-subtle bg-surface/60 px-4 py-3">
                <ResultPreview dataUrl={output} side={side} />
              </div>
            </>
          ) : (
            emptyState
          )}
        </div>
      </SidebarLayout>

      {isDragging && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-bg/80 border-2 border-dashed border-brand pointer-events-none">
          <p className="text-lg font-medium text-text-primary">Drop image here</p>
        </div>
      )}

      {showUrlDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowUrlDialog(false)}>
          <div
            className="bg-surface border border-border-subtle rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text-primary mb-4">Import from URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && importUrl()}
              placeholder="https://img.logo.dev/stripe.com?token=…"
              className={`${sidebarInputClass} mb-2`}
              autoFocus
            />
            <p className="text-xs text-text-dim mb-4">A link to the image itself (PNG, JPG, SVG, WebP).</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowUrlDialog(false);
                  setUrlInput('');
                }}
                className="px-4 py-2 text-sm text-text-dim hover:text-text-primary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={importUrl}
                disabled={loadingUrl}
                className="px-4 py-2 bg-brand text-white text-sm rounded-lg hover:opacity-90 font-medium transition-opacity disabled:opacity-50"
              >
                {loadingUrl ? 'Loading…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
