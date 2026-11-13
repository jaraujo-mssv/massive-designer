// Finds faces in images with macOS's Vision framework and prints one JSON line per image:
// {"file", "width", "height", "faces": [{x, y, w, h, confidence}]}, the box in pixels from the
// top-left corner. Used by scripts/content/lib/profile.mjs for profile-picture crops.
//
//   swift scripts/content/lib/faces.swift photo.webp [more.jpg …]
//
// macOS only (Vision ships with the OS; nothing to install).
import Foundation
import ImageIO
import Vision

func line(_ object: [String: Any]) {
  let data = try! JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
  print(String(data: data, encoding: .utf8)!)
}

for path in CommandLine.arguments.dropFirst() {
  let url = URL(fileURLWithPath: path)
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else {
    line(["file": path, "error": "can't read the image"])
    continue
  }
  let width = Double(image.width)
  let height = Double(image.height)
  let request = VNDetectFaceRectanglesRequest()
  do {
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
  } catch {
    line(["file": path, "error": error.localizedDescription])
    continue
  }
  // Vision's boxes are normalised with the origin at the bottom left.
  let faces = (request.results ?? []).map { face -> [String: Double] in
    let box = face.boundingBox
    return [
      "x": box.minX * width,
      "y": (1 - box.maxY) * height,
      "w": box.width * width,
      "h": box.height * height,
      "confidence": Double(face.confidence),
    ]
  }
  line(["file": path, "width": width, "height": height, "faces": faces])
}
