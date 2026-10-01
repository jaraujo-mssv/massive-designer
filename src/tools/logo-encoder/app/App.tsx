import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { Toaster } from '@/shared/components/ui/sonner';
import { Upload, Copy, Download, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface SizePreset {
  label: string;
  width: number;
  height: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { label: '32x32', width: 32, height: 32 },
  { label: '64x64', width: 64, height: 64 },
  { label: '128x128', width: 128, height: 128 },
  { label: '256x256', width: 256, height: 256 },
  { label: '512x512', width: 512, height: 512 },
];

export default function App() {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [outputBase64, setOutputBase64] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('128x128');
  const [customWidth, setCustomWidth] = useState<string>('300');
  const [customHeight, setCustomHeight] = useState<string>('300');
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);
  const [lockCenter, setLockCenter] = useState<boolean>(false);
  const [sizeMode, setSizeMode] = useState<'preset' | 'custom'>('preset');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '');
      setOutputBase64('');
    });
    reader.readAsDataURL(file);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop: Crop = {
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };
    setCrop(crop);
    
    // Auto-generate base64 with default settings
    setTimeout(() => {
      generateBase64WithoutCrop();
    }, 100);
  };

  const generateBase64WithoutCrop = () => {
    if (!imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast.error('Failed to create canvas context');
      return;
    }

    // Get target dimensions
    let targetWidth: number;
    let targetHeight: number;

    if (sizeMode === 'preset') {
      const preset = SIZE_PRESETS.find(p => p.label === selectedPreset);
      targetWidth = preset?.width || 128;
      targetHeight = preset?.height || 128;
    } else {
      targetWidth = parseInt(customWidth) || 300;
      targetHeight = parseInt(customHeight) || 300;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.imageSmoothingQuality = 'high';

    // Use the entire image
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const base64 = canvas.toDataURL('image/png');
    setOutputBase64(base64);
    toast.success('Base64 generated successfully!');
  };

  const generateBase64 = useCallback(() => {
    if (!imgRef.current) {
      toast.error('Please select an image');
      return;
    }

    // If no crop is set, use the whole image
    if (!completedCrop) {
      generateBase64WithoutCrop();
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast.error('Failed to create canvas context');
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Get target dimensions
    let targetWidth: number;
    let targetHeight: number;

    if (sizeMode === 'preset') {
      const preset = SIZE_PRESETS.find(p => p.label === selectedPreset);
      targetWidth = preset?.width || 128;
      targetHeight = preset?.height || 128;
    } else {
      targetWidth = parseInt(customWidth) || 300;
      targetHeight = parseInt(customHeight) || 300;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Calculate source dimensions from crop
    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const base64 = canvas.toDataURL('image/png');
    setOutputBase64(base64);
    toast.success('Base64 generated successfully!');
  }, [completedCrop, sizeMode, selectedPreset, customWidth, customHeight]);

  const copyToClipboard = () => {
    // Fallback method for environments where Clipboard API is blocked
    const textArea = document.createElement('textarea');
    textArea.value = outputBase64;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      // Try the modern API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(outputBase64).then(() => {
          setCopied(true);
          toast.success('Copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          // Fallback to execCommand
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
          } else {
            toast.error('Failed to copy. Please copy manually.');
          }
        });
      } else {
        // Use execCommand fallback
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          toast.success('Copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast.error('Failed to copy. Please copy manually.');
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy. Please copy manually.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `converted-${Date.now()}.png`;
    link.href = outputBase64;
    link.click();
    toast.success('Image downloaded!');
  };

  const resetAll = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setOutputBase64('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processImageFile(blob);
            toast.success('Image pasted successfully!');
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <div
      className="h-full overflow-y-auto bg-bg p-4 md:p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toaster />
      
      {/* Full-screen drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-brand/10 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface rounded-lg shadow-2xl p-12 border-4 border-dashed border-brand">
            <Upload className="w-24 h-24 mx-auto mb-4 text-brand" />
            <p className="text-2xl font-semibold text-text-primary">Drop image here</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-text-primary">Image Converter</h1>
          <p className="text-text-dim">Upload, crop, resize, and convert images to base64 format</p>
          <p className="text-sm text-text-dim mt-2">
            Drag and drop anywhere • Press <kbd className="px-2 py-1 bg-surface-2 border border-border-subtle rounded text-xs font-mono text-text-primary">Ctrl+V</kbd> to paste
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Upload and Crop */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Upload Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center hover:border-brand transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-text-dim" />
                    <p className="text-sm text-text-dim mb-2">
                      Click to upload or drag and drop anywhere
                    </p>
                    <p className="text-xs text-text-dim">
                      PNG, JPG, GIF, WebP supported
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="hidden"
                  />
                  {imgSrc && (
                    <Button onClick={resetAll} variant="outline" className="w-full">
                      Clear Image
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {imgSrc && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Crop Image (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => {
                        const img = imgRef.current;
                        if (lockCenter && img) {
                          setCrop({ ...c, x: (img.width - c.width) / 2, y: (img.height - c.height) / 2 });
                        } else {
                          setCrop(c);
                        }
                      }}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={maintainAspect ? 1 : undefined}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop preview"
                        src={imgSrc}
                        onLoad={onImageLoad}
                        className="max-w-full h-auto"
                      />
                    </ReactCrop>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="aspect"
                          checked={maintainAspect}
                          onChange={(e) => setMaintainAspect(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="aspect" className="cursor-pointer">
                          Maintain square aspect ratio
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="lockCenter"
                          checked={lockCenter}
                          onChange={(e) => setLockCenter(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="lockCenter" className="cursor-pointer">
                          Lock to center
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Size Settings and Output */}
          <div className="space-y-6">
            {imgSrc && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>3. Select Output Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={sizeMode} onValueChange={(v) => setSizeMode(v as 'preset' | 'custom')}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="preset">Preset Sizes</TabsTrigger>
                        <TabsTrigger value="custom">Custom Size</TabsTrigger>
                      </TabsList>
                      <TabsContent value="preset" className="space-y-4">
                        <div className="space-y-2">
                          <Label>Choose Size</Label>
                          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {SIZE_PRESETS.map((preset) => (
                                <SelectItem key={preset.label} value={preset.label}>
                                  {preset.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                      <TabsContent value="custom" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="width">Width (px)</Label>
                            <Input
                              id="width"
                              type="number"
                              value={customWidth}
                              onChange={(e) => setCustomWidth(e.target.value)}
                              min="1"
                              max="4096"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="height">Height (px)</Label>
                            <Input
                              id="height"
                              type="number"
                              value={customHeight}
                              onChange={(e) => setCustomHeight(e.target.value)}
                              min="1"
                              max="4096"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <Button
                      onClick={generateBase64}
                      className="w-full mt-4"
                    >
                      Regenerate Base64
                    </Button>
                  </CardContent>
                </Card>

                {outputBase64 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>4. Base64 Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border border-border-subtle rounded-lg p-4 bg-surface-2">
                          <img
                            src={outputBase64}
                            alt="Converted preview"
                            className="max-w-full h-auto mx-auto border-2 border-border-subtle rounded"
                            style={{
                              imageRendering: 'pixelated',
                              maxHeight: '300px'
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Base64 String</Label>
                          <Textarea
                            value={outputBase64}
                            readOnly
                            className="font-mono text-xs h-32 resize-none"
                          />
                          <div className="text-xs text-text-dim">
                            Length: {outputBase64.length} characters
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={copyToClipboard}
                            variant="outline"
                            className="w-full"
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Base64
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={downloadImage}
                            variant="outline"
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Image
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!imgSrc && (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center text-text-dim py-12">
                    <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Drag and drop anywhere or click upload</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                  1
                </div>
                <h3 className="font-semibold">Upload</h3>
                <p className="text-slate-600">
                  Drag and drop anywhere on the screen or click the upload area
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                  2
                </div>
                <h3 className="font-semibold">Auto-Convert</h3>
                <p className="text-slate-600">
                  Base64 is automatically generated with default settings (128x128)
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                  3
                </div>
                <h3 className="font-semibold">Customize (Optional)</h3>
                <p className="text-slate-600">
                  Adjust crop, choose different size, and regenerate as needed
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                  4
                </div>
                <h3 className="font-semibold">Export</h3>
                <p className="text-slate-600">
                  Copy base64 to clipboard or download the converted image
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}