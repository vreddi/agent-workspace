import { Button } from '@org/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@org/ui/components/card'
import { Input } from '@org/ui/components/input'
import { Label } from '@org/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@org/ui/components/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui/components/select'
import { Separator } from '@org/ui/components/separator'
import { Slider } from '@org/ui/components/slider'
import { Switch } from '@org/ui/components/switch'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@org/ui/components/tabs'
import { cn } from '@org/ui/lib/utils'
import { useId, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { AppShell } from '~/components/today/app-shell'

const ACCENTS = [
  { value: '#2b6ef5', label: 'Blue' },
  { value: '#7b5cf6', label: 'Violet' },
  { value: '#16a34a', label: 'Green' },
  { value: '#e25151', label: 'Red' },
  { value: '#0a0a0a', label: 'Ink' },
]

/**
 * Settings surface for logged-in users. Theme setting persists to backend;
 * other controls hold local state. Grouped into Appearance / Account /
 * Notifications / Tasks tabs, built entirely from shared shadcn primitives
 * for consistent a11y.
 */
export function SettingsPage() {
  const currentUser = useQuery(api.users.current)
  const themeInitial = (currentUser?.theme ?? 'system') as
    'light' | 'dark' | 'system'

  return (
    <AppShell>
      <div className="t-page-head">
        <h1>Settings</h1>
      </div>
      <main className="px-3 pb-16 pt-4">
        <div className="mx-auto max-w-3xl">
          <p className="mb-6 text-sm text-muted-foreground">
            Manage how Agent Workspace looks, how your account is set up, and
            how your agents keep you in the loop.
          </p>
          <Tabs defaultValue="appearance">
            <TabsList className="mb-6 flex w-full flex-wrap justify-start">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-6">
              <AppearanceSettings themeInitial={themeInitial} />
            </TabsContent>
            <TabsContent value="account" className="space-y-6">
              <AccountSettings />
            </TabsContent>
            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="tasks" className="space-y-6">
              <TaskSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AppShell>
  )
}

/** A labelled row: title + helper text on the left, control on the right. */
function SettingRow({
  title,
  description,
  htmlFor,
  children,
  className,
}: {
  title: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="space-y-0.5 pr-4">
        <Label
          htmlFor={htmlFor}
          className="text-sm font-medium text-foreground"
        >
          {title}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function AppearanceSettings({
  themeInitial,
}: {
  themeInitial: 'light' | 'dark' | 'system'
}) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(themeInitial)
  const [accent, setAccent] = useState(ACCENTS[0]!.value)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [compact, setCompact] = useState(false)
  const updateTheme = useMutation(api.users.updateTheme)

  const handleThemeChange = async (newTheme: string) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') {
      return
    }
    setTheme(newTheme)
    try {
      await updateTheme({ theme: newTheme })
    } catch (error) {
      console.error('Failed to update theme:', error)
      setTheme(themeInitial)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Personalize the look and feel of your village and dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <div className="pb-4">
          <Label className="mb-3 block text-sm font-medium">Theme</Label>
          <RadioGroup
            value={theme}
            onValueChange={handleThemeChange}
            className="grid-cols-3 gap-3"
          >
            {(
              [
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ] as const
            ).map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`theme-${opt.value}`}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition hover:border-ring',
                  theme === opt.value && 'border-ring bg-muted/50',
                )}
              >
                <RadioGroupItem id={`theme-${opt.value}`} value={opt.value} />
                <span className="text-sm font-medium">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <SettingRow
          title="Accent color"
          description="Used for highlights, links, and your agents' markers."
        >
          <div className="flex items-center gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-label={c.label}
                aria-pressed={accent === c.value}
                onClick={() => setAccent(c.value)}
                style={{ background: c.value }}
                className={cn(
                  'size-6 rounded-full ring-offset-2 ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  accent === c.value && 'ring-2 ring-ring',
                )}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow
          title="Reduce motion"
          description="Minimize agent wandering and transition animations."
          htmlFor="reduce-motion"
        >
          <Switch
            id="reduce-motion"
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
          />
        </SettingRow>

        <SettingRow
          title="Compact mode"
          description="Tighten spacing to fit more on screen."
          htmlFor="compact-mode"
        >
          <Switch
            id="compact-mode"
            checked={compact}
            onCheckedChange={setCompact}
          />
        </SettingRow>
      </CardContent>
    </Card>
  )
}

