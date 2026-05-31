import type { Meta, StoryObj } from '@storybook/vue3'
import PaintTabPills from './PaintTabPills.vue'

const meta: Meta<typeof PaintTabPills> = {
  title: 'Paint/PaintTabPills',
  component: PaintTabPills,
}

export default meta
type Story = StoryObj<typeof PaintTabPills>

export const AllActive: Story = {
  args: { modelValue: 'all', ownedCount: 12, wishlistCount: 3 },
}

export const OwnedActive: Story = {
  args: { modelValue: 'owned', ownedCount: 12, wishlistCount: 3 },
}

export const WishlistActive: Story = {
  args: { modelValue: 'wishlist', ownedCount: 12, wishlistCount: 3 },
}

export const ZeroCounts: Story = {
  args: { modelValue: 'all', ownedCount: 0, wishlistCount: 0 },
}
