import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ThreeDotMenu from './ThreeDotMenu.vue'

describe('ThreeDotMenu', () => {
  it('clicking trigger opens dropdown', async () => {
    const wrapper = mount(ThreeDotMenu, { attachTo: document.body })
    await wrapper.find('button[aria-label="Open menu"]').trigger('click')
    expect(wrapper.find('.shadow-lg').exists()).toBe(true)
    wrapper.unmount()
  })

  it('clicking trigger again closes dropdown', async () => {
    const wrapper = mount(ThreeDotMenu, { attachTo: document.body })
    const trigger = wrapper.find('button[aria-label="Open menu"]')
    await trigger.trigger('click')
    expect(wrapper.find('.shadow-lg').exists()).toBe(true)
    await trigger.trigger('click')
    expect(wrapper.find('.shadow-lg').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clicking Import / Export emits importExport event', async () => {
    const wrapper = mount(ThreeDotMenu, { attachTo: document.body })
    await wrapper.find('button[aria-label="Open menu"]').trigger('click')
    const items = wrapper.findAll('.shadow-lg button')
    await items[0].trigger('click')
    expect(wrapper.emitted('importExport')).toHaveLength(1)
    wrapper.unmount()
  })

  it('clicking Sign out emits logout event', async () => {
    const wrapper = mount(ThreeDotMenu, { attachTo: document.body })
    await wrapper.find('button[aria-label="Open menu"]').trigger('click')
    const items = wrapper.findAll('.shadow-lg button')
    await items[1].trigger('click')
    expect(wrapper.emitted('logout')).toHaveLength(1)
    wrapper.unmount()
  })

  it('menu closes after clicking a menu item', async () => {
    const wrapper = mount(ThreeDotMenu, { attachTo: document.body })
    await wrapper.find('button[aria-label="Open menu"]').trigger('click')
    const items = wrapper.findAll('.shadow-lg button')
    await items[0].trigger('click')
    expect(wrapper.find('.shadow-lg').exists()).toBe(false)
    wrapper.unmount()
  })

  it('escape key closes menu', async () => {
    const wrapper = mount(ThreeDotMenu, { attachTo: document.body })
    await wrapper.find('button[aria-label="Open menu"]').trigger('click')
    expect(wrapper.find('.shadow-lg').exists()).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.shadow-lg').exists()).toBe(false)
    wrapper.unmount()
  })
})
