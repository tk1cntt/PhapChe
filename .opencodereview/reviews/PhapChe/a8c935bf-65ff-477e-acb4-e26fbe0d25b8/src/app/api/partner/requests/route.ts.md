# Review: `src/app/api/partner/requests/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 17-20

`findFirst` without `orderBy` can arbitrarily pick one partner when a user belongs to multiple partners. This may cause the user to see requests from the wrong partner, or miss requests from their other partners. Consider either querying all partners the user belongs to, or adding deterministic ordering (e.g., `orderBy: { createdAt: 'asc' }`) and potentially requiring the user to specify which partner context they want.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Query all partners the user belongs to
    const members = await prisma.partnerMember.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { partnerId: true },
    });

    if (!members.length) {
      return NextResponse.json({ error: 'FORBIDDEN', detail: 'Not a partner' }, { status: 403 });
    }

    const partnerIds = members.map(m => m.partnerId);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const member = await prisma.partnerMember.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { partnerId: true },
    });
```
</details>


## 🟡 Medium (2)

**⚡ Performance** · line 29

No upper bound on the `take` pagination parameter. A malicious client could pass `take=999999` causing a large database query and potential denial of service. Cap `take` at a reasonable maximum (e.g., 100).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const take = Math.min(parseInt(searchParams.get('take') || '20', 10), 100);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const take = parseInt(searchParams.get('take') || '20', 10);
```
</details>

---

**🐛 Bug** · lines 28-29

Negative `skip` and `take` values are not validated. `parseInt` accepts negative strings like `'-5'`, which would result in invalid Prisma query arguments and potentially unexpected behavior. Add validation to enforce non-negative values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10));
    const take = Math.max(1, Math.min(parseInt(searchParams.get('take') || '20', 10), 100));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '20', 10);
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 38

The `where` variable is typed as `Record<string, unknown>`, which loses type safety. Consider using Prisma's generated `Prisma.LegalRequestWhereInput` type to get compile-time validation of the filter shape.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const where: Prisma.LegalRequestWhereInput = {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const where: Record<string, unknown> = {
```
</details>


