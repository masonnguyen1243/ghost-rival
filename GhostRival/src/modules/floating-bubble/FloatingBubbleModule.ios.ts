import type { IFloatingBubbleModule } from './FloatingBubbleModule'

class UnsupportedPlatformError extends Error {
  constructor(method: string) {
    super(`FloatingBubbleModule.${method} is not supported on iOS`)
    this.name = 'UnsupportedPlatformError'
  }
}

export const FloatingBubbleModule: IFloatingBubbleModule = {
  checkPermission: () => { throw new UnsupportedPlatformError('checkPermission') },
  openPermissionSettings: () => { throw new UnsupportedPlatformError('openPermissionSettings') },
  show: () => { throw new UnsupportedPlatformError('show') },
  hide: () => { throw new UnsupportedPlatformError('hide') },
  updateState: () => { throw new UnsupportedPlatformError('updateState') },
  onTap: () => { throw new UnsupportedPlatformError('onTap') },
  onLongPressConfirm: () => { throw new UnsupportedPlatformError('onLongPressConfirm') },
  onPermissionRevoked: () => { throw new UnsupportedPlatformError('onPermissionRevoked') },
  onSkipRest: () => { throw new UnsupportedPlatformError('onSkipRest') },
  onExtendRest: () => { throw new UnsupportedPlatformError('onExtendRest') },
}
