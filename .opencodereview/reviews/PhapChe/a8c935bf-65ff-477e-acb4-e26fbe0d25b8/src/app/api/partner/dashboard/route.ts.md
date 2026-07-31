# Review: `src/app/api/partner/dashboard/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 1

---

## 🟡 Medium (1)

**⚡ Performance** · lines 47-80

Steps 3, 4, and 5 are three independent database queries with no data dependencies between them. They are currently executed sequentially, which means the total round-trip time is the sum of all three query durations. Using `Promise.all` to run them in parallel would reduce the latency to the duration of the slowest query alone.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // 3-5. Get active engagements, assigned requests count, and pending assignments in parallel
    const [engagements, assignedRequestsCount, pendingAssignments] = await Promise.all([
      prisma.engagement.findMany({
        where: {
          partnerId: member.partnerId,
          status: 'active',
        },
        include: {
          organization: {
            select: { id: true, name: true },
          },
          serviceScopes: {
            include: {
              serviceType: {
                select: { id: true, key: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.legalRequest.count({
        where: {
          assignedPartnerId: member.partnerId,
        },
      }),
      prisma.requestAssignment.count({
        where: {
          partnerId: member.partnerId,
        },
      }),
    ]);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // 3. Get active engagements
    const engagements = await prisma.engagement.findMany({
      where: {
        partnerId: member.partnerId,
        status: 'active',
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        serviceScopes: {
          include: {
            serviceType: {
              select: { id: true, key: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Get assigned requests count
    const assignedRequestsCount = await prisma.legalRequest.count({
      where: {
        assignedPartnerId: member.partnerId,
      },
    });

    // 5. Get pending assignments
    const pendingAssignments = await prisma.requestAssignment.count({
      where: {
        partnerId: member.partnerId,
      },
    });
```
</details>


