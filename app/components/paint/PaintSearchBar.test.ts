import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PaintSearchBar from './PaintSearchBar.vue'

const defaultFilters = { q: '', brand: '', paintType: '' }
const brands = ['Citadel', 'Vallejo', 'Army Painter']

describe('PaintSearchBar', () => {
  it('typing in search input emits update:modelValue with updated q', async () => {
    const wrapper = mount(PaintSearchBar, {
      props: { modelValue: defaultFilters, brands },
    })
    const input = wrapper.find('input')
    await input.setValue('abaddon')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      { q: 'abaddon', brand: '', paintType: '' },
    ])
  })

  it('clicking filter icon toggles panel visibility', async () => {
    const wrapper = mount(PaintSearchBar, {
      props: { modelValue: defaultFilters, brands },
    })
    const filterButton = wrapper.find('button[aria-label="Toggle filters"]')
    expect(wrapper.find('select').exists()).toBe(false)
    await filterButton.trigger('click')
    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('selecting a brand emits update:modelValue with updated brand', async () => {
    const wrapper = mount(PaintSearchBar, {
      props: { modelValue: defaultFilters, brands },
    })
    const filterButton = wrapper.find('button[aria-label="Toggle filters"]')
    await filterButton.trigger('click')
    const brandSelect = wrapper.findAll('select')[0]
    await brandSelect.setValue('Citadel')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      { q: '', brand: 'Citadel', paintType: '' },
    ])
  })

  it('active-filter dot renders when brand is non-empty', () => {
    const wrapper = mount(PaintSearchBar, {
      props: { modelValue: { q: '', brand: 'Citadel', paintType: '' }, brands },
    })
    expect(wrapper.find('.bg-accent-600.rounded-full').exists()).toBe(true)
  })

  it('active-filter dot does NOT render when both filters are empty', () => {
    const wrapper = mount(PaintSearchBar, {
      props: { modelValue: defaultFilters, brands },
    })
    expect(wrapper.find('.bg-accent-600.rounded-full').exists()).toBe(false)
  })

  it('filter panel is hidden by default', () => {
    const wrapper = mount(PaintSearchBar, {
      props: { modelValue: defaultFilters, brands },
    })
    expect(wrapper.find('select').exists()).toBe(false)
  })
})
