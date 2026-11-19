/**
 * A logo as a transparent PNG, `width` px wide at its own proportions. It goes through an `<img>` and a
 * canvas, since `createImageBitmap` can't decode SVG; the SVG is drawn at that width, so it stays sharp.
 */
export async function svgToPng(src: string, width: number): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error(`Couldn't load ${src}`))
    el.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = Math.round((width * (img.naturalHeight || 1)) / (img.naturalWidth || 1))
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't make the PNG"))), 'image/png'),
  )
}

/**
 * Puts a PNG on the clipboard, to paste into Slides, Canva or Figma. The ClipboardItem gets the promise
 * rather than the finished PNG: Safari only allows the write inside the click.
 */
export async function copyPng(png: Promise<Blob>): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
}
