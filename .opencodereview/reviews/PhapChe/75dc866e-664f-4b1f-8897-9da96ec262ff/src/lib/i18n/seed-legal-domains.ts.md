# Review: `src/lib/i18n/seed-legal-domains.ts`

**Project:** PhapChe | **Review:** `75dc866e-664f-4b1f-8897-9da96ec262ff`

**Comments:** 3

---

## 🟡 Medium (2)

**🐛 Bug** · lines 373-377

Japanese description contains Korean text '이용약관' (hangul) instead of the correct Japanese '利用規約'. This would confuse Japanese-speaking users and is a localization bug.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    description: {
      vi: 'Soạn điều khoản sử dụng dịch vụ/sản phẩm.',
      en: 'Draft terms of service/product usage.',
      zh: '起草服务/产品使用条款。',
      ja: 'サービス/製品の利用規約を作成します。',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    description: {
      vi: 'Soạn điều khoản sử dụng dịch vụ/sản phẩm.',
      en: 'Draft terms of service/product usage.',
      zh: '起草服务/产品使用条款。',
      ja: 'サービス/製品の 이용약관を作成します。',
```
</details>

---

**🔧 Maintainability** · lines 70-77

Service type `agency_contract` is defined in `SEED_MATTER_TYPES` but is not referenced by any domain's `matterTypeKeys`. It is unreachable through the normal domain→service type flow (`getServiceTypesByDomain`). This appears to be dead/orphaned data — consider adding it to the `commercial-legal` domain or removing it.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Add 'agency_contract' to the commercial-legal domain's matterTypeKeys:
// matterTypeKeys: ['distribution_contract', 'nda', 'commercial_review', 'agency_contract'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  agency_contract: {
    key: 'agency_contract',
    label: {
      vi: 'Soạn hợp đồng đại lý',
      en: 'Agency Contract',
      zh: '代理合同',
      ja: '代理店契約',
    },
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 112-119

Service type `unsupported` is defined in `SEED_MATTER_TYPES` but is not referenced by any domain's `matterTypeKeys`. If this is intended as a global fallback, consider adding a comment explaining the intent. Otherwise, it is dead data.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Fallback type for requests that don't match any known domain
  unsupported: {
    key: 'unsupported',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  unsupported: {
    key: 'unsupported',
    label: {
      vi: 'Dịch vụ khác / chưa rõ loại việc',
      en: 'Other / Unclear',
      zh: '其他 / 不明确',
      ja: 'その他 / 不明',
    },
```
</details>


