# Review: `src/app/api/requests/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 2

---

## 🟠 High (1)

**🔒 Security** · lines 25-29

PII Exposure: The response includes email addresses of createdBy, assignedSpecialist, and assignedReviewer via `email: true` in the select clauses. There is no explicit permission check to verify that the requesting user is authorized to view these email addresses. Any workspace member could potentially access the email addresses of other users involved in legal requests, which may violate privacy requirements or data protection regulations (e.g., GDPR). Consider either removing `email: true` from the select or adding a role-based authorization check (e.g., only admins or the request creator can see email addresses).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true } },
        assignedSpecialist: { select: { id: true, name: true } },
        assignedReviewer: { select: { id: true, name: true } },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignedSpecialist: { select: { id: true, name: true, email: true } },
        assignedReviewer: { select: { id: true, name: true, email: true } },
```
</details>


## 🔵 Low (1)

**🔒 Security** · line 52

Information Disclosure via Error Logging: `console.error` logs the full error message, which could leak internal details (e.g., database connection strings, stack traces, or query details) in server logs. Consider logging a sanitized error identifier and only logging the full error in development mode.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (process.env.NODE_ENV === 'development') {
      console.error('Request detail error:', error instanceof Error ? error.message : String(error));
    } else {
      console.error('Request detail error: [REDACTED]');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Request detail error:', error instanceof Error ? error.message : String(error));
```
</details>


