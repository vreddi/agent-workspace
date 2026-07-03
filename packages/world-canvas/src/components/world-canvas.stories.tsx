import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { cozyVillageScene } from '../demo/cozy-village';
import { WorldCanvas } from './world-canvas';

const meta: Meta<typeof WorldCanvas> = {
  title: 'World/WorldCanvas',
  component: WorldCanvas,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof WorldCanvas>;

/**
 * Just the tile map: animated water and flowers, tree canopies and roofs
 * on the overhang layer. No characters — this is the stage itself.
 */
export const MapOnly: Story = {
  args: {
    map: cozyVillageScene.map,
    tileset: cozyVillageScene.tileset,
    zoom: 2,
    animated: true,
  },
  argTypes: {
    zoom: { control: { type: 'range', min: 1, max: 3, step: 1 } },
    animated: { control: 'boolean' },
  },
};

/** Click cells to inspect the grid coordinates the canvas reports. */
export const CellPicker: Story = {
  render: (args) => {
    const [cell, setCell] = React.useState<string>('click a cell');
    return (
      <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
        <code>{cell}</code>
        <WorldCanvas
          {...args}
          onCellClick={(position) =>
            setCell(`x: ${position.x}, y: ${position.y}`)
          }
        />
      </div>
    );
  },
  args: {
    map: cozyVillageScene.map,
    tileset: cozyVillageScene.tileset,
    zoom: 2,
  },
};
