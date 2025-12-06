import Foundation
import AVFoundation
import React

@objc(SoundPlayer)
class SoundPlayer: NSObject, RCTBridgeModule {
  private var audioPlayer: AVAudioPlayer?
  
  static func moduleName() -> String! {
    return "SoundPlayer"
  }
  
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func playSound(_ filename: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Try with full filename first, then without extension
    var path = Bundle.main.path(forResource: filename, ofType: nil)
    
    if path == nil {
      // Try without extension
      let nameWithoutExt = (filename as NSString).deletingPathExtension
      let ext = (filename as NSString).pathExtension
      path = Bundle.main.path(forResource: nameWithoutExt, ofType: ext.isEmpty ? nil : ext)
    }
    
    guard let filePath = path else {
      rejecter("FILE_NOT_FOUND", "Sound file \(filename) not found in bundle. Make sure it's added to Xcode project.", nil)
      return
    }
    
    let url = URL(fileURLWithPath: filePath)
    
    do {
      // Configure audio session
      try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
      try AVAudioSession.sharedInstance().setActive(true)
      
      // Create and play sound
      audioPlayer = try AVAudioPlayer(contentsOf: url)
      audioPlayer?.prepareToPlay()
      audioPlayer?.play()
      
      resolver(true)
    } catch {
      rejecter("PLAYBACK_ERROR", "Failed to play sound: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func stopSound(_ resolve: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    audioPlayer?.stop()
    resolve(true)
  }
}

