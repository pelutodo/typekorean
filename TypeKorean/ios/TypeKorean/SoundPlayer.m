#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SoundPlayer, NSObject)

RCT_EXTERN_METHOD(playSound:(NSString *)filename
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopSound:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end

