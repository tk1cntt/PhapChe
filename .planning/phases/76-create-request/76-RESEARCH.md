# Phase 76: Create Request — Research Report

**Date:** 2026-06-20  
**Phase:** 76-create-request  
**Status:** Research complete, ready for planning

---

## Executive Summary

Phase 76 transforms Create Request wizard từ 4-step flat list thành 5-step wizard với 2-layer service selection (13 legal domains → 30+ service types), draft persistence, priority selection, contact pre-fill, và redirect về My Cases. Research này trả lời 6 câu hỏi trọng tâm: form engine strategy, draft API design, file upload pattern, validation approach, i18n integration, và state management.

**Key Findings:**
- ✅ Context + useReducer đã chốt (D-01) — phù hợp với wizard 5 bước phức tạp
- ✅ Draft auto-save trước step transitions (D-03) — giảm API calls, đơn giản logic
- ✅ Immediate file upload (D-07) — không queue, đơn giản state management
- ✅ Validation on blur + on submit (D-12) — pattern đã verify ở Phase 74
- ✅ Single file `seed-legal-domains.ts` (D-05) — < 500 lines, dễ maintain

---

## 1. Form Engine Strategy

### Question: How to render dynamic questions per service type?

**Research Findings:**

#### Current State (Phase 74-75)
- `IntakeQuestionsForm.tsx` render questions từ `SEED_MATTER_TYPES`
- Mỗi service type có array `questions` với structure:
  ```typescript
  { key: string, label: string, required: boolean, type: 'text' | 'textarea' }
  ```
- `catalog.ts` cung cấp `getMatterQuestions(matterTypeKey)` function
- Questions render dynamic dựa trên selected service type

#### Pattern from Phase 74 (Sign-In)
- Controlled inputs với `useState` cho mỗi field
- Validation on blur + on submit
- Error state lưu trong `Record<string, string>`
- Không dùng form library (react-hook-form considered over-engineering cho 2 fields)

#### Recommendation for Phase 76
**Approach:** Extend existing pattern, không cần FormRenderer từ `FORM_DEFINITION.md`

**Rationale:**
1. **MVP Scope:** Questions vẫn hardcode trong `SEED_MATTER_TYPES`, chưa fetch từ API
2. **Complexity:** 30+ service types × 3-5 questions mỗi loại = manageable với manual render
3. **Consistency:** Giữ pattern từ Phase 74 (controlled inputs, inline validation)
4. **Future-proof:** Khi cần dynamic form từ API, có thể migrate sang FormRenderer sau

**Implementation:**
```typescript
// Step 3: Questions
const questions = getMatterQuestions(state.serviceType);
return (
  <IntakeQuestionsForm
    questions={questions}
    values={state.answers}
    onChange={(key, value) => dispatch({ type: 'SET_ANSWER', key, value })}
    errors={errors}
    onBlur={(key) => validateField(key, state.answers[key])}
  />
);
```

**Tradeoff:** Không dùng FormDefinition schema (database-driven) vì MVP scope ưu tiên workflow end-to-end hơn dynamic form engine.

---

## 2. Draft API Design

### Question: What data structure for draft save/resume?

**Research Findings:**

#### Current State
- `POST /api/intake/create-draft` tồn tại nhưng chỉ gọi khi step 2→3
- Draft create với `{ matterTypeKey, answers }` → return `{ id }`
- Không có endpoint load draft hoặc save draft incremental

#### Decision D-03, D-04 (from 76-CONTEXT.md)
- **Auto-save:** Chỉ trước step transition (4 lần: 1→2, 2→3, 3→4, 4→5)
- **Explicit save:** "Lưu nháp" button ở steps 1-4
- **Resume:** Query param `?draftId=xxx` → load draft → pre-fill form

#### Proposed API Design

