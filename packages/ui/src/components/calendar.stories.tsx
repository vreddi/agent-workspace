import { useState } from 'react'
import { Calendar } from '@org/ui/components/calendar'
import { Button } from '@org/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@org/ui/components/popover'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
} satisfies Meta<typeof Calendar>

export default meta

type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 6, 15))
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-lg border shadow-xs"
      />
    )
  },
}

export const FutureOnly: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(undefined)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={{ before: today }}
        className="rounded-lg border shadow-xs"
      />
    )
  },
}

export const InPopover: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(undefined)
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {date ? date.toLocaleDateString() : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} autoFocus />
        </PopoverContent>
      </Popover>
    )
  },
}
