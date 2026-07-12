import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@org/ui/components/chart'

// Stand-in for a "reduce body weight" metric: a downward series of readings
// heading toward a target line — the shape the goal metrics feature renders.
const data = [
  { at: 'Jan', weight: 198 },
  { at: 'Feb', weight: 194 },
  { at: 'Mar', weight: 191 },
  { at: 'Apr', weight: 189 },
  { at: 'May', weight: 185 },
  { at: 'Jun', weight: 182 },
]

const config = {
  weight: { label: 'Weight (lbs)', color: 'var(--chart-1)' },
} satisfies ChartConfig

function WeightTrend() {
  return (
    <div className="w-[520px] max-w-full">
      <ChartContainer config={config} className="aspect-[16/9]">
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="at"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            width={36}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ReferenceLine
            y={175}
            stroke="var(--chart-2)"
            strokeDasharray="4 4"
            label={{
              value: 'Target 175',
              position: 'insideTopRight',
              fontSize: 11,
            }}
          />
          <Line
            dataKey="weight"
            type="monotone"
            stroke="var(--color-weight)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

const meta = {
  title: 'UI/Chart',
  component: WeightTrend,
  tags: ['autodocs'],
} satisfies Meta<typeof WeightTrend>

export default meta
type Story = StoryObj<typeof meta>

export const WeightReductionTrend: Story = {}
