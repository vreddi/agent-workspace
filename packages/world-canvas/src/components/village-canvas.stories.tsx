import type { Meta, StoryObj } from '@storybook/react-vite'

import { artMoodAt } from '@worldkit/lighting'
import { makeBoroughScene } from '../demo/the-borough'
import { VillageCanvas } from './village-canvas'

const meta: Meta<typeof VillageCanvas> = {
  title: 'World/VillageCanvas',
  component: VillageCanvas,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    // The residents wander randomly; snapshots would always differ.
    chromatic: { disableSnapshot: true },
  },
}
export default meta

type Story = StoryObj<typeof VillageCanvas>

/**
 * The Borough on the live lighting engine — three agents living in their
 * cottages, wandering, chatting when they meet. Click a monster to talk to it;
 * advance the dialogue with a click or Enter/Space. Each story fixes an hour;
 * the scene is baked in the matching art mood ({@link artMoodAt}) and the
 * canvas grades it — ambient tint, cast shadows, lamp glow — for that hour.
 */
export const BoroughNoon: Story = {
  args: {
    scene: makeBoroughScene(artMoodAt(12)),
    zoom: 2,
    hour: 12,
  },
  argTypes: {
    zoom: { control: { type: 'range', min: 1, max: 3, step: 1 } },
  },
}

/** Golden hour: long warm cast shadows just before the lamps wake. */
export const BoroughGoldenHour: Story = {
  args: {
    scene: makeBoroughScene(artMoodAt(17.2)),
    zoom: 2,
    hour: 17.2,
  },
}

/** Dusk: the sky cools, windows and lamps beginning to glow. */
export const BoroughDusk: Story = {
  args: {
    scene: makeBoroughScene(artMoodAt(18.8)),
    zoom: 2,
    hour: 18.8,
  },
}

/** Night: indigo ambient, warm lamp and window light, fireflies by the pond. */
export const BoroughNight: Story = {
  args: {
    scene: makeBoroughScene(artMoodAt(22)),
    zoom: 2,
    hour: 22,
  },
}
