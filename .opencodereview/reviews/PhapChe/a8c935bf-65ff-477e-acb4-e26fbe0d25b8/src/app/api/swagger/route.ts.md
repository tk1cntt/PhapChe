# Review: `src/app/api/swagger/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 4-7

Module-level spec creation can crash the entire application on import. `createSwaggerSpec` is called at module scope (line 4), so if `apiFolder: 'src/app/api'` is invalid, inaccessible, or contains malformed route files, the error will be thrown synchronously during module evaluation. This prevents the entire route module from loading, causing a 500 error for any request to this endpoint with no graceful error handling.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
let spec: Record<string, unknown> | null = null;

export async function GET(request: NextRequest) {
  try {
    if (!spec) {
      spec = createSwaggerSpec({
        apiFolder: 'src/app/api',
        definition: {
          openapi: '3.0.0',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const spec = createSwaggerSpec({
  apiFolder: 'src/app/api',
  definition: {
    openapi: '3.0.0',
```
</details>


## 🟡 Medium (2)

**🔧 Maintainability** · line 323

Mutable spec export allows other modules to modify the shared OpenAPI spec object at runtime. Since `spec` is exported as a named export, any module importing it can add, remove, or modify properties, leading to inconsistent API documentation across requests and hard-to-debug issues.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Remove the mutable export. If other modules need the spec,
// they should call the GET endpoint or import a dedicated helper.
// Alternatively, export a deep-frozen copy:
// export const spec = Object.freeze(createSwaggerSpec({...}));
// But prefer lazy initialization inside the GET handler (see above).
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export { spec };
```
</details>

---

**🐛 Bug** · line 15

The server URL is evaluated once at module load time via `process.env.NEXT_PUBLIC_APP_URL`. In Next.js server-side contexts, this environment variable is evaluated at build time for static generation or at cold-start for serverless. If the URL changes (e.g., different deployment environments), the spec will contain a stale value until the module is re-evaluated. Moving spec creation into the GET handler (as suggested above) resolves this as well.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        // Note: When moved to lazy initialization, this will be evaluated per-request,
        // ensuring the URL reflects the current environment.
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 5

Hardcoded apiFolder path `'src/app/api'` assumes a specific project structure. If the project is restructured or the API routes move, this path silently breaks without any compile-time or lint-time error. Consider deriving this path from a constant or using a relative path resolution.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  apiFolder: path.join(process.cwd(), 'src/app/api'),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  apiFolder: 'src/app/api',
```
</details>