**Endpoint 1: Save Draft**
```typescript
POST /api/intake/draft/save
Content-Type: application/json

Request:
{
  draftId?: string,           // Optional, create new if missing
  domainId: string,           // 'commercial-legal'
  serviceType: string,        // 'distribution_contract'
  answers: Record<string, string>,
  files: UploadedFile[],      // { vaultFileId, filename, size }[]
  priority: 'normal' | 'urgent',
  contactInfo: {
    email: string,
    phone?: string,
    companyName?: string,
    taxCode?: string
  }
}

Response:
{
  data: {
    draftId: string,
    updatedAt: string
  }
}
```

**Endpoint 2: Load Draft**
```typescript
GET /api/intake/draft/:id

Response:
{
  data: {
    draftId: string,
    domainId: string,
    serviceType: string,
    answers: Record<string, string>,
    files: UploadedFile[],
    priority: 'normal' | 'urgent',
    contactInfo: { ... },
    updatedAt: string
  }
}
```

**Edge Cases:**
- Invalid draftId → 404 response → form start fresh, toast error
- Draft save failure → toast error, user retry, không block wizard (D-06)
- Concurrent saves → debounce 500ms, chỉ save latest (SPEC edge coverage)

**Implementation Strategy:**
```typescript
// WizardContext action
const saveDraft = async (state: WizardState) => {
  try {
    const response = await apiClient.post('/api/intake/draft/save', {
      draftId: state.draftId,
      domainId: state.domainId,
      serviceType: state.serviceType,
      answers: state.answers,
      files: state.files,
      priority: state.priority,
      contactInfo: state.contactInfo
    });
    dispatch({ type: 'SET_DRAFT_ID', payload: response.data.draftId });
    toast.success('Đã lưu nháp');
    return true;
  } catch (error) {
    toast.error('Không thể lưu nháp, vui lòng thử lại');
    return false; // Don't block wizard
  }
};
```

---

## 3. File Upload Pattern

### Question: Progress bar implementation, drag-drop zone, file list state management?

**Research Findings:**

#### Current State
- `POST /api/intake/attach-file` tồn tại và hoạt động
- File input basic, không có drag-drop visual feedback
- Uploaded files lưu trong `UploadedFile[]` state

#### Decision D-07 (from 76-CONTEXT.md)
- **Immediate upload:** Upload ngay khi user chọn file, không queue
- **Draft create trước:** Nếu chưa có draftId, tạo draft trước khi upload
- **User control:** Có thể remove/re-upload trước submit

#### Proposed Implementation

**File Upload Flow:**
```typescript
const handleFileSelect = async (files: FileList) => {
  for (const file of Array.from(files)) {
    // 1. Client-side validation
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`${file.name} vượt quá 50MB`);
      continue;
    }
    
    // 2. Ensure draft exists
    if (!state.draftId) {
      const draftCreated = await createInitialDraft();
      if (!draftCreated) return;
    }
    
    // 3. Upload with progress
    await uploadFile(file);
  }
};

const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('requestId', state.draftId!);
  
  setUploadProgress({ filename: file.name, progress: 0 });
  
  try {
    // Use XMLHttpRequest for progress tracking (fetch doesn't support upload progress)
    const response = await new Promise<UploadedFile>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress({ filename: file.name, progress: percent });
        }
      });
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.data);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.open('POST', '/api/intake/attach-file');
      xhr.send(formData);
    });
    
    // 4. Update state
    dispatch({ type: 'ADD_FILE', payload: response });
    setUploadProgress(null);
    toast.success(`${file.name} đã tải lên`);
  } catch (error) {
    toast.error(`Không thể tải lên ${file.name}`);
  }
};
```

**Drag-Drop Zone:**
```typescript
const [isDragging, setIsDragging] = useState(false);

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
  if (e.dataTransfer.files) {
    handleFileSelect(e.dataTransfer.files);
  }
};

return (
  <div
    onDragOver={handleDragOver}
    onDragLeave={() => setIsDragging(false)}
    onDrop={handleDrop}
    className={cn(
      'border-2 border-dashed rounded-lg p-8 transition-colors',
      isDragging ? 'border-primary bg-primary/5' : 'border-muted'
    )}
  >
    {/* Upload UI */}
  </div>
);
```

