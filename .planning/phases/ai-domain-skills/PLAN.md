# AI Domain Skills — Plan Chi Tiết

**Created:** 2026-07-22
**Status:** ✅ Completed — All 4 phases done
**Goal:** Mở rộng 15 → 31 AgentSkill, kế thừa tinh thần claude-for-legal, áp dụng luật Việt Nam

---

## Architecture

```
src/lib/ai/
├── types.ts                         # +AgentSkill union, +DOMAIN_SKILL_MAP entries
├── system-prompts.ts                # +SYSTEM_PROMPTS entries
├── system-prompts/
│   ├── document-issue-analyzer.ts   # (đã có)
│   ├── nda-reviewer.ts              # P0 — Thương mại
│   ├── vendor-contract-reviewer.ts  # P0 — Thương mại
│   ├── board-resolution-drafter.ts  # P0 — Doanh nghiệp
│   ├── entity-compliance.ts        # P0 — Doanh nghiệp
│   ├── labor-discipline-checker.ts  # P0 — Lao động
│   ├── internal-regulation-drafter.ts # P0 — Lao động
│   ├── dsar-response-drafter.ts     # P0 — Bảo mật
│   ├── trademark-clearance.ts       # P1 — SHTT
│   ├── cease-desist-drafter.ts     # P1 — SHTT
│   ├── demand-letter-drafter.ts    # P1 — Tranh tụng
│   ├── litigation-strategist.ts    # P1 — Tranh tụng
│   ├── tos-generator.ts            # P2 — Sản phẩm
│   ├── compliance-gap-analyzer.ts  # P2 — Tuân thủ
│   ├── ai-impact-assessment.ts    # P2 — AI Governance
│   ├── client-letter-drafter.ts    # P2 — Legal Clinic
│   └── legal-memo-drafter.ts       # P2 — Legal Clinic
```

---

## Phase 1: Thương mại (commercial-legal) + Doanh nghiệp (corporate-legal) [P0]

### 1.1 — NDA Reviewer (`nda-reviewer`)
- **Domain:** commercial-legal
- **MatterTypes:** `nda` (Đã có trong seed-legal-domains)
- **CFG Reference:** `nda-review/SKILL.md` — triage NDA, flag bất lợi
- **Output JSON:** `{ overallRisk, findings[{severity, clause, issue, recommendation, legalBasis}], summary }`
- **Test cases:** (1) NDA chuẩn → Low risk, (2) NDA 1 chiều bất lợi → High risk, (3) Thiếu confidentiality duration → Medium, (4) NDA rỗng → error

### 1.2 — Vendor Contract Reviewer (`vendor-contract-reviewer`)
- **Domain:** commercial-legal
- **MatterTypes:** `commercial_review`, `agency_contract`, `distribution_contract`
- **CFG Reference:** `vendor-agreement-review/SKILL.md` — rà soát hợp đồng nhà cung cấp
- **Output JSON:** `{ overallRisk, findings[{severity, clause, issue, recommendation, legalBasis}], missingClauses[], summary }`
- **Test cases:** (1) Hợp đồng phân phối → kiểm tra điều khoản độc quyền, (2) Hợp đồng đại lý → kiểm tra hoa hồng, (3) Thiếu điều khoản chấm dứt → flag

### 1.3 — Board Resolution Drafter (`board-resolution-drafter`)
- **Domain:** corporate-legal
- **MatterTypes:** `incorporation`, `shareholder_agreement`, `m_and_a`
- **CFG Reference:** `board-minutes/SKILL.md` + `written-consent/SKILL.md`
- **Output JSON:** `{ resolutionTitle, legalBasis[], resolutions[{number, content, vote}], signatures[], summary }`
- **Test cases:** (1) Nghị quyết bổ nhiệm GĐ → đầy đủ, (2) Thiếu thông tin cổ đông → cảnh báo, (3) Không có nội dung → error

