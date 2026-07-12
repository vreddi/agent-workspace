import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@org/ui/components/select'
import { SpriteActor, type SpriteSheet } from '@worldkit/sprite-actor'
import { useMutation, useQuery } from 'convex/react'
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useUploadThing } from '~/lib/uploadthing'
import { Nav } from '../today/nav'
import { todayStyles } from '../today/styles'
import { loadTweaks } from '../today/tweaks'
import {
  DEFAULT_MODEL_ID,
  MODEL_OPTIONS,
  MODEL_PROVIDERS,
  modelById,
} from './models'
import { ProviderLogo } from './provider-icons'
import { STUB_SPRITES, customSheet, stubSheet } from './sprites'
import { agentStyles } from './styles'

type SpriteChoice =
  | { kind: 'stub'; stubId: string }
  | { kind: 'custom'; sheetUrl: string }

/**
 * Resolve an uploaded sheet image into a playable SpriteSheet by measuring
 * it: frames are assumed square (frame size = image height), the full strip
 * loops as idle.
 */
function useCustomSheet(sheetUrl: string | null): SpriteSheet | null {
  const [sheet, setSheet] = useState<SpriteSheet | null>(null)
  useEffect(() => {
    if (!sheetUrl) {
      setSheet(null)
      return
    }
    let alive = true
    const img = new Image()
    img.onload = () => {
      if (!alive) return
      const frameSize = Math.max(1, img.naturalHeight)
      const frames = Math.max(1, Math.round(img.naturalWidth / frameSize))
      setSheet(customSheet(sheetUrl, frameSize, frames))
    }
    img.src = sheetUrl
    return () => {
      alive = false
    }
  }, [sheetUrl])
  return sheet
}

function sheetForChoice(
  choice: SpriteChoice | null,
  custom: SpriteSheet | null,
): SpriteSheet | null {
  if (!choice) return null
  if (choice.kind === 'stub') return stubSheet(choice.stubId)
  return custom
}

/** Integer scale that fits a sheet's frame into the given box size. */
function fitScale(sheet: SpriteSheet, box: number): number {
  return Math.max(
    1,
    Math.floor(box / Math.max(sheet.frameWidth, sheet.frameHeight)),
  )
}

function AgentSprite({
  sheet,
  box,
  action,
}: {
  sheet: SpriteSheet
  box: number
  action?: 'idle' | 'walk'
}) {
  return (
    <SpriteActor
      sheet={sheet}
      action={action ?? 'idle'}
      scale={fitScale(sheet, box)}
    />
  )
}

function SpritePicker({
  choice,
  onChoose,
  customUrl,
  customPreview,
  uploading,
  onPickFile,
}: {
  choice: SpriteChoice | null
  onChoose: (next: SpriteChoice) => void
  customUrl: string | null
  customPreview: SpriteSheet | null
  uploading: boolean
  onPickFile: () => void
}) {
  return (
    <div className="ag-sprites" role="radiogroup" aria-label="Sprite">
      {STUB_SPRITES.map((stub) => {
        const selected = choice?.kind === 'stub' && choice.stubId === stub.id
        return (
          <button
            key={stub.id}
            type="button"
            className="ag-sprite-tile"
            data-selected={selected}
            onClick={() => onChoose({ kind: 'stub', stubId: stub.id })}
            aria-label={`${stub.label} sprite`}
          >
            <span className="ag-sprite-tile__stage">
              <AgentSprite
                sheet={stub.sheet}
                box={64}
                action={selected ? 'walk' : 'idle'}
              />
            </span>
            <span className="ag-sprite-tile__name">{stub.label}</span>
          </button>
        )
      })}
      <button
        type="button"
        className="ag-sprite-tile ag-sprite-tile--upload"
        data-selected={choice?.kind === 'custom'}
        onClick={() => {
          if (customUrl && !uploading) {
            onChoose({ kind: 'custom', sheetUrl: customUrl })
          }
          onPickFile()
        }}
        aria-label="Upload a sprite sheet"
      >
        <span className="ag-sprite-tile__stage">
          {customPreview ? (
            <AgentSprite
              sheet={customPreview}
              box={64}
              action={choice?.kind === 'custom' ? 'walk' : 'idle'}
            />
          ) : (
            <span className="ag-sprite-tile__plus">
              {uploading ? '…' : '＋'}
            </span>
          )}
        </span>
        <span className="ag-sprite-tile__name">
          {uploading ? 'Uploading' : customPreview ? 'Yours' : 'Upload'}
        </span>
      </button>
    </div>
  )
}