**File List State:**
- Lưu trong `WizardState.files: UploadedFile[]`
- Mỗi file có `{ vaultFileId, filename, size }`
- Remove file: `dispatch({ type: 'REMOVE_FILE', payload: vaultFileId })`

**Progress Bar UI:**
```typescript
{uploadProgress && (
  <div className="space-y-2">
    <div className="text-sm text-muted-foreground">
      Đang tải lên {uploadProgress.filename}...
    </div>
    <Progress value={uploadProgress.progress} className="h-2" />
  </div>
)}
```

**Tradeoff:** Dùng XMLHttpRequest thay vì fetch vì fetch không support upload progress event. Đây là exception duy nhất dùng XHR trong project.

---

## 4. Validation Approach

### Question: On blur vs on submit timing?

**Research Findings:**

#### Decision D-12 (from 76-CONTEXT.md)
- **Validate on blur + on submit** (pattern từ Phase 74)
- Không real-time validation (noisy, distracting)
- Submit-only quá trễ, user không biết lỗi cho đến khi submit

#### Pattern from Phase 74 (Sign-In)
```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

const validateField = (key: string, value: string) => {
  const question = questions.find(q => q.key === key);
  if (question?.required && !value.trim()) {
    setErrors(prev => ({ ...prev, [key]: 'Trường này là bắt buộc' }));
    return false;
  }
  // Clear error if valid
  setErrors(prev => {
    const next = { ...prev };
    delete next[key];
    return next;
  });
  return true;
};

const handleBlur = (key: string) => {
  validateField(key, state.answers[key]);
};

const handleSubmit = () => {
  // Validate all required fields
  const newErrors: Record<string, string> = {};
  questions.filter(q => q.required).forEach(q => {
    if (!state.answers[q.key]?.trim()) {
      newErrors[q.key] = 'Trường này là bắt buộc';
    }
  });
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return false;
  }
  return true;
};
```

#### Validation Rules per Step

**Step 1: Domain Selection**
- Required: `state.domainId` not null
- Error: "Vui lòng chọn lĩnh vực pháp lý"

**Step 2: Service Selection**
- Required: `state.serviceType` not null
- Error: "Vui lòng chọn loại dịch vụ"

**Step 3: Questions**
- Required: All questions with `required: true` must have non-empty values
- Email validation: `^[^@]+@[^@]+\.[^@]+$` (simple pattern)
- Phone validation: `^[0-9]{10,11}$` (Vietnamese format)
- On blur: validate individual field
- On next: validate all required fields

**Step 4: Upload**
- Optional: Không bắt buộc file
- File size: max 50MB per file (client-side check)
- File format: PDF, DOC, DOCX, JPG, PNG

**Step 5: Review**
- Required: `state.priority` selected
- Contact info: optional (pre-fill từ profile, user có thể edit)
- Submit disabled nếu: `!state.domainId || !state.serviceType || !validateRequiredAnswers()`

---

## 5. i18n Integration

### Question: Translation key patterns for wizard labels?

**Research Findings:**

#### Current State
- next-intl configured với 4 locales: VI/EN/ZH/JA
- `messages/{vi,en,zh,ja}.json` files tồn tại
- Keys follow pattern: `Component.element.action` (from `I18N_RULES.md`)

#### Translation Keys Needed

**Wizard Steps:**
```json
{
  "CreateRequest.wizard.step1": "Lĩnh vực",
  "CreateRequest.wizard.step2": "Dịch vụ",
  "CreateRequest.wizard.step3": "Thông tin",
  "CreateRequest.wizard.step4": "Tài liệu",
  "CreateRequest.wizard.step5": "Xác nhận"
}
```

