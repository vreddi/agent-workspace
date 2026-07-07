import type { Meta, StoryObj } from '@storybook/react-vite';

import { makeCozyVillageScene } from '../demo/cozy-village';
import { VillageCanvas } from './village-canvas';

const meta: Meta<typeof VillageCanvas> = {
  title: 'World/VillageCanvas',
  component: VillageCanvas,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    // The residents wander randomly; snapshots would always differ.
    chromatic: { disableSnapshot: true },
  },
};
export default meta;

type Story = StoryObj<typeof VillageCanvas>;

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
};

/** The sunlit variant: lights off, cool glass, butterflies by the pond. */
export const CozyVillageDay: Story = {
  args: {
    scene: makeCozyVillageScene('day'),
    zoom: 2,
  },
};

/** Compact view, handy for embedding in dashboards or docs. */
export const CozyVillageZoom1: Story = {
  args: {
    scene: makeCozyVillageScene('night'),
    zoom: 1,
  },
};
