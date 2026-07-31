# Review: `src/app/api/partner/members/[id]/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🔴 Critical (2)

**🐛 Bug** · lines 84-115

Race condition: The last-admin guard check (count) and the subsequent update/delete are not executed atomically. Two concurrent requests could both pass the count check before either mutation executes, resulting in the last active admin being demoted or deleted — leaving the partner with no active admin. Wrap the guard check and mutation in a Prisma transaction (`prisma.$transaction`) to make the check-and-act atomic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Build update data
    const updateData: { role?: string; isActive?: boolean } = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Use a transaction to atomically guard and update, preventing TOCTOU race conditions
    const updated = await prisma.$transaction(async (tx) => {
      const isDemotingOrDeactivating =
        (role !== undefined && targetMember.role === 'admin' && role !== 'admin') ||
        (isActive === false && targetMember.isActive);

      if (isDemotingOrDeactivating) {
        const activeAdminCount = await tx.partnerMember.count({
          where: {
            partnerId: targetMember.partnerId,
            role: 'admin',
            isActive: true,
            id: { not: targetMember.id },
          },
        });
        if (activeAdminCount === 0) {
          throw new Error('LAST_ADMIN');
        }
      }

      return tx.partnerMember.update({
        where: { id },
        data: updateData,
        include: { user: true },
      });
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    if (isDemotingOrDeactivating) {
      const activeAdminCount = await prisma.partnerMember.count({
        where: {
          partnerId: targetMember.partnerId,
          role: 'admin',
          isActive: true,
          id: { not: targetMember.id },
        },
      });
      if (activeAdminCount === 0) {
        return NextResponse.json(
          { error: 'Cannot remove the last active admin. Promote another member to admin first.' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: { role?: string; isActive?: boolean } = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Update member
    const updated = await prisma.partnerMember.update({
      where: { id },
      data: updateData,
      include: { user: true },
    });
```
</details>

---

**🐛 Bug** · lines 187-208

Same race condition as PATCH: The last-active-admin count check and deletion are not atomic. Two concurrent DELETE requests targeting different admins could both pass the count check, resulting in both admins being deleted and leaving the partner with no active admin. Wrap in `prisma.$transaction` to make the check-and-delete atomic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Guard: cannot delete the last active admin (use transaction for atomicity)
    await prisma.$transaction(async (tx) => {
      if (targetMember.role === 'admin' && targetMember.isActive) {
        const activeAdminCount = await tx.partnerMember.count({
          where: {
            partnerId: targetMember.partnerId,
            role: 'admin',
            isActive: true,
            id: { not: targetMember.id },
          },
        });
        if (activeAdminCount === 0) {
          throw new Error('LAST_ADMIN');
        }
      }

      await tx.partnerMember.delete({
        where: { id },
      });
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Guard: cannot delete the last active admin
    if (targetMember.role === 'admin' && targetMember.isActive) {
      const activeAdminCount = await prisma.partnerMember.count({
        where: {
          partnerId: targetMember.partnerId,
          role: 'admin',
          isActive: true,
          id: { not: targetMember.id },
        },
      });
      if (activeAdminCount === 0) {
        return NextResponse.json(
          { error: 'Cannot remove the last active admin. Promote another member to admin first.' },
          { status: 400 }
        );
      }
    }

    // Delete member
    await prisma.partnerMember.delete({
      where: { id },
    });
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 130-133

If the transaction-based guard throws an error (e.g., 'LAST_ADMIN'), the outer catch block returns a generic 500 'Failed to update member' instead of the specific 400 'Cannot remove the last active admin' error. The catch block should check for this specific error and return the appropriate 400 response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot remove the last active admin. Promote another member to admin first.' },
        { status: 400 }
      );
    }
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
```
</details>

---

**🐛 Bug** · lines 211-214

Same issue as PATCH: if the transaction throws 'LAST_ADMIN', the catch block returns a generic 500. Add the same error check before the generic fallback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot remove the last active admin. Promote another member to admin first.' },
        { status: 400 }
      );
    }
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
```
</details>


