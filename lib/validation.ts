export function validateField(
  value: string | string[] | null,
  type: "text" | "select" | "checkbox" | "object-array",
  required: boolean,
): string | null {
  if (!required) return null

  switch (type) {
    case "text":
      return !value || (typeof value === "string" && value.trim() === "") ? "This field is required" : null

    case "select":
      return !value || value === "" ? "Please select an option" : null

    case "checkbox":
      return !value || (Array.isArray(value) && value.length === 0) ? "Please select at least one option" : null

    default:
      return null
  }
}
