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
    <main className="min-h-screen bg-background pt-12 pb-24">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center items-stretch gap-4">
            <img
              src="/amex_logo.svg"
              alt="American Express logo"
              className="h-10 w-auto self-center"
            />
            <span aria-hidden className="w-px bg-[#006fcf] mx-1" />
            <h1 className="text-2xl font-bold text-[#006fcf] leading-tight text-left">
              <span className="block">Communications</span>
              <span className="block">Template Mapper</span>
            </h1>
          </div>
          
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

      {/* Fixed bottom label */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center whitespace-nowrap overflow-x-auto py-2">
            Some steps are missing as they contain sensitive data and are hidden from the user. They will be visible once you export.
          </p>
        </div>
      </div>
    </main>
  )
}
