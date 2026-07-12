import { Button } from '@org/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@org/ui/components/popover'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 48 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div style={{ display: 'grid', gap: 4 }}>
          <p style={{ fontWeight: 600 }}>Dimensions</p>
          <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
            Set the dimensions for the layer.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
