import type { Meta, StoryObj } from '@storybook/vue3'
import PaintSearchBar from './PaintSearchBar.vue'

const meta: Meta<typeof PaintSearchBar> = {
  title: 'Paint/PaintSearchBar',
  component: PaintSearchBar,
}

export default meta
type Story = StoryObj<typeof PaintSearchBar>

const brands = ['Citadel', 'Vallejo', 'Army Painter', 'AK Interactive', 'Scale75']

export const Default: Story = {
  args: {
    modelValue: { q: '', brand: '', paintType: '' },
    brands,
  },
}

export const WithSearchText: Story = {
  args: {
    modelValue: { q: 'abaddon', brand: '', paintType: '' },
    brands,
  },
}

export const FiltersExpanded: Story = {
  args: {
    modelValue: { q: '', brand: '', paintType: '' },
    brands,
  },
}

export const ActiveFilters: Story = {
  args: {
    modelValue: { q: '', brand: 'Citadel', paintType: '' },
    brands,
  },
}

export const ActiveBrandAndType: Story = {
  args: {
    modelValue: { q: '', brand: 'Citadel', paintType: 'base' },
    brands,
  },
}