**Domain Labels (13 domains):**
```json
{
  "CreateRequest.domain.commercial-legal": "Thương mại",
  "CreateRequest.domain.corporate-legal": "Doanh nghiệp",
  "CreateRequest.domain.employment-legal": "Lao động",
  "CreateRequest.domain.privacy-legal": "Bảo mật dữ liệu",
  "CreateRequest.domain.product-legal": "Sản phẩm",
  "CreateRequest.domain.regulatory-legal": "Tuân thủ",
  "CreateRequest.domain.ai-governance-legal": "Quản trị AI",
  "CreateRequest.domain.ip-legal": "Sở hữu trí tuệ",
  "CreateRequest.domain.litigation-legal": "Tranh tụng",
  "CreateRequest.domain.legal-clinic": "Phòng pháp chế",
  "CreateRequest.domain.law-student": "Sinh viên luật",
  "CreateRequest.domain.legal-builder-hub": "Xây dựng pháp lý",
  "CreateRequest.domain.external-plugins": "Plugin bên ngoài"
}
```

**Buttons & Actions:**
```json
{
  "CreateRequest.button.next": "Tiếp theo",
  "CreateRequest.button.back": "Quay lại",
  "CreateRequest.button.saveDraft": "Lưu nháp",
  "CreateRequest.button.submit": "Gửi yêu cầu",
  "CreateRequest.button.edit": "Chỉnh sửa",
  "CreateRequest.button.viewCases": "Xem hồ sơ của tôi",
  "CreateRequest.button.startOver": "Xóa và bắt đầu mới"
}
```

**Messages:**
```json
{
  "CreateRequest.message.draftSaved": "Đã lưu nháp",
  "CreateRequest.message.submitSuccess": "Yêu cầu đã được gửi thành công",
  "CreateRequest.message.resumeDraft": "Tiếp tục từ lần trước",
  "CreateRequest.message.uploadProgress": "Đang tải lên {{filename}}...",
  "CreateRequest.message.uploadSuccess": "{{filename}} đã tải lên",
  "CreateRequest.message.redirecting": "Chuyển hướng sau {{seconds}} giây..."
}
```

**Errors:**
```json
{
  "CreateRequest.error.required": "Trường này là bắt buộc",
  "CreateRequest.error.invalidEmail": "Email không hợp lệ",
  "CreateRequest.error.fileTooLarge": "{{filename}} vượt quá 50MB",
  "CreateRequest.error.uploadFailed": "Không thể tải lên {{filename}}",
  "CreateRequest.error.draftSaveFailed": "Không thể lưu nháp",
  "CreateRequest.error.submitFailed": "Không thể gửi yêu cầu"
}
```

**Implementation:**
```typescript
const t = useTranslations('CreateRequest');

return (
  <div>
    <h1>{t('wizard.step1')}</h1>
    <Button>{t('button.next')}</Button>
  </div>
);
```

**Service Type Labels:**
- Lấy từ `SEED_MATTER_TYPES[key].label[locale]`
- Không duplicate trong `messages/*.json` vì đã có trong seed data
- Component access: `SEED_MATTER_TYPES[serviceType].label[currentLocale]`

---

## 6. State Management

### Question: Context + useReducer vs react-hook-form tradeoffs?

**Research Findings:**

#### Decision D-01, D-02 (from 76-CONTEXT.md)
- **Context + useReducer** cho wizard state (không dùng react-hook-form)
- State phức tạp 5 bước cần centralized
- Context + useReducer là pattern native React, không cần thêm dependency

#### WizardState Type
```typescript
type WizardState = {
  step: 1 | 2 | 3 | 4 | 5;
  domainId: string | null;
  serviceType: string | null;
  answers: Record<string, string>;
  files: UploadedFile[];
  priority: 'normal' | 'urgent';
  contactInfo: {
    email: string;
    phone?: string;
    companyName?: string;
    taxCode?: string;
  };
  draftId: string | null;
};

type WizardAction =
  | { type: 'SET_STEP'; payload: 1 | 2 | 3 | 4 | 5 }
  | { type: 'SET_DOMAIN'; payload: string }
  | { type: 'SET_SERVICE'; payload: string }
  | { type: 'SET_ANSWER'; key: string; value: string }
  | { type: 'ADD_FILE'; payload: UploadedFile }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_PRIORITY'; payload: 'normal' | 'urgent' }
  | { type: 'SET_CONTACT'; payload: Partial<WizardState['contactInfo']> }
  | { type: 'SET_DRAFT_ID'; payload: string }
  | { type: 'RESET' };
```

