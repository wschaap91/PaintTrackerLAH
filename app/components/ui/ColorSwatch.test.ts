import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ColorSwatch from './ColorSwatch.vue'

describe('ColorSwatch', () => {
  it('renders with correct background color', () => {
    const wrapper = mount(ColorSwatch, { props: { color: '#FF0000' } })
    expect(wrapper.element.style.backgroundColor.toLowerCase()).toBe('#ff0000')
  })

  it('applies default (md) size class', () => {
    const wrapper = mount(ColorSwatch, { props: { color: '#000' } })
    expect(wrapper.classes()).toContain('w-10')
    expect(wrapper.classes()).toContain('h-10')
  })

  it('applies sm size class', () => {
    const wrapper = mount(ColorSwatch, { props: { color: '#000', size: 'sm' } })
    expect(wrapper.classes()).toContain('w-6')
    expect(wrapper.classes()).toContain('h-6')
  })

  it('applies lg size class', () => {
    const wrapper = mount(ColorSwatch, { props: { color: '#000', size: 'lg' } })
    expect(wrapper.classes()).toContain('w-12')
    expect(wrapper.classes()).toContain('h-12')
  })
})
