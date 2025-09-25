"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { TextInputFieldProps } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function TextInputField({
  id,
  title,
  helpText,
  required,
  value,
  onChange,
  autoPopulateKey,
  initialLLMJson,
  error,
  readOnly,
}: TextInputFieldProps) {
  const [autoPopulate, setAutoPopulate] = useState(false)
  const [autoPopulateHint, setAutoPopulateHint] = useState<string | null>(null)

  useEffect(() => {
    if (autoPopulate && autoPopulateKey && initialLLMJson) {
      const autoValue = initialLLMJson[autoPopulateKey]
      if (autoValue && typeof autoValue === "string") {
        // Only auto-populate if field is currently empty
        if (!value || value.trim() === "") {
          onChange(autoValue)
        }
        setAutoPopulateHint(null)
      } else {
        setAutoPopulateHint("No data found for this key.")
      }
    } else {
      setAutoPopulateHint(null)
    }
  }, [autoPopulate, autoPopulateKey, initialLLMJson, value, onChange])

  const handleToggleAutoPopulate = (checked: boolean) => {
    setAutoPopulate(checked)
    if (!checked) {
      setAutoPopulateHint(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="space-y-2">
        <Label htmlFor={id} className="text-base font-semibold">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}

        {autoPopulateKey && (
          <div className="flex items-center space-x-2">
            <Switch id={`${id}-autopop`} checked={autoPopulate} onCheckedChange={handleToggleAutoPopulate} />
            <Label htmlFor={`${id}-autopop`} className="text-sm text-muted-foreground cursor-pointer">
              Auto-populate from JSON
            </Label>
          </div>
        )}

        {autoPopulateHint && <p className="text-xs text-amber-600">{autoPopulateHint}</p>}
      </div>

      <Input
        id={id}
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-xl ${error ? "border-red-500 ring-red-500" : ""}`}
        placeholder={`Enter ${title.toLowerCase()}...`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        disabled={readOnly}
      />

      {error && (
        <p id={`${id}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  )
}
