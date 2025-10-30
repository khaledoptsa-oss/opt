# 🧙‍♂️ White Friday Wizard - Implementation Guide

## 📋 Overview

Enhanced 5-stage wizard with strict one-task-per-screen flow, contextual BenefitChat, and comprehensive Saudi cities support.

---

## 🎯 What's New in Wizard Version

### 1. Strict 5-Stage Flow
```
Stage 1: Sector Selection (6 sectors + Other)
  ↓
Stage 2: City Selection (130+ KSA cities + Other)
  ↓
Stage 3: Quick Probe (conditional questions + URL validation)
  ↓
Stage 4: Offers (dynamic unlock + savings calculator)
  ↓
Stage 5: Recap & Actions (WhatsApp + PDF + Call booking)
```

### 2. "Other" Options
- **Sector**: Choose from 6 predefined or enter custom sector
- **City**: Select from 130+ Saudi cities or enter manually
- Both stored in separate fields (`customSector`, `customCity`)

### 3. Conditional Questions
- **E-commerce**: Always asks for `store_url` (required)
- **Other sectors**:
  - First: "Do you have a website?" (yes/no)
  - If yes → Show URL input field
  - URL validated with `https?://` pattern

### 4. BenefitChat Component
Event-driven assistant that provides contextual messages:

**Triggers:**
- Stage change
- Sector selected
- City selected
- Bundle added/removed
- Duration changed
- URL entered

**Message Types:**
- Welcome messages per stage
- Sector-specific tips
- City-specific insights
- Bundle explanations
- Duration benefits

### 5. Comprehensive Saudi Cities
- 13 regions
- 130+ cities
- Fast search with 150ms debounce
- Virtualized list for performance
- Manual input fallback

---

## 🗂️ File Structure

### New Data Files

```
data/
├── cities-sa.json          # 130+ KSA cities by region
├── probes.json            # Conditional questions per sector
└── explainers.json        # BenefitChat messages
```

### New Code Files

```
js/
└── app-wizard.js          # Complete wizard logic (18KB)

css/
└── wizard.css             # Wizard-specific styles (17KB)

index-wizard.html          # Main wizard entry point
```

---

## 📊 Data Schemas

### cities-sa.json

```json
{
  "version": "1.0",
  "regions": [
    {
      "name": "المدينة المنورة",
      "cities": ["المدينة المنورة", "ينبع", "العلا", ...]
    },
    ...
  ],
  "other": {
    "label": "أخرى",
    "placeholder": "اكتب اسم مدينتك"
  }
}
```

**Coverage:**
- Riyadh region: 16 cities
- Makkah region: 16 cities
- Eastern Province: 14 cities
- Asir region: 15 cities
- Qassim region: 13 cities
- + 8 more regions
- **Total: 130+ cities**

### probes.json

```json
{
  "version": "1.0",
  "sectors": {
    "restaurants": [
      {
        "id": "has_site",
        "type": "boolean",
        "label": "هل لديك موقع إلكتروني؟",
        "required": true
      },
      {
        "id": "site_url",
        "type": "url",
        "label": "رابط موقعك",
        "required": true,
        "dependsOn": {
          "has_site": true
        }
      },
      ...
    ],
    "ecommerce": [
      {
        "id": "store_url",
        "type": "url",
        "label": "رابط متجرك الإلكتروني",
        "required": true
      }
    ]
  }
}
```

**Question Types:**
- `boolean`: Yes/No buttons
- `url`: URL input with validation
- `select`: Dropdown with "Other" support

**Features:**
- Conditional display via `dependsOn`
- URL pattern validation
- Required/optional flags
- "Other" support for selects

### explainers.json

```json
{
  "global": {
    "welcome": "مرحباً! سأساعدك...",
    "duration_tip": {
      "m3": "ثلاثة أشهر توفّر 10 بالمئة...",
      ...
    },
    "washeej_intro": "وشيج منصّة..."
  },
  "restaurants": {
    "hook": "المنيو الإلكتروني يقلّل...",
    "web_pro": "صفحة هبوط...",
    "city_context": {
      "الرياض": "الرياض سوق ضخم..."
    }
  },
  ...
}
```

