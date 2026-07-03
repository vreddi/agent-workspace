import type { Meta, StoryObj } from '@storybook/react-vite';

import { cozyVillageScene } from '../demo/cozy-village';
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
export const CozyVillage: Story = {
  args: {
    scene: cozyVillageScene,
    zoom: 2,
  },
  argTypes: {
    zoom: { control: { type: 'range', min: 1, max: 3, step: 1 } },
  },
};

/** Compact view, handy for embedding in dashboards or docs. */
export const CozyVillageZoom1: Story = {
  args: {
    scene: cozyVillageScene,
    zoom: 1,
  },
};
