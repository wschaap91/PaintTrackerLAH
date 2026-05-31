import type { Meta, StoryObj } from '@storybook/vue3'
import ColorSwatch from './ColorSwatch.vue'

const meta: Meta<typeof ColorSwatch> = {
  title: 'UI/ColorSwatch',
  component: ColorSwatch,
  argTypes: {
    color: { control: 'color' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}

export default meta
type Story = StoryObj<typeof ColorSwatch>

export const Small: Story = {
  args: { color: '#1D4ED8', size: 'sm' },
}

export const Medium: Story = {
  args: { color: '#DC2626' },
}

export const Large: Story = {
  args: { color: '#16A34A', size: 'lg' },
}
