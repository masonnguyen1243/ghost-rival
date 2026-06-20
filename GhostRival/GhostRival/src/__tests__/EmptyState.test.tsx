import { render } from '@testing-library/react-native'
import { EmptyState } from '../components/common/EmptyState'

describe('EmptyState', () => {
  it('renders headline and body text', async () => {
    const { getByText } = await render(
      <EmptyState
        headline="No exercises yet."
        body="Start a workout to create your first exercise."
      />
    )
    expect(getByText('No exercises yet.')).toBeTruthy()
    expect(getByText('Start a workout to create your first exercise.')).toBeTruthy()
  })

  it('renders default ghost icon', async () => {
    const { getByText } = await render(
      <EmptyState headline="Test" body="Test body" />
    )
    expect(getByText('👻')).toBeTruthy()
  })

  it('renders custom icon when provided', async () => {
    const { getByText } = await render(
      <EmptyState icon="🏆" headline="Test" body="Test body" />
    )
    expect(getByText('🏆')).toBeTruthy()
  })

  it('renders Home tab empty state with correct copy (AC #9)', async () => {
    const { getByText } = await render(
      <EmptyState
        headline="No exercises yet."
        body="Start a workout to create your first exercise. Your ghosts will find you once you've been here before."
      />
    )
    expect(getByText('No exercises yet.')).toBeTruthy()
    expect(
      getByText(
        "Start a workout to create your first exercise. Your ghosts will find you once you've been here before."
      )
    ).toBeTruthy()
  })
})
