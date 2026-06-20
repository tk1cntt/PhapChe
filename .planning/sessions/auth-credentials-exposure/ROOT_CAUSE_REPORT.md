# Root Cause Report: Password Visibility in Network Tab

**Investigation Date:** 2026-06-20  
**Investigator:** Security Analysis  
**Severity:** LOW (Development) / HIGH (if deployed to production with current config)  
**Status:** Expected behavior with configuration risk

---

## Executive Summary

Người dùng báo cáo rằng password hiển thị dưới dạng plaintext trong Network tab của browser khi đăng nhập. Đây là **hành vi chuẩn của tất cả ứng dụng web**, không phải lỗ hổng bảo mật. Tuy nhiên, có một **vấn đề cấu hình thực sự**: ứng dụng đang sử dụng HTTP thay vì HTTPS, điều này sẽ nguy hiểm nếu deploy lên production.

---

## Investigation Findings

### 1. Luồng xử lý Sign-in Request

**Finding:** Request đi qua Next.js API route, sau đó được delegate cho Better Auth handler.

**Evidence:**
```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

**Flow:**
1. User click "Đăng nhập" → `authClient.signIn.email({ email, password })`
2. Browser gửi POST request đến `/api/auth/sign-in/email`
3. Next.js App Router route request đến catch-all handler `[...all]/route.ts`
4. `toNextJsHandler(auth)` delegate cho Better Auth xử lý
5. Better Auth validate credentials và tạo session

**Kết luận:** Kiến trúc đúng chuẩn, không có vấn đề.

---

### 2. Password trong Network Tab

**Finding:** Password LUÔN hiển thị trong Network tab của browser - đây là hành vi chuẩn.

**Giải thích kỹ thuật:**
- Browser's Network tab là **client-side debugging tool**
- Password phải được gửi từ browser → server để authenticate
- Browser có thể xem plaintext **trước khi encryption** xảy ra
- HTTPS encrypt data **trong quá trình truyền tải**, nhưng browser vẫn thấy plaintext

**So sánh với các ứng dụng lớn:**
- Google Login: password visible trong Network tab
- Facebook Login: password visible trong Network tab
- Banking websites: password visible trong Network tab

**Kết luận:** Đây KHÔNG phải lỗ hổng. Đây là cách tất cả web authentication hoạt động.

---

### 3. HTTPS Configuration

**Finding:** ⚠️ **VẤN ĐỀ THỰC SỰ** - Ứng dụng đang dùng HTTP, không phải HTTPS.

**Evidence:**
```typescript
// src/auth.ts
const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
```

```bash
# .env file - KHÔNG có BETTER_AUTH_URL
# Nên default về http://localhost:3000
```

**Rủi ro:**

| Môi trường | Protocol | Rủi ro |
|------------|----------|--------|
| Local development (localhost) | HTTP | **THẤP** - Traffic không rời khỏi máy |
| Production (nếu không đổi config) | HTTP | **CAO** - Password truyền qua mạng dưới dạng plaintext |

**Tác động nếu deploy với HTTP:**
- Password bị expose trên network (WiFi công cộng, ISP, etc.)
- Session cookies bị expose
- Man-in-the-middle attacks có thể intercept credentials
- Vi phạm OWASP Top 10 A02:2021 - Cryptographic Failures

**Kết luận:** Cần set `BETTER_AUTH_URL=https://yourdomain.com` trước khi deploy production.

---

### 4. Demo Credentials Pre-filling

**Finding:** ✅ Demo credentials được pre-fill **chỉ trong development mode**.

**Evidence:**
```typescript
// src/components/auth/SignInForm.tsx
const DEFAULT_EMAIL = 'customer.demo@example.test';
const DEFAULT_PASSWORD = 'Demo@123456';

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    setEmail(DEFAULT_EMAIL);
    setPassword(DEFAULT_PASSWORD);
  }
}, []);
```

**Phân tích:**
- Code check `process.env.NODE_ENV === 'development'`
- Trong production build, `NODE_ENV` = `'production'`
- Code block này sẽ **không được execute** trong production
- Next.js tree-shakes development-only code trong production builds

**Kết luận:** Implementation đúng, không có rủi ro production.

---

### 5. Đánh giá tổng thể

| Vấn đề | Severity | Status | Action Required |
|--------|----------|--------|-----------------|
| Password visible trong Network tab | INFO | Expected | Không cần action |
| Pre-filled credentials trong dev | INFO | Expected | Không cần action |
| HTTP thay vì HTTPS | HIGH (production) | Configuration risk | Cần fix trước khi deploy |