**Message Categories:**
- Global hints
- Sector-specific tips
- Bundle explanations
- City context
- Stage welcome messages

---

## 🎨 UI Components

### Stage Progress

```html
<div class="stage-progress-wrapper">
  <div class="stage-counter">2/5</div>
  <div class="stage-progress-label">المدينة</div>
  <div class="stage-progress-bar">
    <div class="stage-progress-fill" style="width: 40%"></div>
  </div>
</div>
```

### Sector List (Stage 1)

- Vertical cards with icon + title + description
- Click to select
- Shows custom input when "Other" selected
- Keyboard accessible (Tab + Enter)

### City Search (Stage 2)

- Fast search input (150ms debounce)
- Cities grouped by region
- Virtualized list for 130+ items
- "Other" option with manual input

### Probe Questions (Stage 3)

- Boolean: Side-by-side Yes/No buttons
- URL: Text input with validation
- Select: Dropdown with "Other" support
- Conditional display based on dependencies

### Bundle Grid (Stage 4)

- Hook bundle auto-selected
- Unlock logic shows/hides bundles
- "Why useful?" button per card
- Savings bar updates live
- Duration selector (1/3/6/12 months)

### Recap (Stage 5)

- Sector + city (or custom values)
- Website URL if provided
- Selected bundles list
- Price breakdown
- 3 CTA buttons:
  1. WhatsApp (pre-filled message)
  2. PDF Download
  3. Book Call (Calendly)

### BenefitChat

```html
<div class="benefit-chat">
  <div class="benefit-chat-header">
    <span class="chat-avatar">💡</span>
    <span class="chat-title">مساعدك الذكي</span>
  </div>
  <div class="benefit-chat-messages">
    <!-- Messages rendered here -->
  </div>
</div>
```

**Position:**
- Desktop: Fixed bottom-left
- Mobile: Relative, below wizard

**Behavior:**
- Max 3 visible messages
- Older messages auto-collapse
- Smooth slide-in animation
- Event-driven updates

---

## ⚙️ Wizard Logic

### State Management

```javascript
const WizardState = {
  // Data
  sectors: null,
  cities: null,
  probes: null,
  explainers: null,

  // Progress
  currentStage: 0,

  // Selections
  sector: null,
  customSector: null,
  city: null,
  customCity: null,
  probeAnswers: {},
  selectedBundles: [],
  billingPeriod: 'm1'
};
```

**Saved to LocalStorage:**
- Current stage
- All selections
- Custom values
- Probe answers
- Bundle choices

### Validation

**Per-Stage Validation:**

```javascript
function validateCurrentStage() {
  switch (currentStage) {
    case 0: // Sector
      return sector && (sector !== 'other' || customSector?.length >= 3);

    case 1: // City
      return city && (city !== 'other' || customCity?.length >= 2);

    case 2: // Probe
      // Check all required questions answered
      // Validate URLs with regex

    case 3: // Offers
      return selectedBundles.length > 0;

    case 4: // Recap
      return true;
  }
}
```

**Next Button:**
- Disabled until stage valid
- Checks validation on every input change

### Event System

```javascript
Events.on('stageChange', (data) => {
  BenefitChat.onStageChange(data);
});

Events.on('bundleToggled', (data) => {
  BenefitChat.onBundleToggled(data);
});

// Emit events:
Events.emit('citySelected', { city: 'الرياض' });
```

**Benefits:**
- Decoupled components
- BenefitChat reacts without tight coupling
- Easy to extend

### URL Validation

```javascript
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}
```

**User Feedback:**
- Real-time error message
- Red border on invalid input
- Clear hint text

---

## 💬 WhatsApp Integration

### Enhanced Message Format

```javascript
const message = `مرحباً فريق الهدف الأمثل،

