import { LiveActivityModule } from './LiveActivityModule.android'

describe('LiveActivityModule.android (stub)', () => {
  it.each(['isAvailable', 'requestPermission', 'start', 'update', 'end'])(
    '%s rejects with UnsupportedPlatformError',
    async (method) => {
      await expect((LiveActivityModule as any)[method]()).rejects.toMatchObject({
        name: 'UnsupportedPlatformError',
        message: expect.stringContaining('Android'),
      })
    }
  )
})