### 1.4 — Entity Compliance Checker (`entity-compliance-checker`)
- **Domain:** corporate-legal
- **MatterTypes:** `incorporation`, `m_and_a`
- **CFG Reference:** `entity-compliance/SKILL.md`
- **Output JSON:** `{ complianceScore, checks[{category, requirement, status, deadline, action, legalBasis}], summary }`
- **Test cases:** (1) CTy TNHH 1TV → checklist đầy đủ, (2) Thiếu đăng ký thuế → non_compliant, (3) No input → error

---

## Phase 2: Lao động (employment-legal) + Bảo mật (privacy-legal) [P0]

### 2.1 — Labor Discipline Checker (`labor-discipline-checker`)
- **Domain:** employment-legal
- **MatterTypes:** `labor_contract`, `labor_dispute`
- **CFG Reference:** `termination-review/SKILL.md` + `internal-investigation/SKILL.md`
- **Output JSON:** `{ complianceScore, procedures[{step, requirement, status, note, legalBasis}], risks[], summary }`
- **Test cases:** (1) Kỷ luật đúng quy trình BLLĐ 2019, (2) Thiếu biên bản vi phạm → flag, (3) Sa thải trái luật → critical

### 2.2 — Internal Regulation Drafter (`internal-regulation-drafter`)
- **Domain:** employment-legal
- **MatterTypes:** `internal_regulations`
- **CFG Reference:** `policy-drafting/SKILL.md` + `handbook-updates/SKILL.md`
- **Output JSON:** `{ regulationTitle, chapters[{title, articles[{number, content, legalBasis}]}], warnings[], summary }`
- **Test cases:** (1) Nội quy 50 NV → template đầy đủ, (2) Thiếu thời giờ làm việc → flag, (3) Không có input → error

### 2.3 — DSAR Response Drafter (`dsar-response-drafter`)
- **Domain:** privacy-legal
- **MatterTypes:** `privacy_policy`, `data_processing_agreement`
- **CFG Reference:** `dsar-response/SKILL.md`
- **Output JSON:** `{ responseTitle, sections[{title, content}], legalBasis[], timeline, summary }`
- **Test cases:** (1) Yêu cầu xóa dữ liệu → template, (2) Yêu cầu không hợp lệ → từ chối có căn cứ, (3) Thiếu thông tin → yêu cầu bổ sung

---

## Phase 3: SHTT (ip-legal) + Tranh tụng (litigation-legal) [P1]

### 3.1 — Trademark Clearance (`trademark-clearance`)
- **Domain:** ip-legal
- **MatterTypes:** `trademark_registration`
- **CFG Reference:** `clearance/SKILL.md`
- **Output JSON:** `{ registrabilityScore, niceClasses[{class, goods, recommendation}], conflicts[{mark, class, similarity, risk}], recommendations[], summary }`
- **Test cases:** (1) Nhãn hiệu distinct → high score, (2) Nhãn hiệu tương tự → conflicts, (3) Nhãn generic → low score

### 3.2 — Cease & Desist Drafter (`cease-desist-drafter`)
- **Domain:** ip-legal
- **MatterTypes:** `copyright`, `trademark_registration`
- **CFG Reference:** `cease-desist/SKILL.md`
- **Output JSON:** `{ letterTitle, recipient, sections[{title, content}], demands[], deadline, legalBasis[], warnings[], summary }`
- **Test cases:** (1) Vi phạm nhãn hiệu → template đầy đủ, (2) Không rõ bên vi phạm → cảnh báo, (3) No input → error

### 3.3 — Demand Letter Drafter (`demand-letter-drafter`)
- **Domain:** litigation-legal
- **MatterTypes:** `lawsuit_filing`, `settlement_agreement`
- **CFG Reference:** `demand-draft/SKILL.md`
- **Output JSON:** `{ letterTitle, recipient, facts[], claims[{description, amount, basis}], paymentTerms, deadline, legalBasis[], summary }`
- **Test cases:** (1) Đòi nợ hợp đồng → template, (2) Tranh chấp thương mại → đa claims, (3) Không có số tiền → error