#### Reducer Implementation
```typescript
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    
    case 'SET_DOMAIN':
      return { 
        ...state, 
        domainId: action.payload,
        serviceType: null, // Reset service when domain changes
        answers: {} // Reset answers
      };
    
    case 'SET_SERVICE':
      return { ...state, serviceType: action.payload, answers: {} };
    
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value }
      };
    
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.payload] };
    
    case 'REMOVE_FILE':
      return {
        ...state,
        files: state.files.filter(f => f.vaultFileId !== action.payload)
      };
    
    case 'SET_PRIORITY':
      return { ...state, priority: action.payload };
    
    case 'SET_CONTACT':
      return {
        ...state,
        contactInfo: { ...state.contactInfo, ...action.payload }
      };
    
    case 'SET_DRAFT_ID':
      return { ...state, draftId: action.payload };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}
```

#### Context Provider
```typescript
const WizardContext = createContext<{
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
} | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  
  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
```

#### Why Not react-hook-form?

**Tradeoffs:**

| Criteria | Context + useReducer | react-hook-form |
|----------|---------------------|-----------------|
| **Dependencies** | 0 (native React) | +1 package |
| **Complexity** | Medium (manual state management) | Low (automatic form state) |
| **Flexibility** | High (full control) | Medium (library constraints) |
| **Performance** | Good (controlled inputs) | Excellent (uncontrolled by default) |
| **Learning curve** | Low (standard React) | Medium (library API) |
| **Wizard steps** | Easy (centralized state) | Harder (form per step) |
| **Draft save** | Easy (state snapshot) | Medium (extract values) |
| **File upload** | Manual integration | Manual integration |

**Decision Rationale:**
1. **Wizard complexity:** 5 steps với cross-step dependencies (domain → service → questions) cần centralized state
2. **Draft persistence:** Save entire wizard state trước step transitions, không phải form values
3. **File upload:** Outside form scope, need manual state management anyway
4. **Consistency:** Pattern đã dùng ở Phase 74 (controlled inputs, inline validation)
5. **No additional dependency:** Keep bundle size minimal

**When to use react-hook-form:**
- Single-page forms với many fields
- Complex validation rules (Yup/Zod integration)
- Performance critical (uncontrolled inputs reduce re-renders)
- Form-heavy applications (e.g., admin panels)

**Phase 76 không cần react-hook-form vì:**
- Wizard 5 steps, mỗi step chỉ 3-5 fields
- Validation đơn giản (required, email, phone)
- Performance không phải bottleneck
- Team đã familiar với Context + useReducer pattern

---

## 7. Additional Research Areas

### 7.1 Mobile Responsive Strategy

**Breakpoints (from SPEC):**
- Mobile: 640px (1 column domain grid)
- Tablet: 768px (2 columns domain grid)
- Desktop: 1024px (3 columns domain grid)

**Progress Bar:**
- Desktop: Hiện tất cả 5 step names
- Mobile: Compact progress bar % + current step label only (D-11)

**Implementation:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {domains.map(domain => (
    <DomainCard key={domain.key} domain={domain} />
  ))}
