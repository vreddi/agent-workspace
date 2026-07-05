import { Button } from '@org/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@org/ui/components/card'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Personalize how the app looks.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Settings controls live here.
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button">Save</Button>
      </CardFooter>
    </Card>
  ),
}