function AccountSettings() {
  const nameId = useId()
  const emailId = useId()
  const currentPwId = useId()
  const newPwId = useId()
  const confirmPwId = useId()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            How you appear across your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Display name</Label>
            <Input id={nameId} defaultValue="Ash Ketchum" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              defaultValue="you@example.com"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Your email is managed by your sign-in provider.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="button">Save profile</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Choose a strong password you don't use elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={currentPwId}>Current password</Label>
            <Input id={currentPwId} type="password" autoComplete="off" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor={newPwId}>New password</Label>
            <Input id={newPwId} type="password" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={confirmPwId}>Confirm new password</Label>
            <Input id={confirmPwId} type="password" autoComplete="off" />
          </div>
          <div className="flex justify-end">
            <Button type="button">Update password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all of its data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive">
            Delete account
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

function NotificationSettings() {
  const [email, setEmail] = useState(true)
  const [push, setPush] = useState(false)
  const [digest, setDigest] = useState(true)
  const [mentions, setMentions] = useState(true)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Decide when and how your agents reach out to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <SettingRow
          title="Email notifications"
          description="Task reminders and updates sent to your inbox."
          htmlFor="notify-email"
        >
          <Switch
            id="notify-email"
            checked={email}
            onCheckedChange={setEmail}
          />
        </SettingRow>
        <SettingRow
          title="Push notifications"
          description="Real-time alerts on this device."
          htmlFor="notify-push"
        >
          <Switch id="notify-push" checked={push} onCheckedChange={setPush} />
        </SettingRow>
        <SettingRow
          title="Daily digest"
          description="A morning summary of what's due today."
          htmlFor="notify-digest"
        >
          <Switch
            id="notify-digest"
            checked={digest}
            onCheckedChange={setDigest}
          />
        </SettingRow>
        <SettingRow
          title="Agent mentions"
          description="When an agent files or assigns a task to you."
          htmlFor="notify-mentions"
        >
          <Switch
            id="notify-mentions"
            checked={mentions}
            onCheckedChange={setMentions}
          />
        </SettingRow>
        <SettingRow
          title="Quiet hours"
          description="Pause push notifications during these hours."
        >
          <div className="flex items-center gap-2">
            <Select defaultValue="22">
              <SelectTrigger
                className="w-[88px]"
                aria-label="Quiet hours start"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">to</span>
            <Select defaultValue="7">
              <SelectTrigger className="w-[88px]" aria-label="Quiet hours end">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SettingRow>
      </CardContent>
    </Card>
  )
}

function TaskSettings() {
  const [autoArchive, setAutoArchive] = useState(true)
  const [showAgents, setShowAgents] = useState(true)
  const [lead, setLead] = useState([30])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task management</CardTitle>
        <CardDescription>
          Defaults applied to new tasks and your planning views.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        <SettingRow
          title="Default landing view"
          description="Where you start each time you open the app."
        >
          <Select defaultValue="today">
            <SelectTrigger
              className="w-[160px]"
              aria-label="Default landing view"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tasks">Tasks</SelectItem>
              <SelectItem value="day">Day view</SelectItem>
              <SelectItem value="goals">Goals</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          title="Default priority"
          description="Priority assigned to a task when you don't pick one."
        >
          <Select defaultValue="medium">
            <SelectTrigger className="w-[160px]" aria-label="Default priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          title="Week starts on"
          description="First day of the week in your calendar views."
        >
          <Select defaultValue="mon">
            <SelectTrigger className="w-[160px]" aria-label="Week starts on">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sun">Sunday</SelectItem>
              <SelectItem value="mon">Monday</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <div className="py-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Reminder lead time</Label>
              <p className="text-sm text-muted-foreground">
                How far ahead of a deadline your agents nudge you.
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
              {lead[0]} min
            </span>
          </div>
          <Slider
            value={lead}
            onValueChange={setLead}
            min={0}
            max={120}
            step={15}
            aria-label="Reminder lead time in minutes"
          />
        </div>
        <SettingRow
          title="Auto-archive completed tasks"
          description="Move done tasks out of your lists after 7 days."
          htmlFor="auto-archive"
        >
          <Switch
            id="auto-archive"
            checked={autoArchive}
            onCheckedChange={setAutoArchive}
          />
        </SettingRow>
        <SettingRow
          title="Show AI agents"
          description="Display your agents wandering the village map."
          htmlFor="show-agents"
        >
          <Switch
            id="show-agents"
            checked={showAgents}
            onCheckedChange={setShowAgents}
          />
        </SettingRow>
      </CardContent>
    </Card>
  )
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${((i + 11) % 12) + 1} ${i < 12 ? 'AM' : 'PM'}`,
}))
