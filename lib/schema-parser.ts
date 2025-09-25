import JSON5 from 'json5'
import type { StepConfig } from '@/types'
import { humanizePathTitle } from '@/lib/humanize'

export interface ParsedSchemaResult {
  steps: StepConfig[]
  initialValues: Record<string, string | string[] | null>
}

// Helpers to parse guidance from inline comments
interface ParsedHints {
  component?: 'text' | 'select' | 'checkbox'
  options?: string[]
  readOnly?: boolean
  allowCustom?: boolean
  required?: boolean
  visibleIf?: { id: string; equals: string }
}

const COMMENT_KWS = {
  checkbox: /checkbox/i,
  dropdown: /dropdown/i,
  dropdownValues: /dropdown\s*values\s*:\s*([^\n]+)/i,
  checkboxValues: /checkbox\s*values\s*:\s*([^\n]+)/i,
  notForUser: /(not\s*for\s*user|not\s*visible\s*to\s*the\s*user|ignore)/i,
  optional: /optional|not used/i,
  addYourOwn: /add\s*y(?:o)?ur\s*own\s*input\s*option/i,
  visibleIf: /only\s*visible\s*if\s*([\w\.\-]+)\s*=\s*([A-Za-z0-9_\-]+)/i,
}

function parseOptionsFromList(raw?: string): string[] | undefined {
  if (!raw) return undefined
  // Take until comment-ender, split commas, trim quotes/space
  const cleaned = raw.split('//')[0]
  return cleaned
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^"|"$/g, ''))
}

function parseHintsFromComment(comment: string): ParsedHints {
  const hints: ParsedHints = {}
  if (COMMENT_KWS.checkbox.test(comment)) hints.component = 'checkbox'
  if (COMMENT_KWS.dropdown.test(comment)) hints.component = 'select'
  const ddm = COMMENT_KWS.dropdownValues.exec(comment)
  if (ddm) hints.options = parseOptionsFromList(ddm[1])
  const cbm = COMMENT_KWS.checkboxValues.exec(comment)
  if (cbm) hints.options = parseOptionsFromList(cbm[1])
  if (COMMENT_KWS.notForUser.test(comment)) hints.readOnly = true
  if (COMMENT_KWS.optional.test(comment)) hints.required = false
  if (COMMENT_KWS.addYourOwn.test(comment)) hints.allowCustom = true
  const vis = COMMENT_KWS.visibleIf.exec(comment)
  if (vis) hints.visibleIf = { id: vis[1], equals: vis[2] }
  return hints
}

// Crude line-based extractor of inline comments for top-level keys
function extractTopLevelComments(text: string): Record<string, string> {
  const comments: Record<string, string> = {}
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const idx = line.indexOf('//')
    if (idx === -1) continue
    const left = line.slice(0, idx)
    const right = line.slice(idx + 2)
    const keyMatch = left.match(/^[\s,]*["']?([A-Za-z0-9_\.]+)["']?\s*:/)
    if (keyMatch) {
      const key = keyMatch[1]
      comments[key] = (comments[key] ? comments[key] + ' ' : '') + right.trim()
    }
  }
  return comments
}

function isArrayOfStrings(arr: any[]): boolean {
  return Array.isArray(arr) && arr.every((v) => typeof v === 'string')
}

function flattenValues(obj: any, parentKey = ''): Record<string, string | string[] | null> {
  const out: Record<string, string | string[] | null> = {}
  if (obj === null || obj === undefined) return out

  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    if (Array.isArray(value)) {
      if (isArrayOfStrings(value)) {
        out[fullKey] = value as string[]
      } else if (value.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
        // store as JSON string for object-array components
        out[fullKey] = JSON.stringify(value, null, 2)
      } else {
        // arrays of primitives/mixed -> stringify
        out[fullKey] = JSON.stringify(value, null, 2)
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into objects
      Object.assign(out, flattenValues(value, fullKey))
    } else if (typeof value === 'boolean') {
      out[fullKey] = value ? 'true' : 'false'
    } else if (typeof value === 'number') {
      out[fullKey] = String(value)
    } else {
      out[fullKey] = (value ?? null) as any
    }
  })

  return out
}

