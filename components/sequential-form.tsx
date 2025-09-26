"use client"

import { useEffect, useState, type ReactNode } from "react"
import type { StepConfig, SubmitPayload } from "@/types"
import { useFormStore } from "@/lib/form-store"
import { validateField } from "@/lib/validation"
import { downloadJson } from "@/lib/download-json"
import { TextInputField } from "./text-input-field"
import { SelectField } from "./select-field"
import { CheckboxGroup } from "./checkbox-group"
import { ObjectArrayField } from "./object-array-field"
import { Button } from "@/components/ui/button"
// Progress removed for simplified review-only view
import { useToast } from "@/hooks/use-toast"
import hiddenKeys from "@/lib/hidden-keys"
import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SequentialFormProps {
  steps: StepConfig[]
  initialLLMJson?: Record<string, any>
  initialValues?: Record<string, string | string[] | null>
  leftSlot?: ReactNode
}

export function SequentialForm({ steps, initialLLMJson, initialValues, leftSlot }: SequentialFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Always start and stay in review mode for this simplified version
  const [isReview, setIsReview] = useState(true)

  const { values, currentStepIndex, errors, setValue, setError, clearError, nextStep, prevStep, setCurrentStep, reset } =
    useFormStore()

  // Prefill values from initialValues once
  // Seed only for keys that are currently empty/undefined
  useEffect(() => {
    if (initialValues) {
      Object.entries(initialValues).forEach(([k, v]) => {
        setValue(k, v as any)
      })
    }
  }, [])

  // Determine dynamic visibility (gating), independent from UI hiding
  const isStepVisible = (step: StepConfig): boolean => {
    const baseVisible = step.visible !== false
    if (!baseVisible) return false
    if (step.visibleIf) {
      const depVal = values[step.visibleIf.id]
      return depVal === step.visibleIf.equals
    }
    return true
  }

  const flowSteps = steps.filter((step) => isStepVisible(step))
  const matchesHidden = (pattern: string, id: string) => {
    if (!pattern) return false
    if (id === pattern) return true
    // Prefix rule: 'foo' hides 'foo.bar'
    if (id.startsWith(pattern + '.')) return true
    // Wildcard rule: support '*' anywhere
    if (pattern.includes('*')) {
      const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      const rx = new RegExp('^' + escape(pattern).replace(/\\\*/g, '.*') + '$')
      return rx.test(id)
    }
    // Special case: allow 'parent.child' to hide 'parent.*.child' (array-of-objects fields)
    const segs = pattern.split('.')
    if (segs.length === 2) {
      const expanded = `${segs[0]}.*.${segs[1]}`
      const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      const rx = new RegExp('^' + escape(expanded).replace(/\\\*/g, '.*') + '$')
      return rx.test(id)
    }
    return false
  }
  const isHiddenInUI = (id: string) => hiddenKeys.some((p) => matchesHidden(p, id))
  const renderedSteps = flowSteps.filter((s) => !isHiddenInUI(s.id))

  if (flowSteps.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">No steps to complete.</p>
      </div>
    )
  }

  const safeIndex = Math.min(currentStepIndex, Math.max(0, flowSteps.length - 1))
  useEffect(() => {
    if (safeIndex !== currentStepIndex) {
      setCurrentStep(safeIndex)
    }
  }, [safeIndex, currentStepIndex, setCurrentStep])
  const currentStep = flowSteps[safeIndex]
  // Step progress/navigation removed in this version

  // Ensure we never stay on a hidden step: auto-skip forward else backward
  useEffect(() => {
    if (!currentStep) return
    if (!isHiddenInUI(currentStep.id)) return
    let next = safeIndex + 1
    while (next < flowSteps.length && isHiddenInUI(flowSteps[next].id)) next++
    if (next < flowSteps.length) {
      setCurrentStep(next)
      return
    }
    let prev = safeIndex - 1
    while (prev >= 0 && isHiddenInUI(flowSteps[prev].id)) prev--
    if (prev >= 0) setCurrentStep(prev)
  }, [currentStep?.id, safeIndex, flowSteps, setCurrentStep])

  // Next/step navigation removed in this version

  // Previous navigation removed in this version

  const handleAddParameterRow = () => {
    if (!currentStep || currentStep.component !== "object-array") return
    const id = currentStep.id
    const raw = values[id]
    let arr: any[] = []
    try {
      arr = raw ? JSON.parse(raw as string) : []
    } catch {
      arr = []
    }
    const fieldKeys = currentStep.fields && currentStep.fields.length > 0
      ? currentStep.fields
      : ["parameterName", "description", "mappingSource"]
    const newItem: Record<string, string> = {}
    fieldKeys.forEach((k) => (newItem[k] = ""))
    arr.push(newItem)
    setValue(id, JSON.stringify(arr, null, 2))
  }

  const handleConfirmReset = () => {
    // Reset store and bring back initialValues so the user starts fresh
    reset()
    if (initialValues) {
      Object.entries(initialValues).forEach(([k, v]) => setValue(k, v as any))
    }
    setIsReview(false)
    setCurrentStep(0)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Final strict validation of all required, editable, visible steps
      const blockingSteps = flowSteps.filter((s) => s.required && !s.readOnly && !isHiddenInUI(s.id))
      let hasErrors = false
      for (const s of blockingSteps) {
        // Reuse the same validation logic as Next
        const val = values[s.id]
        let err: string | null = null
        if (s.component === "select" && s.allowCustom) {
          const custom = (values[`${s.id}__custom`] as string) || ""
          const hasCustom = custom.trim().length > 0
          if (!hasCustom) {
            err = validateField(val as any, "select", s.required)
            if (!err && s.options && val) {
              const ok = s.options.includes(val as string)
              err = ok ? null : "Please select a valid option"
            }
          }
        } else if (s.component === "select") {
          err = validateField(val as any, "select", s.required)
          if (!err && s.options && val) {
            const ok = s.options.includes(val as string)
            err = ok ? null : "Please select a valid option"
          }
        } else if (s.component === "checkbox") {
          err = validateField(val as any, "checkbox", s.required)
        } else if (s.component === "text") {
          err = validateField(val as any, "text", s.required)
        }
        if (err) {
          setError(s.id, err)
          hasErrors = true
        } else {
          clearError(s.id)
        }
      }

      if (hasErrors) {
        setIsReview(true)
        toast({ title: "Missing required fields", description: "Please complete all required fields before submitting.", variant: "destructive" })
        setIsSubmitting(false)
        return
      }

      // Build flat key:value payload
      const payload: SubmitPayload = {}

      steps.forEach((step) => {
        const customKey = `${step.id}__custom`
        const hasCustom = typeof values[customKey] === "string" && (values[customKey] as string).trim() !== ""
        const baseValue = values[step.id]
        let value: any = hasCustom ? (values[customKey] as string) : baseValue
        if (step.component === "object-array") {
          try {
            value = baseValue ? JSON.parse(baseValue as string) : []
          } catch {
            value = []
          }
        }
        payload[step.id] = value ?? null
      })

      // Download JSON file
      downloadJson(payload, "form-output.json")

      // POST to API
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Form saved and submitted successfully!",
        })
      } else {
        throw new Error("Failed to submit form")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    if (!currentStep) return null
    if (isHiddenInUI(currentStep.id)) return null

    const commonProps = {
      id: currentStep.id,
      title: currentStep.title,
      helpText: currentStep.helpText,
      required: currentStep.required,
      value: values[currentStep.id],
      onChange: (value: string | string[] | null) => {
        setValue(currentStep.id, value)
        clearError(currentStep.id)
      },
      error: errors[currentStep.id],
      readOnly: currentStep.readOnly,
    }

    switch (currentStep.component) {
      case "text":
        return (
          <TextInputField
            {...commonProps}
            value={values[currentStep.id] as string | null}
            onChange={(value) => setValue(currentStep.id, value)}
            autoPopulateKey={currentStep.autoPopulateKey}
            initialLLMJson={initialLLMJson}
          />
        )

      case "select":
        return (
          <SelectField
            {...commonProps}
            value={values[currentStep.id] as string | null}
            onChange={(value) => setValue(currentStep.id, value)}
            options={currentStep.options || getSelectOptions(currentStep.id)}
            allowCustom={currentStep.allowCustom}
            customValue={(values[`${currentStep.id}__custom`] as string) || ""}
            onCustomChange={(val) => setValue(`${currentStep.id}__custom`, val)}
          />
        )

      case "checkbox":
        return (
          <CheckboxGroup
            {...commonProps}
            value={values[currentStep.id] as string[] | null}
            onChange={(value) => setValue(currentStep.id, value)}
            options={currentStep.options || getCheckboxOptions()}
          />
        )

      case "object-array": {
        const jsonValue = (values[currentStep.id] as string | null) || JSON.stringify([], null, 2)
        return (
          <ObjectArrayField
            {...commonProps}
            value={jsonValue}
            onChange={(val) => setValue(currentStep.id, val)}
            fields={currentStep.fields || ["parameterName", "description", "mappingSource"]}
          />
        )
      }

      default:
        return null
    }
  }

  const renderReview = () => {
    const reviewSteps = flowSteps.filter(
      (s) => (!isHiddenInUI(s.id)) && ((s.required && !s.readOnly) || s.component === "object-array"),
    )
    const renderStep = (step: StepConfig) => {
      const commonProps = {
        id: step.id,
        title: step.title,
        helpText: step.helpText,
        required: step.required,
        value: values[step.id],
        onChange: (value: string | string[] | null) => {
          setValue(step.id, value)
          clearError(step.id)
        },
        error: errors[step.id],
        readOnly: step.readOnly,
      }
      switch (step.component) {
        case "text":
          return (
            <TextInputField
              {...commonProps}
              value={values[step.id] as string | null}
              onChange={(value) => setValue(step.id, value)}
              autoPopulateKey={step.autoPopulateKey}
              initialLLMJson={initialLLMJson}
            />
          )
        case "select":
          return (
            <SelectField
              {...commonProps}
              value={values[step.id] as string | null}
              onChange={(value) => setValue(step.id, value)}
              options={step.options || getSelectOptions(step.id)}
              allowCustom={step.allowCustom}
              customValue={(values[`${step.id}__custom`] as string) || ""}
              onCustomChange={(val) => setValue(`${step.id}__custom`, val)}
            />
          )
        case "checkbox":
          return (
            <CheckboxGroup
              {...commonProps}
              value={values[step.id] as string[] | null}
              onChange={(value) => setValue(step.id, value)}
              options={step.options || getCheckboxOptions()}
            />
          )
        case "object-array": {
          const jsonValue = (values[step.id] as string | null) || JSON.stringify([], null, 2)
          return (
            <ObjectArrayField
              {...commonProps}
              value={jsonValue}
              onChange={(val) => setValue(step.id, val)}
              fields={step.fields || ["parameterName", "description", "mappingSource"]}
            />
          )
        }
        default:
          return null
      }
    }

    return (
      <div className="space-y-6">
        {reviewSteps.map((s) => (
          <div key={s.id} className="border rounded-xl p-4">
            {renderStep(s)}
          </div>
        ))}
      </div>
    )
  }

  // Demo options - in real app these would come from props or config
  const getSelectOptions = (stepId: string) => {
    return ["Option A", "Option B", "Option C", "Option D"]
  }

  const getCheckboxOptions = () => {
    return ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta"]
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Progress indicator removed */}

      {/* Review-only view */}
      {leftSlot && (
        <div className="pt-2">{leftSlot}</div>
      )}
      <div className="min-h-[200px]">{renderReview()}</div>

      {/* Upload slot is shown above for convenience in this version */}

      {/* Review navigation (no Back/Previous) */}
      <motion.div
        key={`nav-review`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex items-center justify-center pt-6 gap-3"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="default" className="w-36">Reset</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset this form?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all data you’ve entered and take you back to the start. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={handleSubmit} disabled={isSubmitting} size="default" className="w-36">
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </motion.div>
    </div>
  )
}