### 3.4 — Litigation Strategist (`litigation-strategist`)
- **Domain:** litigation-legal
- **MatterTypes:** `litigation_consultation`
- **CFG Reference:** `matter-intake/SKILL.md` + `chronology/SKILL.md`
- **Output JSON:** `{ caseAssessment, strengths[], weaknesses[], strategy, steps[{order, action, timeline, risk}], estimatedOutcome, summary }`
- **Test cases:** (1) Vụ kiện có chứng cứ mạnh → đánh giá tích cực, (2) Thiếu chứng cứ → risk cao, (3) Không có dữ kiện → error

---

## Phase 4: Sản phẩm + Tuân thủ + AI + Clinic [P2]

### 4.1 — TOS Generator (`tos-generator`)
- **Domain:** product-legal
- **MatterTypes:** `terms_of_service`
- **Output JSON:** `{ tosTitle, sections[{title, content, legalBasis}], warnings[], summary }`
- **Test cases:** (1) SaaS platform TOS, (2) E-commerce TOS, (3) No input → error

### 4.2 — Compliance Gap Analyzer (`compliance-gap-analyzer`)
- **Domain:** regulatory-legal
- **MatterTypes:** `compliance_report`, `business_license`
- **Output JSON:** `{ overallGap, gaps[{area, regulation, legalBasis, currentState, requiredState, action}], summary }`
- **Test cases:** (1) F&B license requirements, (2) Financial services compliance, (3) No input → error

### 4.3 — AI Impact Assessment (`ai-impact-assessment`)
- **Domain:** ai-governance-legal
- **MatterTypes:** `ai_policy`, `algorithm_audit`
- **Output JSON:** `{ riskLevel, principles[{principle, score, assessment, recommendations}], regulatoryMapping[], summary }`
- **Test cases:** (1) AI chatbot assessment, (2) AI recruitment tool — fairness concerns, (3) No input → error

### 4.4 — Client Letter Drafter (`client-letter-drafter`)
- **Domain:** legal-clinic
- **MatterTypes:** `internal_consultation`
- **Output JSON:** `{ letterTitle, recipient, sections[{title, content}], recommendations[], legalBasis[], summary }`
- **Test cases:** (1) Tư vấn hợp đồng, (2) Tư vấn lao động, (3) No input → error

### 4.5 — Legal Memo Drafter (`legal-memo-drafter`)
- **Domain:** legal-clinic
- **MatterTypes:** `legal_training`
- **Output JSON:** `{ memoTitle, issue, analysis[{point, law, application, conclusion}], recommendation, legalBasis[], summary }`
- **Test cases:** (1) Memo về chính sách mới, (2) Memo về rủi ro hợp đồng, (3) No input → error

---

## Test Structure Mỗi Skill

File: `src/lib/ai/__tests__/<skill>.test.ts`

Mỗi test file có 4 nhóm:
1. **Whitebox**: System prompt có đầy đủ template variables, JSON schema, required variables
2. **Blackbox**: Với input hợp lệ → output có các field bắt buộc
3. **Abnormal**: Input thiếu/biên → graceful degradation
4. **Error**: LLM error, JSON parse error, timeout

E2E test: `e2e/ai-domain-skills.spec.ts` — test full pipeline qua API endpoint

---

## Implementation Order

```
P0: Phase 1 (4 skills) → P0: Phase 2 (3 skills) → P1: Phase 3 (4 skills) → P2: Phase 4 (5 skills)
                                                                                ↓
                                                                      E2E tổng hợp
```

## Verification Per Phase

1. `npx tsc --noEmit` — TypeScript clean
2. `npx vitest run src/lib/ai/__tests__/<skill>.test.ts` — unit tests pass
3. `npm run build` — production build pass
