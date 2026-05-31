import type { Meta, StoryObj } from '@storybook/vue3'
import PaintCardCompact from './PaintCardCompact.vue'

const meta: Meta<typeof PaintCardCompact> = {
  title: 'Paint/PaintCardCompact',
  component: PaintCardCompact,
}

export default meta
type Story = StoryObj<typeof PaintCardCompact>

export const Default: Story = {
  args: {
    paint: {
      _id: '1',
      name: 'Mephiston Red',
      brand: 'Citadel',
      hexColor: '#9B1115',
      paintType: 'base',
    },
  },
}

export const Owned: Story = {
  args: {
    paint: {
      _id: '2',
      name: 'Abaddon Black',
      brand: 'Citadel',
      hexColor: '#231F20',
      paintType: 'base',
      status: 'owned',
    },
  },
}

export const Wishlisted: Story = {
  args: {
    paint: {
      _id: '3',
      name: 'Retributor Armour',
      brand: 'Citadel',
      hexColor: '#C39E3E',
      paintType: 'base',
      status: 'wishlist',
    },
  },
}

export const RunningLow: Story = {
  args: {
    paint: {
      _id: '4',
      name: 'Nuln Oil',
      brand: 'Citadel',
      hexColor: '#14100E',
      paintType: 'shade',
      status: 'running_low',
    },
  },
}

export const UnknownBrand: Story = {
  args: {
    paint: {
      _id: '5',
      name: 'Custom Paint',
      brand: 'Homebrew',
      hexColor: '#FF5733',
      paintType: 'base',
    },
  },
}

export const NullHexColor: Story = {
  args: {
    paint: {
      _id: '6',
      name: 'Mystery Paint',
      brand: 'Vallejo',
      hexColor: null,
      paintType: 'layer',
    },
  },
}
