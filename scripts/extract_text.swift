#!/usr/bin/env swift

import Foundation
import Vision
import ImageIO

struct OCRResult {
    let orientation: CGImagePropertyOrientation
    let lines: [(String, Float)]

    var score: Double {
        lines.reduce(0) { partial, line in
            partial + Double(line.0.count) * Double(line.1)
        }
    }
}

func recognize(_ url: URL, orientation: CGImagePropertyOrientation) throws -> OCRResult {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "DutchOSOCR", code: 1, userInfo: [
            NSLocalizedDescriptionKey: "Cannot decode image at \(url.path)"
        ])
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.minimumTextHeight = 0.01

    let handler = VNImageRequestHandler(cgImage: image, orientation: orientation)
    try handler.perform([request])

    let observations = request.results ?? []
    let lines = observations.compactMap { observation -> (String, Float)? in
        guard let candidate = observation.topCandidates(1).first else { return nil }
        return (candidate.string, candidate.confidence)
    }
    return OCRResult(orientation: orientation, lines: lines)
}

let arguments = CommandLine.arguments.dropFirst()
guard !arguments.isEmpty else {
    FileHandle.standardError.write(Data("Usage: extract_text.swift IMAGE...\n".utf8))
    exit(2)
}

let orientations: [CGImagePropertyOrientation] = [.up, .right, .down, .left]

for path in arguments {
    let url = URL(fileURLWithPath: path)
    do {
        let results = try orientations.map { try recognize(url, orientation: $0) }
        guard let best = results.max(by: { $0.score < $1.score }) else { continue }
        print("=== \(path) | orientation=\(best.orientation.rawValue) | score=\(Int(best.score)) ===")
        for (line, confidence) in best.lines {
            print(String(format: "[%.2f] %@", confidence, line))
        }
        print()
    } catch {
        FileHandle.standardError.write(Data("\(path): \(String(reflecting: error))\n".utf8))
    }
}