أود الاستفسار عن عرض الجمعة البيضاء:

📋 التفاصيل:
• النشاط: ${sectorLabel}
• المدينة: ${cityLabel}
${websiteUrl ? `• الموقع الحالي: ${websiteUrl}` : ''}
• مدة التعاقد: ${period}

🎁 الخدمات المختارة:
  • ${bundlesTitles}

💰 الأسعار:
• السعر قبل التوفير: ${subtotal}
• التوفير: ${discount}
• الإجمالي بعد الخصم: ${total}

أود إتمام العرض أو التحدث مع مستشار.`;
```

**Includes:**
- Custom sector/city if "Other" chosen
- Website URL (site_url or store_url)
- All selected bundles
- Complete pricing breakdown

---

## 🚀 How to Run

### Local Development

```bash
# Navigate to project
cd white-friday-funnel

# Start server (choose one):
python -m http.server 8000
# or
php -S localhost:8000
# or
npx serve

# Open browser
open http://localhost:8000/index-wizard.html
```

### File Checklist

Ensure these files exist:
- ✅ `index-wizard.html`
- ✅ `js/app-wizard.js`
- ✅ `js/pdf.js`
- ✅ `css/styles.css`
- ✅ `css/components.css`
- ✅ `css/wizard.css`
- ✅ `data/sectors.json`
- ✅ `data/cities-sa.json`
- ✅ `data/probes.json`
- ✅ `data/explainers.json`

---

## 🧪 Testing Scenarios

### Test Case 1: Restaurant in Madinah

1. **Stage 1:** Select "مطاعم"
2. **Stage 2:** Select "المدينة المنورة"
3. **Stage 3:**
   - Do you have a website? → No
   - Do you have e-menu? → No
   - Do you offer delivery? → Yes
   - Avg orders? → "20-80 طلب"
4. **Stage 4:**
   - Hook (auto-selected)
   - Add "صفحة هبوط"
   - Change duration to "12 شهر"
5. **Stage 5:**
   - Verify recap shows all selections
   - Click WhatsApp → Check message format

**Expected BenefitChat Messages:**
- Welcome message
- Sector welcome
- City context: "المدينة فيها منافسة..."
- Bundle explanation when adding web_pro
- Duration tip: "سنة كاملة توفّر 35%..."

### Test Case 2: E-commerce with Store URL

1. **Stage 1:** Select "متاجر إلكترونية"
2. **Stage 2:** Select "جدة"
3. **Stage 3:**
   - Store URL: `https://mystore.com` (required)
   - Product count: "10-50 منتج"
   - Has payment: Yes
4. **Stage 4:**
   - Add bundles
5. **Stage 5:**
   - Verify store URL appears in recap
   - WhatsApp message includes URL

### Test Case 3: Custom Sector + City

1. **Stage 1:** Select "أخرى" → Enter "صالون تجميل"
2. **Stage 2:** Select "أخرى" → Enter "حائل"
3. **Stage 3:** Answer questions for "other" sector
4. **Stage 4:** Select bundles
5. **Stage 5:**
   - Verify custom sector shows: "صالون تجميل"
   - Verify custom city shows: "حائل"
   - WhatsApp message uses custom values

### Test Case 4: URL Validation

1. Navigate to Stage 3
2. Enter invalid URLs:
   - `example.com` (missing http)
   - `ftp://site.com` (wrong protocol)
   - `javascript:alert(1)` (XSS attempt)
3. **Expected:** Error message, red border, Next disabled
4. Enter valid URL: `https://example.com`
5. **Expected:** Error clears, Next enabled

### Test Case 5: City Search

1. Stage 2: Click city search
2. Type "الر"
3. **Expected:** Shows only cities containing "الر" (الرياض, الريث, الرس, etc.)
4. Clear search
5. **Expected:** All cities reappear, grouped by region
6. Scroll down
7. **Expected:** Smooth scroll, no lag (virtualized)

