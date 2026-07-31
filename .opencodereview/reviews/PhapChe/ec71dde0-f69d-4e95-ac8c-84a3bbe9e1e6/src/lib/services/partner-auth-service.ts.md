# Review: `src/lib/services/partner-auth-service.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 6

---

## 🔴 Critical (1)

**🔒 Security** · lines 119-125

The `partnerLogin` method returns the full `user` object (line 92) without selecting specific fields. If the User model includes a `password` or `hashedPassword` field, this exposes the password hash to the client. Use Prisma's `select` or `omit` to exclude sensitive fields from the response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          lastActiveAt: user.lastActiveAt,
          createdAt: user.createdAt,
        } as User,
        partner: partnerMember.partner,
        partnerMember,
        permissions,
      };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      return {
        success: true,
        user,
        partner: partnerMember.partner,
        partnerMember,
        permissions,
      };
```
</details>


## 🟡 Medium (3)

**🔒 Security** · lines 126-132

Catch blocks (lines 96-100, 118-121) return `error.message` directly to the client, which may leak internal system details (e.g., database connection strings, stack traces). Use a generic error message in production, while logging the real error server-side.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    } catch (error) {
      console.error('Partner login error:', error);
      return {
        success: false,
        error: 'Login failed',
      };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    } catch (error) {
      console.error('Partner login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
```
</details>

---

**🐛 Bug** · lines 242-258

The `getPartnerMembers` method uses a type assertion `as Promise<(PartnerMember & { user: User })[]>` on line 167, but the query's `select` clause only picks a subset of User fields (id, name, email, isActive, emailVerified, createdAt, lastActiveAt). The full `User` type likely includes additional fields (e.g., `image`, `role`, etc.). Accessing unselected fields at runtime will return `undefined`, causing silent bugs. Define a proper return type that matches the actual selected fields.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return this.prismaClient.partnerMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    return this.prismaClient.partnerMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as Promise<(PartnerMember & { user: User })[]>;
```
</details>

---

**🔒 Security** · lines 175-181

Same error message leak as in `partnerLogin`: this catch block (lines 118-121) returns `error.message` to the client. Use a generic error message in production.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    } catch (error) {
      console.error('Validate partner session error:', error);
      return {
        valid: false,
        error: 'Validation failed',
      };
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    } catch (error) {
      console.error('Validate partner session error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
```
</details>


## 🔵 Low (2)

**🔧 Maintainability** · lines 138-146

The `validatePartnerSession` method only checks whether the user is an active partner member — it does not validate the actual session (e.g., expiry, token revocation). The name is misleading and may cause developers to assume session-level validation is happening. Consider renaming to `validatePartnerMembership` or adding actual session validation logic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  async validatePartnerMembership(userId: string): Promise<{
    valid: boolean;
    partnerContext?: {
      partner: Partner;
      member: PartnerMember;
      permissions: string[];
    };
    error?: string;
  }> {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  async validatePartnerSession(userId: string): Promise<{
    valid: boolean;
    partnerContext?: {
      partner: Partner;
      member: PartnerMember;
      permissions: string[];
    };
    error?: string;
  }> {
```
</details>

---

**🔧 Maintainability** · lines 208-211

The `getPartnerPermissions` catch block silently swallows all errors and returns `null`, making it indistinguishable from a legitimate "no member found" case. Consider at least logging the error or using a more explicit error-handling strategy (e.g., returning a discriminated result type).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    } catch (error) {
      console.error('Get partner permissions error:', error);
      return null; // Consider distinguishing "error" from "not found"
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    } catch (error) {
      console.error('Get partner permissions error:', error);
      return null;
    }
```
</details>


