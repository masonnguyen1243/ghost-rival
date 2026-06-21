import type { ILiveActivityModule } from './LiveActivityModule'

class UnsupportedPlatformError extends Error {
  constructor(method: string) {
    super(`LiveActivityModule.${method} is not supported on Android`)
    this.name = 'UnsupportedPlatformError'
  }
}

export const LiveActivityModule: ILiveActivityModule = {
  isAvailable: () => Promise.reject(new UnsupportedPlatformError('isAvailable')),
  requestPermission: () => Promise.reject(new UnsupportedPlatformError('requestPermission')),
  start: () => Promise.reject(new UnsupportedPlatformError('start')),
  update: () => Promise.reject(new UnsupportedPlatformError('update')),
  end: () => Promise.reject(new UnsupportedPlatformError('end')),
}