---

## Root Cause Analysis

### Nguyên nhân người dùng thấy password trong Network tab:

**Đây KHÔNG phải bug hay lỗ hổng.** Đây là cách web authentication hoạt động:

```
User Input (plaintext)
    ↓
Browser JavaScript (plaintext visible in DevTools)
    ↓
HTTPS Encryption (encrypted in transit) ← Không có trong trường hợp này!
    ↓
Server receives (plaintext after decryption)
    ↓
Better Auth validates & hashes (bcrypt)
    ↓
Database stores (hashed password)
```

### Vấn đề thực sự: Thiếu HTTPS

**Root cause:** File `.env` không set `BETTER_AUTH_URL`, nên default về `http://localhost:3000`.

**Tại sao acceptable trong development:**
- Localhost traffic không rời khỏi máy
- Không có network transmission
- Không có rủi ro interception

**Tại sao dangerous trong production:**
- Traffic đi qua network (ISP, WiFi, etc.)
- Password và session cookies truyền dưới dạng plaintext
- Bất kỳ ai trên cùng network đều có thể intercept

---

## Recommendations

### ✅ Immediate Actions (Before Production Deployment)

1. **Set HTTPS URL trong production environment:**
   ```bash
   # .env.production
   BETTER_AUTH_URL="https://yourdomain.com"
   ```

2. **Configure trusted origins cho production:**
   ```typescript
   // src/auth.ts
   trustedOrigins: [
     "https://yourdomain.com",
     "https://www.yourdomain.com",
     // Remove localhost entries trong production
   ],
   ```

3. **Enable HSTS (HTTP Strict Transport Security):**
   ```typescript
   // next.config.ts
   const nextConfig: NextConfig = {
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: [
             {
               key: 'Strict-Transport-Security',
               value: 'max-age=31536000; includeSubDomains; preload'
             }
           ]
         }
       ]
     }
   };
   ```

### ✅ Optional Improvements

4. **Remove hardcoded demo credentials:**
   ```typescript
   // Remove these lines
   // const DEFAULT_EMAIL = 'customer.demo@example.test';
   // const DEFAULT_PASSWORD = 'Demo@123456';
   
   // Use environment variables instead
   const DEFAULT_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || '';
   const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || '';
   ```

5. **Add security headers:**
   ```typescript
   // next.config.ts
   headers: [
     { key: 'X-Content-Type-Options', value: 'nosniff' },
     { key: 'X-Frame-Options', value: 'DENY' },
     { key: 'X-XSS-Protection', value: '1; mode=block' },
     { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
   ]
   ```

---

## User Communication

### Giải thích cho người dùng:

**"Tại sao tôi thấy password trong Network tab?"**

> Đây là hành vi bình thường của tất cả ứng dụng web. Browser's Network tab là công cụ debugging phía client, nên nó có thể thấy data trước khi được gửi đi. Điều quan trọng là data phải được **encrypted trong quá trình truyền tải** bằng HTTPS.

**"Vậy có an toàn không?"**

> - **Trong development (localhost):** An toàn, vì traffic không rời khỏi máy của bạn
> - **Trong production:** Cần đảm bảo `BETTER_AUTH_URL` được set thành `https://yourdomain.com`

**"Tôi cần làm gì?"**

> Không cần làm gì nếu chỉ chạy local. Trước khi deploy production, hãy:
> 1. Mua SSL certificate hoặc dùng Let's Encrypt (free)
> 2. Configure web server (Nginx/Apache) để redirect HTTP → HTTPS
> 3. Set `BETTER_AUTH_URL=https://yourdomain.com` trong `.env.production`

---

## Conclusion

**Verdict:** Đây là **expected behavior**, không phải security vulnerability.

**Password visible trong Network tab:** ✅ Normal (tất cả web apps đều như vậy)

**Pre-filled credentials:** ✅ Safe (chỉ trong development mode)

**HTTP configuration:** ⚠️ Cần fix trước khi deploy production

**Next Steps:**
1. Không cần thay đổi code
2. Configure HTTPS trước khi deploy production
3. Document HTTPS requirement trong deployment guide

---

## References

- [OWASP Transport Layer Protection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/01-Testing_for_Weak_Transport_Layer_Security)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Next.js Security Headers](https://nextjs.org/docs/pages/building-your-application/configuring/security-headers)
