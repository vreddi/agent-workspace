import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@org/ui/components/tabs'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="pt-4 text-sm">
        Manage your account details here.
      </TabsContent>
      <TabsContent value="password" className="pt-4 text-sm">
        Change your password here.
      </TabsContent>
      <TabsContent value="notifications" className="pt-4 text-sm">
        Configure how you get notified.
      </TabsContent>
    </Tabs>
  ),
}
