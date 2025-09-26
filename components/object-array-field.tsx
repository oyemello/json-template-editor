"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import type { ObjectArrayFieldProps } from "@/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusIcon } from 'lucide-react'
import { humanizeSegment } from "@/lib/humanize"
import hiddenKeys from "@/lib/hidden-keys"

type Item = Record<string, any>

export function ObjectArrayField({ id, title, helpText, value, onChange, fields, readOnly }: ObjectArrayFieldProps) {
  const items: Item[] = useMemo(() => {
    try {
      const parsed = value ? JSON.parse(value) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [value])

  const orderedFields = useMemo(() => {
    const base = ["parameterName", "description", "mappingSource"]
    const rest = fields.filter((f) => !base.includes(f))
    return [...base, ...rest]
  }, [fields])

  const escapeRegex = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
  const patternToRegex = (p: string) => new RegExp("^" + escapeRegex(p).replace(/\\\*/g, ".*") + "$")
  const patternMatches = (pattern: string, candidate: string) => {
    if (!pattern) return false
    if (candidate === pattern) return true
    if (candidate.startsWith(pattern + ".")) return true
    if (pattern.includes("*")) return patternToRegex(pattern).test(candidate)
    // Special case: allow short form like "params.mappingSource" to match any index => params.*.mappingSource
    const parts = pattern.split(".")
    if (parts.length === 2) {
      const expanded = `${parts[0]}.*.${parts[1]}`
      return patternToRegex(expanded).test(candidate)
    }
    return false
  }
  const isFieldHidden = (fieldKey: string) => {
    const candidate = `${id}.X.${fieldKey}`
    const altCandidate = `${id}.${fieldKey}`
    return hiddenKeys.some((p) => patternMatches(p, candidate) || patternMatches(p, altCandidate))
  }

  const updateItems = (next: Item[]) => {
    onChange(JSON.stringify(next, null, 2))
  }

  const handleChange = (row: number, key: string, v: string) => {
    const copy = items.map((it) => ({ ...it }))
    if (!copy[row]) copy[row] = {}
    copy[row][key] = v
    updateItems(copy)
  }

  const removeRow = (index: number) => {
    const copy = items.slice()
    copy.splice(index, 1)
    updateItems(copy)
  }

  const addRow = () => {
    const next = items.map((it) => ({ ...it }))
    const newItem: Item = {}
    orderedFields.forEach((k) => {
      if (!isFieldHidden(k)) newItem[k] = ""
    })
    next.push(newItem)
    updateItems(next)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            {title}
          </Label>
          <Button type="button" size="icon" variant="outline" onClick={addRow} disabled={readOnly} aria-label="Add">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={`${id}-${idx}`} className="border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {orderedFields.filter((key) => !isFieldHidden(key)).map((key) => (
                <div key={`${id}-${idx}-${key}`} className="space-y-1">
                  <Label htmlFor={`${id}-${idx}-${key}`} className="text-sm font-medium">
                    {humanizeSegment(key)}
                  </Label>
                  <Input
                    id={`${id}-${idx}-${key}`}
                    type="text"
                    value={item?.[key] ?? ""}
                    onChange={(e) => handleChange(idx, key, e.target.value)}
                    disabled={readOnly}
                    className="rounded-xl"
                    placeholder={`Enter ${key}...`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => removeRow(idx)} disabled={readOnly}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Inline add (+) button provided in header above */}
    </motion.div>
  )
}
