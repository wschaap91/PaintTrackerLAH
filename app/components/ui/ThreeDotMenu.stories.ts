import type { Meta, StoryObj } from '@storybook/vue3'
import ThreeDotMenu from './ThreeDotMenu.vue'

const meta: Meta<typeof ThreeDotMenu> = {
  title: 'UI/ThreeDotMenu',
  component: ThreeDotMenu,
}

export default meta
type Story = StoryObj<typeof ThreeDotMenu>

export const Closed: Story = {}

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button')
    button?.click()
  },
}