</div>
```

**Touch Targets:**
- Tất cả buttons/cards min 44px touch target (SPEC edge coverage)
- Use `min-h-[44px]` và `min-w-[44px]` classes

### 7.2 Domain Icons

**Decision D-09:** Dùng Lucide React icons

**Icon Mapping:**
```typescript
const DOMAIN_ICONS = {
  'commercial-legal': Briefcase,
  'corporate-legal': Building,
  'employment-legal': Users,
  'privacy-legal': Shield,
  'product-legal': Package,
  'regulatory-legal': FileCheck,
  'ai-governance-legal': Bot,
  'ip-legal': Lightbulb,
  'litigation-legal': Scale,
  'legal-clinic': HeartHandshake,
  'law-student': GraduationCap,
  'legal-builder-hub': Wrench,
  'external-plugins': Plug,
} as const;
```

### 7.3 Contact Info Pre-fill

**Implementation:**
```typescript
useEffect(() => {
  async function fetchProfile() {
    try {
      const user = await apiClient.get<UserProfile>('/api/users/me');
      dispatch({
        type: 'SET_CONTACT',
        payload: {
          email: user.email,
          phone: user.phone,
          companyName: user.organization?.name,
          taxCode: user.organization?.taxCode
        }
      });
    } catch (error) {
      // Fallback: empty fields với label "Cập nhật sau"
      console.error('Failed to fetch profile', error);
    }
  }
  fetchProfile();
}, []);
```

### 7.4 Success Message & Redirect

**Decision D-10:**
- Show success message 2s
- Button "Xem hồ sơ của tôi" visible ngay
- Auto-redirect sau 2s về `/${locale}/cases`
- User có thể click button để redirect sớm

**Implementation:**
```typescript
const [submitSuccess, setSubmitSuccess] = useState(false);
const [countdown, setCountdown] = useState(2);

