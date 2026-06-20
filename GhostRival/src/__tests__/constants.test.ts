import {
  SURFACE_BASE,
  SURFACE_RAISED,
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  GHOST_DIM,
  PR_BURST,
  BORDER_SUBTLE,
  FEEDBACK_ERROR,
  DEFAULT_REST_TIMER_SECONDS,
  MERCY_DAYS_PER_MONTH,
  GHOST_DIM_OPACITY,
  BUBBLE_SLA_MS,
  GOAL_SESSIONS_BEGINNER_MAX,
  GOAL_SESSIONS_INTERMEDIATE_MAX,
  GOAL_VELOCITY_PLATEAU_THRESHOLD,
  GOAL_MIN_INCREMENT_KG,
  GOAL_MIN_INCREMENT_LB,
} from '../constants'

describe('constants', () => {
  describe('color tokens', () => {
    it('exports all color tokens as hex or rgba strings', () => {
      expect(SURFACE_BASE).toBe('#0d0d0f')
      expect(SURFACE_RAISED).toBe('#141418')
      expect(SURFACE_OVERLAY).toBe('#1a1a22')
      expect(INK_PRIMARY).toBe('#ffffff')
      expect(INK_SECONDARY).toBe('#8888a0')
      expect(INK_DISABLED).toBe('#3a3a50')
      expect(GHOST_ACCENT).toBe('#00e5ff')
      expect(GHOST_DIM).toBe('rgba(0,229,255,0.40)')
      expect(PR_BURST).toBe('#ff6b00')
      expect(BORDER_SUBTLE).toBe('#1e1e28')
      expect(FEEDBACK_ERROR).toBe('#ff4444')
    })
  })

  describe('operational constants', () => {
    it('has correct default rest timer', () => {
      expect(DEFAULT_REST_TIMER_SECONDS).toBe(90)
    })

    it('has correct mercy days', () => {
      expect(MERCY_DAYS_PER_MONTH).toBe(2)
    })

    it('has correct ghost dim opacity', () => {
      expect(GHOST_DIM_OPACITY).toBe(0.40)
    })

    it('has correct bubble SLA', () => {
      expect(BUBBLE_SLA_MS).toBe(200)
    })
  })

  describe('goal engine thresholds', () => {
    it('has correct session counts', () => {
      expect(GOAL_SESSIONS_BEGINNER_MAX).toBe(10)
      expect(GOAL_SESSIONS_INTERMEDIATE_MAX).toBe(50)
    })

    it('has correct minimum increments', () => {
      expect(GOAL_MIN_INCREMENT_KG).toBe(0.5)
      expect(GOAL_MIN_INCREMENT_LB).toBe(1)
    })

    it('has correct plateau threshold', () => {
      expect(GOAL_VELOCITY_PLATEAU_THRESHOLD).toBe(0.005)
    })
  })
})
