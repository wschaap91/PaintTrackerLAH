import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaintTabPills from './PaintTabPills.vue'

describe('PaintTabPills', () => {
  it('active pill has accent background class', () => {
    const wrapper = mount(PaintTabPills, {
      props: { modelValue: 'owned', ownedCount: 12, wishlistCount: 3 },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].classes()).toContain('bg-accent-600')
    expect(buttons[0].classes()).not.toContain('bg-accent-600')
    expect(buttons[2].classes()).not.toContain('bg-accent-600')
  })

  it('inactive pills have white background class', () => {
    const wrapper = mount(PaintTabPills, {
      props: { modelValue: 'all', ownedCount: 5, wishlistCount: 2 },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].classes()).toContain('bg-white')
    expect(buttons[2].classes()).toContain('bg-white')
  })

  it('clicking Owned emits update:modelValue with owned', async () => {
    const wrapper = mount(PaintTabPills, {
      props: { modelValue: 'all', ownedCount: 5, wishlistCount: 2 },
    })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['owned']])
  })

  it('displays correct count in pill label', () => {
    const wrapper = mount(PaintTabPills, {
      props: { modelValue: 'all', ownedCount: 12, wishlistCount: 3 },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].text()).toBe('Owned (12)')
    expect(buttons[2].text()).toBe('Wishlist (3)')
  })

  it('zero count displays as Owned (0)', () => {
    const wrapper = mount(PaintTabPills, {
      props: { modelValue: 'all', ownedCount: 0, wishlistCount: 0 },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].text()).toBe('Owned (0)')
    expect(buttons[2].text()).toBe('Wishlist (0)')
  })
})