useEffect(() => {
  if (submitSuccess) {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/${locale}/cases`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }
}, [submitSuccess, locale, router]);

if (submitSuccess) {
  return (
    <div className="text-center space-y-4">
      <h2>{t('message.submitSuccess')}</h2>
      <p>{t('message.redirecting', { seconds: countdown })}</p>
      <Button onClick={() => router.push(`/${locale}/cases`)}>
        {t('button.viewCases')}
      </Button>
    </div>
  );
}
```

---

## 8. Testing Strategy

### Unit Tests (Vitest + @testing-library/react)

**Components to test:**
1. `LegalDomainSelector` — render 13 domains, click handler
2. `ServiceTypeList` — filter by domain, render service types
3. `IntakeQuestionsForm` — render questions, validation, onChange
4. `WizardSteps` — progress indicator, step navigation
5. `CreateRequestForm` — wizard flow, state management

**Test scenarios:**
- Happy path: 5-step wizard flow
- Validation errors: required fields, email format
- Draft save/resume
- File upload success/failure
- Network errors (retry logic)
- Empty states (no domains, no services)

### E2E Tests (Playwright)

**Critical paths:**
1. Full 5-step wizard flow (domain → service → questions → upload → review → submit)
2. Draft save at step 3, resume từ `?draftId=xxx`
3. File upload with progress
4. Submit success + redirect to `/cases`
5. Edit from review step (navigate back, edit, return to review)
6. Priority selection (normal/urgent)
7. Contact info pre-fill and edit

**Test data:**
- 13 legal domains (seed data)
- 30+ service types (seed data)
- Mock API responses (draft save, file upload, submit)

### Coverage Target
- Unit tests: ≥ 90% line coverage
- E2E tests: All critical paths covered
- Test types: Whitebox, blackbox, abnormal, error (per REQUIREMENTS.md)

---

## 9. Integration Points

### Existing Code to Reuse

1. **UI Components:**
   - `src/components/ui/button.tsx` — shadcn/ui button pattern
   - `src/components/ui/input.tsx` — Custom Input component (Phase 74)
   - `src/components/shared/LoadingSkeleton.tsx` — Loading states
   - `src/components/shared/EmptyState.tsx` — Empty states

2. **API Client:**
   - `src/lib/api/client.ts` — Central API client với auto-retry
   - `src/lib/api/index.ts` — Domain API modules

3. **Auth & Locale:**
   - `src/hooks/useAuth.ts` — Auth state access
   - `useLocale()` from next-intl — Locale-aware navigation

4. **Seed Data:**
   - `src/lib/i18n/seed-multilingual.ts` — Current SEED_MATTER_TYPES
   - `src/lib/intake/catalog.ts` — getMatterType, getMatterQuestions

5. **Existing Intake APIs:**
   - `POST /api/intake/create-draft` — Draft creation
   - `POST /api/intake/attach-file` — File upload
   - `POST /api/intake/submit` — Submit request

### New Files to Create

1. **Seed Data:**
   - `src/lib/i18n/seed-legal-domains.ts` — 13 domains + 30+ service types

2. **Components:**
   - `src/components/create-request/LegalDomainSelector.tsx`
   - `src/components/create-request/ServiceTypeList.tsx`
   - `src/components/create-request/WizardProvider.tsx`
   - `src/components/create-request/WizardSteps.tsx` (enhance existing)

3. **API Routes:**
   - `src/app/api/intake/draft/save/route.ts`
   - `src/app/api/intake/draft/[id]/route.ts`

4. **i18n:**
   - Add keys to `src/messages/{vi,en,zh,ja}.json`

---

## 10. Risks & Mitigations

### Risk 1: Draft Save Failure
- **Impact:** User lose progress
- **Mitigation:** Toast error, retry button, không block wizard (D-06)
- **Fallback:** LocalStorage temporary save (future enhancement)

### Risk 2: File Upload Timeout
- **Impact:** User wait indefinitely
- **Mitigation:** 30s timeout, auto-retry 3x, cancel button
- **Fallback:** User can skip upload and add files later

### Risk 3: Large State Re-renders
- **Impact:** Performance degradation
- **Mitigation:** Use `useMemo` for expensive computations, `React.memo` for step components
- **Fallback:** Split wizard into separate contexts per step (if needed)

### Risk 4: i18n Key Conflicts
- **Impact:** Wrong translations displayed
- **Mitigation:** Namespace keys (`CreateRequest.*`), code review
- **Fallback:** Fallback to Vietnamese nếu key missing (SPEC constraint)

### Risk 5: Browser Back Button
- **Impact:** User lose wizard state
- **Mitigation:** Keep state in URL query params (`?step=2&domainId=commercial-legal`)
- **Fallback:** Warn user trước khi leave page (beforeunload event)

---

## 11. Open Questions (Resolved)

### Q1: Should questions fetch from API or stay in seed data?
**Answer:** Stay in seed data for MVP. API integration deferred to future phase.

### Q2: Should draft save be debounced or immediate?
**Answer:** Immediate before step transitions (D-03), not debounced. Explicit "Lưu nháp" button for manual save.

### Q3: Should file upload use fetch or XMLHttpRequest?
**Answer:** XMLHttpRequest for progress tracking (fetch doesn't support upload progress). Exception to "fetch-only" rule.

### Q4: Should wizard state persist across page reloads?
**Answer:** Yes, via draft save. User can resume with `?draftId=xxx`.

### Q5: Should review step show all answers or summary only?
**Answer:** All answers with "Chỉnh sửa" buttons (D-08). User can edit any step from review.

---

## 12. Conclusion

Phase 76 là complex wizard với 5 steps, draft persistence, và file upload. Research này đã trả lời 6 câu hỏi trọng tâm:

1. ✅ **Form engine:** Extend existing pattern, không cần FormRenderer
2. ✅ **Draft API:** 2 endpoints (save, load), auto-save trước transitions
3. ✅ **File upload:** Immediate upload với XHR for progress, drag-drop zone
4. ✅ **Validation:** On blur + on submit (Phase 74 pattern)
5. ✅ **i18n:** Translation keys trong `messages/*.json`, service labels từ seed data
6. ✅ **State management:** Context + useReducer (D-01), không cần react-hook-form

**Next Step:** Plan phase với task breakdown (DB → Backend → API → Frontend → Tests)

---

*Research completed: 2026-06-20*  
*Phase: 76-create-request*  
*Ready for: /gsd-plan-phase 76*
