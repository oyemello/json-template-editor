import { create } from "zustand"
import type { FormState } from "@/types"

interface FormStore extends FormState {
  setValue: (id: string, value: string | string[] | null) => void
  setError: (id: string, error: string) => void
  clearError: (id: string) => void
  nextStep: () => void
  prevStep: () => void
  setCurrentStep: (index: number) => void
  reset: () => void
}

export const useFormStore = create<FormStore>((set, get) => ({
  values: {},
  currentStepIndex: 0,
  errors: {},

  setValue: (id, value) =>
    set((state) => ({
      values: { ...state.values, [id]: value },
    })),

  setError: (id, error) =>
    set((state) => ({
      errors: { ...state.errors, [id]: error },
    })),

  clearError: (id) =>
    set((state) => {
      const newErrors = { ...state.errors }
      delete newErrors[id]
      return { errors: newErrors }
    }),

  nextStep: () =>
    set((state) => ({
      currentStepIndex: state.currentStepIndex + 1,
    })),

  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(0, state.currentStepIndex - 1),
    })),

  setCurrentStep: (index) => set({ currentStepIndex: index }),

  reset: () =>
    set({
      values: {},
      currentStepIndex: 0,
      errors: {},
    }),
}))