function preclean(text: string): string {
  let t = text.replace(/\r\n?/g, '\n')
  // Convert partially quoted or quoted keys to unquoted keys (JSON5 friendly)
  t = t.replace(/(^|[,{\s])"([A-Za-z0-9_\.]+)"\s*:/gm, '$1$2:')
  t = t.replace(/(^|[,{\s])"([A-Za-z0-9_\.]+)\s*:/gm, '$1$2:')
  return t
}

export function parseSchemaText(text: string): ParsedSchemaResult {
  const cleaned = preclean(text)
  // Capture inline comments for hints
  const topLevelComments = extractTopLevelComments(cleaned)

  // Attempt to parse JSON/JSONC with JSON5 (comments, trailing commas)
  const data = JSON5.parse(cleaned)

  const steps: StepConfig[] = []

  function addStep(step: StepConfig) {
    // normalize defaults
    steps.push({ visible: true, required: true, ...step })
  }

  function buildForKey(key: string, value: any, parentKey?: string) {
    const id = parentKey ? `${parentKey}.${key}` : key
    const title = humanizePathTitle(parentKey, key)
    const comment = topLevelComments[parentKey ? parentKey : key] || topLevelComments[id] || ''
    const hints = parseHintsFromComment(comment)

    // Explicit special cases per user notes
    const isUserRoles = id === 'userRoles'
    const isCategory = id === 'category'
    const isCommunicationTarget = id === 'communicationTarget'
    const isCommunicationType = id === 'communicationType'

    // Determine component, options, readOnly, required
    let component: StepConfig['component'] = 'text'
    let options: string[] | undefined = undefined
    let readOnly = hints.readOnly === true
    let allowCustom = hints.allowCustom === true
    let required = hints.required !== false // default required true
    let visibleIf = hints.visibleIf

    if (isUserRoles) required = false

    if (Array.isArray(value)) {
      if (isArrayOfStrings(value)) {
        // array of strings — checkbox if hinted, otherwise checkbox by default
        component = hints.component ?? 'checkbox'
        options = hints.options ?? (value as string[])
      } else if (value.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
        // array of objects — create a single object-array step
        const allKeys = Array.from(
          value.reduce((set: Set<string>, obj: any) => {
            Object.keys(obj || {}).forEach((k) => set.add(k))
            return set
          }, new Set<string>())
        )
        // order keys: parameterName, description, mappingSource first
        const ordered = ["parameterName", "description", "mappingSource", ...allKeys.filter((k) => !["parameterName", "description", "mappingSource"].includes(k))]
        addStep({
          id,
          title,
          component: 'object-array',
          required: false,
          readOnly: false,
          visible: true,
          fields: ordered,
        })
        return
      } else {
        // mixed arrays — fallback to read-only text
        component = 'text'
        readOnly = true
      }
    } else if (typeof value === 'object' && value !== null) {
      // nested object — recurse into children (each child becomes a field)
      Object.keys(value).forEach((childKey) => buildForKey(childKey, value[childKey], id))
      return
    } else if (typeof value === 'boolean') {
      component = 'select'
      options = hints.options ?? ['true', 'false']
    } else {
      // string/number -> infer from hints; dropdown if hints say dropdown
      if (hints.component === 'select') component = 'select'
      else if (hints.component === 'checkbox') component = 'checkbox'
      else component = 'text'
      if (hints.options) options = hints.options
    }

    // Additional conditional visibility per user note
    if (isCategory || isCommunicationTarget) {
      visibleIf = { id: 'communicationType', equals: 'CCP' }
    }

    // Special handling for known keys
    if (id === 'userRoles') {
      component = 'checkbox'
      options = ['PRIMARY_APPLICANT', 'SECONDARY_APPLICANT', 'JOINT_APPLICANT', 'AUTHORIZED_USER']
      required = false
    }

    // Build step
    addStep({
      id,
      title,
      component,
      options,
      readOnly,
      allowCustom,
      required,
      visible: true,
      visibleIf,
      helpText: !readOnly && required && component !== 'object-array' ? 'Edit / add your response' : undefined,
    })
  }

  Object.keys(data).forEach((key) => buildForKey(key, (data as any)[key]))

  const initialValues = flattenValues(data)

  return { steps, initialValues }
}
