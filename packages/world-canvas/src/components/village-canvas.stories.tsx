import type { Meta, StoryObj } from '@storybook/react-vite'

import { artMoodAt } from '@worldkit/lighting'
import { makeCozyVillageScene } from '../demo/cozy-village'
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
 * The full showcase: three agents living in their pods, wandering the
 * village, chatting when they meet. Click a monster to talk to it —
 * advance the dialogue with a click or Enter/Space.
 */
export const CozyVillageNight: Story = {
  args: {
    scene: makeCozyVillageScene('night'),
    zoom: 2,
  },
  argTypes: {
    zoom: { control: { type: 'range', min: 1, max: 3, step: 1 } },
  },
}

/** The sunlit variant: lights off, cool glass, butterflies by the pond. */
export const CozyVillageDay: Story = {
  args: {
    scene: makeCozyVillageScene('day'),
    zoom: 2,
  },
}

/** Compact view, handy for embedding in dashboards or docs. */
export const CozyVillageZoom1: Story = {
  args: {
    scene: makeCozyVillageScene('night'),
    zoom: 1,
  },
}

/**
 * The verdant village on the live lighting engine. Each story fixes an hour;
 * the scene is baked in the matching art mood ({@link artMoodAt}) and the
 * canvas grades it — ambient tint, cast shadows, lamp glow — for that hour.
 */
export const VerdantNoon: Story = {
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
export const VerdantGoldenHour: Story = {
  args: {
    scene: makeBoroughScene(artMoodAt(17.2)),
    zoom: 2,
    hour: 17.2,
  },
}

/** Dusk: the sky cools, windows and lamps beginning to glow. */
export const VerdantDusk: Story = {
  args: {
    scene: makeBoroughScene(artMoodAt(18.8)),
    zoom: 2,
    hour: 18.8,
  },
}

/** Night: indigo ambient, warm lamp and window light, fireflies by the pond. */
export const VerdantNight: Story = {
  args: {
    scene: makeBoroughScene(artMoodAt(22)),
    zoom: 2,
    hour: 22,
  },
}
