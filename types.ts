export interface StepConfig {
  component: "text" | "select" | "checkbox" | "object-array"
  id: string // dotpath id is allowed (e.g., recipient.schema)
  title: string
  helpText?: string
  visible?: boolean
  required: boolean
  autoPopulateKey?: string // Only for text inputs (legacy toggle)
  // Extensions for schema-driven mode
  options?: string[] // for select/checkbox
  readOnly?: boolean // visible but not editable
  allowCustom?: boolean // select with an extra free-text input
  visibleIf?: { id: string; equals: string } // conditional visibility
  fields?: string[] // for object-array: keys to render per row
}

export type SubmitPayload = Record<string, any>

export interface FormState {
  values: Record<string, string | string[] | null>
  currentStepIndex: number
  errors: Record<string, string>
}

export interface BaseFieldProps {
  id: string
  title: string
  helpText?: string
  required: boolean
  value: string | string[] | null
  onChange: (value: string | string[] | null) => void
  error?: string
  readOnly?: boolean
}

export interface TextInputFieldProps extends BaseFieldProps {
  value: string | null
  onChange: (value: string | null) => void
  autoPopulateKey?: string
  initialLLMJson?: Record<string, any>
}

export interface SelectFieldProps extends BaseFieldProps {
  value: string | null
  onChange: (value: string | null) => void
  options: string[]
  allowCustom?: boolean
  customValue?: string | null
  onCustomChange?: (value: string | null) => void
}

export interface CheckboxGroupProps extends BaseFieldProps {
  value: string[] | null
  onChange: (value: string[] | null) => void
  options: string[]
}

export interface ObjectArrayFieldProps extends BaseFieldProps {
  // JSON string representing array of objects; null/empty => []
  value: string | null
  onChange: (value: string | null) => void
  fields: string[]
}
