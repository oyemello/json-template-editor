# Sequential Form System

A schema‑driven, sequential form builder with progressive disclosure, humanized labels, comment‑aware parsing, grouped array editing, hidden‑key control, review + reset flow, and flat JSON export. Built with Next.js, React, TypeScript, Tailwind, shadcn/ui, Zustand, and Framer Motion.

## Features

- Schema‑driven parsing (JSON/JSONC with comments) from `app/json input/schema.json` or user upload
- Humanized labels (camelCase/snake_case/dot → Title Case with spaces)
- Sequential flow with validation gating and animated navigation
- Component types: text, select (supports optional custom input), checkbox, object‑array (grouped editor)
- Grouped array editor for arrays of objects (e.g., `params`, `additionalParams`) with add/remove rows
- Hidden keys list (kept in progress/export, not shown in UI)
- Conditional visibility (e.g., `category` and `communicationTarget` only if `communicationType` is `CCP`)
- Review page before submit; inline edits allowed; destructive Reset with confirmation
- Flat JSON export (key:value only; no wrapping type objects)
- Accessibility: keyboard navigation, ARIA roles, focus states

## Installation

1. Install dependencies:
`npm install`

2. Run the development server:
`npm run dev`

3. Open `http://localhost:3000`

Notes:
- Requires Node 18+ (recommended) and a modern browser.
- No Python requirements; do not use a `requirements.txt` — use `npm install`.

## Quickstart

- Clone this repo and install deps:
  - `git clone <your-fork-or-repo-url>`
  - `cd json-template-editor`
  - `npm install`
- Start the app: `npm run dev`
- Load your schema at Step 1 via the “Load another schema” file input (JSON or JSONC with comments).
- Complete the steps, review, and submit to download/POST the flat JSON.

## Schema‑Driven Configuration

The app auto‑generates steps from a JSON/JSONC schema with inline comments.

- Default schema path: `app/json input/schema.json`
- Or upload a schema at Step 1 using “Load another schema”.

Comment hints supported in the schema:
- `Dropdown` → select
- `Checkbox` → checkbox
- `Dropdown Values: A, B, C` → options for select
- `Checkbox Values: X, Y, Z` → options for checkbox
- `Not for user` → readOnly, still visible but disabled (or hide via hidden keys)
- `Only visible if communicationType = CCP` → conditional visibility
- `Dropdown + Add your own input option` → select with an extra custom text input

Special handling:
- `userRoles` is optional, options: PRIMARY_APPLICANT, SECONDARY_APPLICANT, JOINT_APPLICANT, AUTHORIZED_USER
- Arrays of objects (e.g., `params`, `additionalParams`) render as a grouped editor with add/remove rows

Hidden keys:
- Add dotpaths/wildcards to `lib/hidden-keys.ts` to hide steps/fields from UI while keeping them in progress and export.
  Examples:
  - `mappingID`
  - `recipient.*`
  - `params.*.mappingSource` (or short form `params.mappingSource`)

Example `lib/hidden-keys.ts`:

```
const hiddenKeys: string[] = [
  "_id",                 // exact key
  "recipient",           // entire subtree (recipient.*)
  "params.*.mappingSource", // hide mappingSource in all params rows
  "additionalParams.description", // short form => additionalParams.*.description
]

export default hiddenKeys
```

## Validation & Flow

- Required text: non‑empty trimmed string
- Required select: selected option must be set; if options provided, selection must be a valid option
- Select with custom input: either a valid option or a non‑empty custom value is required
- Required checkbox group: at least one option selected
- Read‑only and object‑array steps do not gate progression
- Progress bar counts hidden steps by design

## Validation Rules

- **Text fields**: Required fields must have non-empty strings
- **Select fields**: Required fields must have a selected option
- **Checkbox groups**: Required groups must have at least one option selected

## Review, Reset, Export

- Review page: Appears instead of Submit at the last step; shows required editable fields and grouped arrays for final edits
- Reset: In Review, “Reset” clears all entered data (with confirmation), re‑loads initial values from the schema, and returns to Step 1
- Export: Downloads and POSTs a flat JSON payload:
  - Key:value mapping (no type wrapper)
  - Arrays of objects are included as proper arrays

## API Integration

The form automatically:
1. Downloads form data as `form-output.json`
2. POSTs the same data to `/api/submit`

The API route logs the submission and returns a success response. Extend `app/api/submit/route.ts` for your needs. The raw schema is served from `app/api/schema/route.ts`.

## Deployment

- Vercel (recommended):
  - Push this repo to GitHub.
  - Import into Vercel and deploy (framework: Next.js, Node 18).
  - Or locally: `npm i -g vercel` then `vercel` (link) and `vercel --prod`.
- Self‑host:
  - `npm run build` then `npm start` on a Node 18 server.
  - Behind a reverse proxy (Nginx/Caddy) with TLS.

## Accessibility Features

- Full keyboard navigation (Tab/Shift+Tab)
- ARIA labels and roles
- Screen reader announcements for errors
- Visible focus indicators
- Semantic HTML structure

## File Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── schema/route.ts       # Serves raw JSON/JSONC schema
│   │   └── submit/route.ts       # Receives flat JSON export
│   ├── json input/schema.json     # Default schema (JSONC with comments)
│   └── page.tsx                   # Loads schema and renders SequentialForm
├── components/
│   ├── checkbox-group.tsx         # Multi-select checkbox component
│   ├── select-field.tsx           # Select with optional custom input
│   ├── text-input-field.tsx       # Text input with auto-populate
│   ├── object-array-field.tsx     # Grouped editor for arrays of objects
│   └── sequential-form.tsx        # Main form orchestrator
├── lib/
│   ├── schema-parser.ts           # JSON5 parsing + comment hints → steps & values
│   ├── download-json.ts           # JSON download utility
│   ├── form-store.ts              # Zustand state management
│   ├── hidden-keys.ts             # List of dotpath/wildcard keys to hide in UI
│   ├── humanize.ts                # Humanizes key names for UI labels
│   └── validation.ts              # Field validation logic
└── types.ts                       # TypeScript type definitions
\`\`\`

## Technology Stack

- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **shadcn/ui** for base components
- **JSON5** to parse JSON with comments
\`\`\`

```json file="" isHidden
