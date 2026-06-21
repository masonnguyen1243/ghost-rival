import { FloatingBubbleModule } from './FloatingBubbleModule.ios'

describe('FloatingBubbleModule.ios (stub)', () => {
  it.each([
    'checkPermission',
    'openPermissionSettings',
    'show',
    'hide',
    'updateState',
    'onTap',
    'onLongPressConfirm',
    'onPermissionRevoked',
    'onSkipRest',
    'onExtendRest',
  ])('%s throws UnsupportedPlatformError', (method) => {
    let thrown: unknown
    try {
      ;(FloatingBubbleModule as any)[method]()
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeDefined()
    expect((thrown as Error).name).toBe('UnsupportedPlatformError')
    expect((thrown as Error).message).toContain('is not supported on iOS')
  })
})