### Test Case 6: BenefitChat Reactions

1. Complete each stage and observe BenefitChat
2. **Expected messages:**
   - Stage 1: Sector welcome
   - Stage 2: City context (if available)
   - Stage 3: Probe welcome
   - Stage 4: Offers welcome
   - When adding bundle: Bundle explanation
   - When changing duration: Duration tip

---

## 📊 Performance Targets

### Bundle Size

```
app-wizard.js:  18KB  ✅
wizard.css:     17KB  ✅
cities-sa.json: 4KB   ✅
probes.json:    4KB   ✅
explainers.json: 6KB  ✅

Total JS: 18KB (9% of 200KB limit!) ✅
```

### Lighthouse Goals

- Performance: ≥ 95
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 95

### Features

- ✅ Debounced search (150ms)
- ✅ Virtualized city list
- ✅ Event-driven BenefitChat
- ✅ LocalStorage persistence
- ✅ Smooth transitions (250-300ms)

---

## 🎯 Key Differences from Original

| Feature | Original | Wizard |
|---------|----------|--------|
| Stages | 4 steps | 5 strict stages |
| Cities | 4 cities | 130+ cities |
| Other option | No | Yes (sector + city) |
| URL questions | No | Conditional URLs |
| BenefitChat | No | Event-driven assistant |
| Validation | Basic | Per-stage strict |
| Search | No | Debounced + virtualized |
| Progress | Stepper | Stage counter + bar |
| Messages | Static | Dynamic + contextual |

---

## 🔧 Customization

### Add New City

Edit `data/cities-sa.json`:

```json
{
  "name": "المنطقة",
  "cities": ["المدينة الجديدة", ...]
}
```

### Add New Question

Edit `data/probes.json`:

```json
{
  "id": "new_question",
  "type": "boolean",
  "label": "سؤال جديد؟",
  "required": false
}
```

### Add BenefitChat Message

Edit `data/explainers.json`:

```json
"restaurants": {
  "new_bundle": "رسالة توضيحية للباقة..."
}
```

### Change Discounts

Edit `data/sectors.json`:

```json
"billing_discounts": {
  "m3": 0.15,   // 15% instead of 10%
  "m6": 0.25,   // 25% instead of 18%
  "y12": 0.40   // 40% instead of 35%
}
```

---

## 🐛 Troubleshooting

### Issue: Cities not loading

**Solution:**
```javascript
// Check console for errors
// Verify data/cities-sa.json exists
// Check network tab for 404
```

### Issue: Next button always disabled

**Solution:**
```javascript
// Open console
console.log(WizardState);
// Check which validation is failing
```

### Issue: BenefitChat not showing

**Solution:**
```html
<!-- Verify element exists in HTML -->
<div id="benefitChat"></div>

<!-- Check console for Events -->
Events.emit('test', {});
```

### Issue: WhatsApp message truncated

**Solution:**
```javascript
// URL length limit ~2000 chars
// Message is automatically truncated in browser
// All data still accessible in state
```

---

## 📝 Notes

1. **RTL by default:** All text, layout, animations respect right-to-left
2. **Keyboard navigation:** Full Tab + Enter support
3. **Mobile responsive:** BenefitChat moves to bottom
4. **Accessibility:** ARIA labels, focus states, color contrast AA
5. **Performance:** Lazy load, debounce, virtualize
6. **Security:** URL validation, XSS prevention, input sanitization

---

## 🎉 Summary

The wizard version provides:

- ✅ Stricter, clearer user flow
- ✅ Comprehensive KSA cities coverage
- ✅ Smart conditional questions
- ✅ Contextual education via BenefitChat
- ✅ Enhanced WhatsApp messages with URLs
- ✅ Better validation and error handling
- ✅ Improved performance and UX

**Total implementation:** ~18KB JS + ~17KB CSS = **35KB total** (17.5% of budget!)

---

**Ready to use!** 🚀

Open `index-wizard.html` and experience the enhanced funnel.
