"use client"

import { useEffect, useState } from "react"
import { SequentialForm } from "@/components/sequential-form"
import { Input } from "@/components/ui/input"
import type { StepConfig } from "@/types"
import { parseSchemaText } from "@/lib/schema-parser"

export default function HomePage() {
  const [steps, setSteps] = useState<StepConfig[] | null>(null)
  const [initialValues, setInitialValues] = useState<Record<string, string | string[] | null> | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load default schema.json from API on first mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/schema")
        if (!res.ok) throw new Error("Failed to load schema.json")
        const text = await res.text()
        const parsed = parseSchemaText(text)
        setSteps(parsed.steps)
        setInitialValues(parsed.initialValues)
      } catch (e: any) {
        setError(String(e?.message || e))
      }
    })()
  }, [])

  const handleFileChange = async (file?: File) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseSchemaText(text)
      setSteps(parsed.steps)
      setInitialValues(parsed.initialValues)
      setError(null)
    } catch (e: any) {
      setError("Failed to parse uploaded schema: " + String(e?.message || e))
    }
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <img
            src="/amex_logo.svg"
            alt="American Express logo"
            className="mx-auto mb-6 h-18 w-auto"
          />
          <h1 className="text-4xl font-bold mb-4 text-[#006fcf]">Communications Template Mapper</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Some steps are missing as they contain sensitive data and are hidden from the user. They will be visible once you export.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-4 text-sm text-red-600">{error}</div>
        )}

        {steps && initialValues ? (
          <SequentialForm
            steps={steps}
            initialValues={initialValues}
            leftSlot={
              <div className="flex items-center gap-3">
                <label htmlFor="schema-file" className="text-sm text-muted-foreground">
                  Load another schema (JSON/JSONC):
                </label>
                <Input
                  id="schema-file"
                  type="file"
                  accept=".json,.jsonc,.txt,.conf"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || undefined)}
                  className="max-w-xs"
                />
              </div>
            }
          />
        ) : (
          <div className="max-w-2xl mx-auto p-6 text-center text-muted-foreground">Loading schema…</div>
        )}
      </div>
    </main>
  )
}
