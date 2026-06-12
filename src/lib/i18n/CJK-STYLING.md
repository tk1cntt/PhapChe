# CJK (Chinese/Japanese) Styling Guidelines

## Why CJK is Different

CJK characters are approximately 2x wider than Latin characters.
They also have different line-height and word-break requirements.

## Required Styling

### For CJK Text Containers:

```css
.cjk-text {
  /* Line height - CJK needs more vertical space */
  line-height: 1.8;

  /* Word break - prevent overflow */
  word-break: break-word;
  overflow-wrap: break-word;

  /* Font features for Japanese */
  font-feature-settings: "palt" 1; /* Proportional alternates */

  /* Min-width auto to prevent squishing */
  min-width: 0;
}
```

### For Buttons/Labels with CJK:

```css
.cjk-button {
  /* Allow text to wrap */
  white-space: normal;
  word-break: break-word;

  /* Min-width to prevent squishing */
  min-width: max-content;
}
```

### For Tables with CJK Headers:

```css
.cjk-table th {
  /* CJK headers often longer */
  min-width: 120px;
}
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Text cut off | Fixed width too narrow | Use min-width |
| Vertical overlap | line-height too small | Increase to 1.6-1.8 |
| Character squishing | font-feature-settings off | Enable "palt" for JA |
| Overflow in cards | word-break missing | Add break-word |

## Testing Checklist

### Visual Audit Required For:

- [ ] Dashboard stats cards
- [ ] Table headers and cells
- [ ] Button labels
- [ ] Dropdown options
- [ ] Modal content
- [ ] Form labels
- [ ] Navigation menu

### Test Each Locale:

1. VI - Check normal
2. EN - Check long words
3. ZH - Check wide characters
4. JA - Check character spacing

### Common CJK Issues to Look For:

- Text overflowing container
- Characters overlapping
- Horizontal scrollbar appearing
- Button text cut off
- Table columns misaligned

## Manual i18n Audit Checklist

### Language Switching Test

- [ ] VI -> EN: All labels change
- [ ] EN -> ZH: Layout stable
- [ ] ZH -> JA: Characters display correctly
- [ ] JA -> VI: No regression

### CJK Layout Checks

#### Dashboard
- [ ] Stat cards handle ZH/JA text without overflow
- [ ] Table columns don't squash CJK text

#### Forms
- [ ] Button text wraps correctly in ZH/JA
- [ ] Form labels align properly

#### Navigation
- [ ] Menu items display full text
- [ ] No horizontal scrollbar

### Hardcoded String Check

Search for common Vietnamese patterns:
- [ ] Status labels: Đang, Hoàn, Chờ
- [ ] Buttons: Gửi, Tạo, Xóa, Lưu
- [ ] Navigation: Trang chủ, Hồ sơ

### Report Format

Found issues -> File issue with:
- Screenshot
- Locale
- Component
- Expected vs Actual
