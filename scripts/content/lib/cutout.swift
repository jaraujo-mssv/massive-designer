// Cuts the person out of each photo with macOS's Vision framework (the same subject lift as
// Photos' "Copy Subject"): writes a raw 8-bit mask, one byte per pixel at the photo's size
// (255 = the person, 0 = the backdrop), and prints one JSON line per photo:
// {"file", "mask", "width", "height"} or {"file", "error"}. Used by scripts/team-photo/cutouts.mjs.
//
//   swift scripts/content/lib/cutout.swift photo.webp mask.gray [more.jpg more.gray …]
//
// macOS 14 or later (Vision ships with the OS; nothing to install).
import CoreVideo
import Foundation
import ImageIO
import Vision

func line(_ object: [String: Any]) {
  let data = try! JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
  print(String(data: data, encoding: .utf8)!)
}

let args = Array(CommandLine.arguments.dropFirst())
for i in stride(from: 0, to: args.count - 1, by: 2) {
  let path = args[i]
  let out = args[i + 1]
  guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    line(["file": path, "error": "can't read the image"])
    continue
  }
  let request = VNGenerateForegroundInstanceMaskRequest()
  let handler = VNImageRequestHandler(cgImage: image, options: [:])
  do {
    try handler.perform([request])
    guard let result = request.results?.first, !result.allInstances.isEmpty else {
      line(["file": path, "error": "no person found"])
      continue
    }
    // Every subject Vision finds (a person, their hat), at the photo's own size.
    let mask = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
    CVPixelBufferLockBaseAddress(mask, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(mask, .readOnly) }
    let width = CVPixelBufferGetWidth(mask)
    let height = CVPixelBufferGetHeight(mask)
    let stride = CVPixelBufferGetBytesPerRow(mask)
    let base = CVPixelBufferGetBaseAddress(mask)!
    var bytes = [UInt8](repeating: 0, count: width * height)
    // One float per pixel, 0…1.
    for y in 0..<height {
      let row = base.advanced(by: y * stride).assumingMemoryBound(to: Float32.self)
      for x in 0..<width {
        bytes[y * width + x] = UInt8(max(0, min(255, (row[x] * 255).rounded())))
      }
    }
    try Data(bytes).write(to: URL(fileURLWithPath: out))
    line(["file": path, "mask": out, "width": width, "height": height])
  } catch {
    line(["file": path, "error": error.localizedDescription])
  }
}
