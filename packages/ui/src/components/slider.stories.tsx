import { Slider } from '@org/ui/components/slider'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: [50] },
}

export const Range: Story = {
  args: { defaultValue: [25, 75] },
}

export const Stepped: Story = {
  args: { defaultValue: [3], min: 1, max: 5, step: 1 },
}

export const Disabled: Story = {
  args: { defaultValue: [50], disabled: true },
}