function Composer({
  onClose,
  onCreated,
  dismissable,
}: {
  onClose: () => void
  onCreated: () => void
  dismissable: boolean
}) {
  const createAgent = useMutation(api.agents.create)
  const [name, setName] = useState('')
  const [personality, setPersonality] = useState('')
  const [model, setModel] = useState(DEFAULT_MODEL_ID)
  const [choice, setChoice] = useState<SpriteChoice | null>({
    kind: 'stub',
    stubId: STUB_SPRITES[0]!.id,
  })
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const nameRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const { startUpload, isUploading } = useUploadThing('agentSprite', {
    onClientUploadComplete: (res) => {
      const url = res[0]?.serverData?.url ?? res[0]?.ufsUrl
      if (url) {
        setCustomUrl(url)
        setChoice({ kind: 'custom', sheetUrl: url })
      }
    },
    onUploadError: (e) => setError(e.message),
  })

  const customPreview = useCustomSheet(customUrl)
  const previewSheet = sheetForChoice(choice, customPreview)
  const selectedModel = modelById(model)

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    void startUpload([file])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !choice || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await createAgent({
        name: trimmed,
        personality: personality.trim() || undefined,
        model,
        sprite: choice,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="ag-composer" aria-label="New agent">
      <form className="ag-composer__grid" onSubmit={handleSubmit}>
        <div className="ag-composer__form">
          <h2 className="ag-composer__title">New agent</h2>

          <div className="ag-field">
            <span className="ag-label">Sprite</span>
            <SpritePicker
              choice={choice}
              onChoose={setChoice}
              customUrl={customUrl}
              customPreview={customPreview}
              uploading={isUploading}
              onPickFile={() => fileRef.current?.click()}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFile}
            />
            <span className="ag-hint">
              Pick a built-in character or upload a horizontal strip of square
              frames (PNG, up to 4MB). It loops as the idle animation.
            </span>
          </div>

          <div className="ag-field">
            <label className="ag-label" htmlFor="agent-name">
              Name
            </label>
            <input
              id="agent-name"
              ref={nameRef}
              className="ag-input"
              value={name}
              disabled={submitting}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Scout"
            />
          </div>

          <div className="ag-field">
            <label className="ag-label" htmlFor="agent-personality">
              Personality
            </label>
            <textarea
              id="agent-personality"
              className="ag-textarea"
              value={personality}
              disabled={submitting}
              maxLength={1000}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Cheerful early bird. Files your tasks before you finish describing them and nags gently about deadlines."
            />
          </div>

          <div className="ag-field">
            <span className="ag-label" id="agent-model-label">
              Model
            </span>
            <Select
              value={model}
              onValueChange={setModel}
              disabled={submitting}
            >
              <SelectTrigger
                className="ag-select-trigger"
                aria-labelledby="agent-model-label"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {MODEL_PROVIDERS.map((provider) => (
                  <SelectGroup key={provider}>
                    <SelectLabel>{provider}</SelectLabel>
                    {MODEL_OPTIONS.filter((m) => m.provider === provider).map(
                      (m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <ProviderLogo provider={m.provider} />
                          {m.label}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <span className="ag-hint">
              {selectedModel ? `${selectedModel.blurb}. ` : ''}
              Placeholder for now: no API keys or subscriptions are connected
              yet, this just records your pick.
            </span>
          </div>

          {error && <div className="ag-error">{error}</div>}

          <div className="ag-actions">
            <button
              type="submit"
              className="ag-btn-primary"
              disabled={
                submitting || isUploading || name.trim() === '' || !previewSheet
              }
            >
              {submitting ? 'Creating…' : 'Create agent'}
            </button>
            {dismissable && (
              <button
                type="button"
                className="ag-btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <aside className="ag-preview" aria-hidden="true">
          <div className="ag-preview__stage">
            {previewSheet && (
              <AgentSprite sheet={previewSheet} box={96} action="walk" />
            )}
          </div>
          <div
            className={
              'ag-preview__name' +
              (name.trim() ? '' : ' ag-preview__name--empty')
            }
          >
            {name.trim() || 'Unnamed agent'}
          </div>
          <div className="ag-preview__model">
            {selectedModel && (
              <ProviderLogo provider={selectedModel.provider} size={12} />
            )}
            {selectedModel?.label ?? model}
          </div>
          {personality.trim() && (
            <div className="ag-preview__blurb">{personality.trim()}</div>
          )}
        </aside>
      </form>
    </section>
  )
}

function AgentRow({ agent }: { agent: Doc<'agents'> }) {
  const removeAgent = useMutation(api.agents.remove)
  const [arming, setArming] = useState(false)
  const customPreview = useCustomSheet(
    agent.sprite.kind === 'custom' ? agent.sprite.sheetUrl : null,
  )
  const sheet = sheetForChoice(agent.sprite, customPreview)
  const model = modelById(agent.model)

  useEffect(() => {
    if (!arming) return
    const id = window.setTimeout(() => setArming(false), 2500)
    return () => window.clearTimeout(id)
  }, [arming])

  return (
    <div className="ag-row">
      <div className="ag-row__stage">
        {sheet && <AgentSprite sheet={sheet} box={56} action="idle" />}
      </div>
      <div className="ag-row__info">
        <span className="ag-row__name">{agent.name}</span>
        {agent.personality && (
          <span className="ag-row__personality">{agent.personality}</span>
        )}
      </div>
      <span className="ag-model-chip">
        {model ? (
          <ProviderLogo provider={model.provider} size={13} />
        ) : (
          <span className="ag-model-chip__dot" />
        )}
        {model?.label ?? agent.model}
      </span>
      <button
        type="button"
        className="ag-row__remove"
        data-arming={arming}
        onClick={() => {
          if (!arming) {
            setArming(true)
            return
          }
          void removeAgent({ id: agent._id })
        }}
      >
        {arming ? 'Confirm remove' : 'Remove'}
      </button>
    </div>
  )
}

export function AgentsPage() {
  const agents = useQuery(api.agents.list, {})
  const [tweaks] = useState(() => loadTweaks())
  const [composerOpen, setComposerOpen] = useState(false)
  const autoOpened = useRef(false)

  // Dark mode is applied globally by useTheme() (root) via the `.dark` class,
  // which drives both shadcn tokens and the `--t-*` surfaces here.

  // First visit with an empty roster drops you straight into creation.
  useEffect(() => {
    if (agents !== undefined && agents.length === 0 && !autoOpened.current) {
      autoOpened.current = true
      setComposerOpen(true)
    }
  }, [agents])

  const sorted = useMemo(
    () =>
      (agents ?? []).slice().sort((a, b) => b._creationTime - a._creationTime),
    [agents],
  )

  return (
    <div
      className="today-root"
      data-today-theme={tweaks.theme}
      style={{ ['--t-accent-raw' as never]: tweaks.accent }}
    >
      <style>{todayStyles}</style>
      <style>{agentStyles}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
      />

      <div className="t-main">
        <Nav active="agents" />

        <div className="t-page-head">
          <h1>Agents</h1>
          {agents !== undefined && (
            <span className="t-page-head__count">
              {agents.length} agent{agents.length === 1 ? '' : 's'}
            </span>
          )}
          <span style={{ flex: 1 }} />
          {!composerOpen && (
            <button
              type="button"
              className="t-btn-create"
              onClick={() => setComposerOpen(true)}
            >
              <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>
                ＋
              </span>
              New agent
            </button>
          )}
        </div>
        <p className="ag-sub">
          Each agent gets a house in your village and, soon, a share of your
          tasks. Give it a face, a name, and a disposition.
        </p>

        {composerOpen && (
          <Composer
            onClose={() => setComposerOpen(false)}
            onCreated={() => setComposerOpen(false)}
            dismissable={sorted.length > 0}
          />
        )}

        <section className="ag-roster">
          {agents === undefined ? (
            <>
              <div className="ag-skeleton" />
              <div className="ag-skeleton" />
            </>
          ) : sorted.length === 0 ? (
            !composerOpen && (
              <div className="ag-empty">
                No agents yet. Create your first one and it will move into the
                village.
              </div>
            )
          ) : (
            sorted.map((agent) => <AgentRow key={agent._id} agent={agent} />)
          )}
        </section>
      </div>
    </div>
  )
}
