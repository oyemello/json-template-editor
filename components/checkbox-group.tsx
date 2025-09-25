"use client"

import { motion } from "framer-motion"
import type { CheckboxGroupProps } from "@/types"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function CheckboxGroup({ id, title, helpText, required, value, onChange, options, error, readOnly }: CheckboxGroupProps) {
  const selectedValues = Array.isArray(value) ? value : []

  const handleCheckboxChange = (option: string, checked: boolean) => {
    let newValues: string[]

    if (checked) {
      newValues = [...selectedValues, option]
    } else {
      newValues = selectedValues.filter((v) => v !== option)
    }

    onChange(newValues.length > 0 ? newValues : null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="space-y-2">
        <Label className="text-base font-semibold">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
      </div>

      <div
        className={`space-y-3 p-4 rounded-xl border ${error ? "border-red-500" : "border-border"}`}
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
      >
        {options.map((option, index) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${id}-${index}`}
              checked={selectedValues.includes(option)}
              onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
              disabled={readOnly}
            />
            <Label htmlFor={`${id}-${index}`} className="text-sm font-normal cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </div>

      {error && (
        <p id={`${id}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  )
}
