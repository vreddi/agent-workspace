import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useNavigate } from '@tanstack/react-router'
import type { Doc } from '@convex/_generated/dataModel'
import {
  type DisplayTask,
  type DisplayAssignee,
  TONE_STYLES,
  fmtCountdown,
  fmtDateBadge,
} from '../today/helpers'
import type {
  AnchorNodeData,
  BucketNodeData,
  DayNode,
  TaskNodeData,
} from './layout'

export function AnchorNode({
  data,
}: NodeProps<DayNode & { data: AnchorNodeData }>) {
  const isStart = data.variant === 'start'
  return (
    <div className={`d-anchor d-anchor--${data.variant}`}>
      <div className="d-anchor__halo" aria-hidden />
      <div className="d-anchor__inner">
        <div className="d-anchor__glyph">{isStart ? '☀' : '☾'}</div>
        <div className="d-anchor__text">
          <div className="d-anchor__label">{data.label}</div>
          <div className="d-anchor__sub">{data.sub}</div>
        </div>
      </div>
      {isStart ? (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
        />
      ) : (
        <Handle type="target" position={Position.Top} isConnectable={false} />
      )}
    </div>
  )
}

export function BucketNode({
  data,
}: NodeProps<DayNode & { data: BucketNodeData }>) {
  return (
    <div className="d-bucket">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="d-bucket__pulse" aria-hidden />
      <div className="d-bucket__row">
        <span className="d-bucket__label">{data.label}</span>
        <span className="d-bucket__count">{data.count}</span>
      </div>
      <div className="d-bucket__hint">{data.hint}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  )
}

function Avatar({ a }: { a: DisplayAssignee }) {
  const style = TONE_STYLES[a.tone]
  if (a.imageUrl) {
    return (
      <img className="d-avatar" src={a.imageUrl} alt={a.name} title={a.name} />
    )
  }
  return (
    <div
      className="d-avatar"
      style={{ background: style.bg, color: style.fg }}
      title={a.name}
    >
      {a.initials}
    </div>
  )
}

export function TaskNode({
  data,
}: NodeProps<DayNode & { data: TaskNodeData }>) {
  const navigate = useNavigate()
  const task: DisplayTask = data.task
  const cd = task.deadline ? fmtCountdown(task.deadline) : null
  const raw = task.raw as Doc<'tasks'>
  const status = raw.status
  const progress =
    raw.progressPercent == null
      ? null
      : Math.min(100, Math.max(0, raw.progressPercent))
  return (
    <div
      className={
        'd-task' +
        (task.overdue ? ' d-task--overdue' : '') +
        (status === 'in_progress' ? ' d-task--active' : '') +
        (data.suggested ? ' d-task--suggested' : '')
      }
      onClick={() =>
        navigate({ to: '/tasks/$taskId', params: { taskId: task.raw._id } })
      }
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          navigate({ to: '/tasks/$taskId', params: { taskId: task.raw._id } })
        }
      }}
      role="button"
      tabIndex={0}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="d-task__header">
        <div className="d-task__title">{task.title}</div>
        {data.suggested && (
          <span
            className="d-task__badge"
            title="Scheduled for later, but it fits your spare time today"
          >
            Fits today
          </span>
        )}
        {status === 'in_progress' && (
          <span
            className="d-task__pulse"
            title="In progress"
            aria-label="In progress"
          />
        )}
      </div>
      {task.body && <div className="d-task__body">{task.body}</div>}
      {progress !== null && (
        <div
          className="d-task__progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="d-task__progress-track">
            <span
              className="d-task__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </span>
          <span className="d-task__progress-num">{progress}%</span>
        </div>
      )}
      <div className="d-task__meta">
        {task.deadline ? (
          <span
            className={
              'd-task__time' + (task.overdue ? ' d-task__time--overdue' : '')
            }
          >
            {fmtDateBadge(task.deadline)}
            {cd && (
              <>
                <span className="d-task__sep" />
                <span>{task.overdue ? `${cd} late` : `in ${cd}`}</span>
              </>
            )}
          </span>
        ) : (
          <span className="d-task__time d-task__time--ghost">Anytime</span>
        )}
        <span style={{ flex: 1 }} />
        <div className="d-task__avatars">
          {task.assignees.slice(0, 3).map((a) => (
            <Avatar key={a.userId} a={a} />
          ))}
          {task.assignees.length > 3 && (
            <span className="d-task__more">+{task.assignees.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export const nodeTypes = {
  anchor: AnchorNode,
  bucket: BucketNode,
  task: TaskNode,
}
