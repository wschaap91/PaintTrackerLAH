import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PaintCardCompact from './PaintCardCompact.vue'

const navigateToMock = vi.fn()
vi.stubGlobal('navigateTo', navigateToMock)

const basePaint = {
  _id: 'paint-1',
  name: 'Abaddon Black',
  brand: 'Citadel',
  hexColor: '#000000',
  paintType: 'base',
  status: 'owned',
}

describe('PaintCardCompact', () => {
  it('renders paint name and brand text', () => {
    const wrapper = mount(PaintCardCompact, { props: { paint: basePaint } })
    expect(wrapper.text()).toContain('Abaddon Black')
    expect(wrapper.text()).toContain('Citadel')
  })

  it('brand label color matches getBrandColor output', () => {
    const wrapper = mount(PaintCardCompact, { props: { paint: basePaint } })
    const brandSpan = wrapper.find('span[style]')
    expect(brandSpan.attributes('style')).toContain('#1565C0')
  })

  it('checkmark icon is filled when isOwned=true', () => {
    const wrapper = mount(PaintCardCompact, { props: { paint: { ...basePaint, status: undefined }, isOwned: true } })
    const ownedButton = wrapper.find('button[aria-label="Toggle owned"]')
    expect(ownedButton.classes()).toContain('text-emerald-500')
  })

  it('heart icon is filled when isWishlisted=true', () => {
    const wrapper = mount(PaintCardCompact, { props: { paint: { ...basePaint, status: undefined }, isWishlisted: true } })
    const wishlistButton = wrapper.find('button[aria-label="Toggle wishlist"]')
    expect(wishlistButton.classes()).toContain('text-blue-500')
  })

  it('clicking checkmark emits toggleOwned with paint ID', async () => {
    const wrapper = mount(PaintCardCompact, { props: { paint: basePaint } })
    await wrapper.find('button[aria-label="Toggle owned"]').trigger('click')
    expect(wrapper.emitted('toggleOwned')).toEqual([['paint-1']])
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('clicking heart emits toggleWishlist with paint ID', async () => {
    navigateToMock.mockClear()
    const wrapper = mount(PaintCardCompact, { props: { paint: basePaint } })
    await wrapper.find('button[aria-label="Toggle wishlist"]').trigger('click')
    expect(wrapper.emitted('toggleWishlist')).toEqual([['paint-1']])
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('clicking card body calls navigateTo', async () => {
    navigateToMock.mockClear()
    const wrapper = mount(PaintCardCompact, { props: { paint: basePaint } })
    await wrapper.trigger('click')
    expect(navigateToMock).toHaveBeenCalledWith('/paints/paint-1')
  })

  it('hexColor null renders swatch without error', () => {
    const wrapper = mount(PaintCardCompact, { props: { paint: { ...basePaint, hexColor: null } } })
    expect(wrapper.html()).toContain('cccccc')
  })
})
