"use client"

import { motion } from "framer-motion"
import type { SelectFieldProps } from "@/types"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function SelectField({
  id,
  title,
  helpText,
  required,
  value,
  onChange,
  options,
  error,
  readOnly,
  allowCustom,
  customValue,
  onCustomChange,
}: SelectFieldProps) {
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
      </div>

      <Select value={value || ""} onValueChange={(newValue) => onChange(newValue)} disabled={readOnly}>
        <SelectTrigger
          id={id}
          className={`rounded-xl ${error ? "border-red-500 ring-red-500" : ""}`}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          disabled={readOnly}
        >
          <SelectValue placeholder={`Select ${title.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {allowCustom && (
        <div className="space-y-2 pt-1">
          <Label htmlFor={`${id}-custom`} className="text-sm font-medium">
            Add your own if required
          </Label>
          <Input
            id={`${id}-custom`}
            type="text"
            value={customValue || ""}
            onChange={(e) => onCustomChange && onCustomChange(e.target.value || null)}
            className="rounded-xl"
            placeholder={`Enter custom ${title.toLowerCase()}...`}
            disabled={readOnly}
          />
          <p className="text-xs text-muted-foreground">Optional</p>
        </div>
      )}

      {error && (
        <p id={`${id}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  )
}
