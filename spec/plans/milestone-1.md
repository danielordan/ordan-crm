# Plan — Milestone 1: Project Foundation & App Shell

מקורות: [MILESTONES.md](../MILESTONES.md) (Milestone 1), [ARCHITECTURE.md](../ARCHITECTURE.md) סעיפים 3, 5, 6.2, 12.3, 16, 17, 18, 19, [DESIGN.md](../DESIGN.md) סעיפים 1.0 ו-2, והתמונות `wireframes.png`, `mockups.png`, `style-guide.png`.

---

## 1. היקף

**בתוך ה-Milestone:**
- שתי אפליקציות שרצות מקומית: `frontend` (Next.js) ו-`backend` (NestJS), עם פקודה אחת שמריצה את שתיהן.
- הגנת סיסמה (Basic Auth), Proxy מאובטח מה-Frontend ל-Backend, API Key Guard, Health, Logging, Exception filter ו-Rate limiting.
- Design tokens, רכיבי בסיס, App Shell עם סרגל ניווט, ו-4 Routes עם כותרות בלבד.
- Lint, Formatter ו-Tests לשתי האפליקציות. `.env.example`, README ועדכון `CLAUDE.md`.

**מחוץ ל-Milestone (לא לבנות עכשיו):**
- אין חיבור ל-MongoDB, אין Migrations ואין Seed (Milestone 2).
- אין OpenAI ואין SES (Milestone 4).
- אין Dockerfile ואין פריסה (Milestone 5).
- אין תוכן אמיתי במסכים: טבלה, טופס העלאה, פרטי לקוח וכו' — רק כותרות.
- ה-Proxy routes של `/api/clients` ו-`/api/documents/process` עדיין לא נוצרים. נבנה רק ה-helper הכללי ו-Route בדיקה אחד.

**אין צורך בחשבונות חיצוניים ב-Milestone זה.** המשתמש רק ממלא שני ערכים ב-`.env` (ראה סעיף 8).

---

## 2. מבנה ה-Repository

npm workspaces בשורש, עם שתי אפליקציות:

```text
ordan-crm-leads/
├── package.json            ← workspaces: ["frontend", "backend"], root scripts
├── package-lock.json
├── .nvmrc                  ← 24
├── .prettierrc.json        ← shared Prettier config
├── .prettierignore
├── README.md
├── CLAUDE.md               ← update "פקודות הרצה"
├── spec/ ...
├── backend/
└── frontend/
```

**Root scripts** (`package.json`):

| Script | פעולה |
|---|---|
| `npm run dev` | מריץ את שתי האפליקציות במקביל עם `concurrently` (שמות צבעוניים `backend` / `frontend`) |
| `npm run lint` | `lint` בשתי האפליקציות |
| `npm test` | `test` בשתי האפליקציות |
| `npm run format` | Prettier על כל ה-Repository |
| `npm run format:check` | בדיקת Prettier בלי שינוי |

`engines.node` = `>=24`. התקנה אחת: `npm install` בשורש.

**`.gitignore`:** לא מחליפים. הכיסוי הקיים (`.env`, `node_modules/`, `dist/`, `.next/`, `coverage/`, `*.tsbuildinfo`) מספיק. אם בזמן הבנייה תופיע תיקיית cache/build שלא מכוסה — מוסיפים שורה.

---

## 3. Backend (`backend/`)

### 3.1 טכנולוגיה
- Node.js 24, NestJS (הגרסה היציבה האחרונה, 11.x), TypeScript strict.
- Express platform (ברירת המחדל של NestJS).
- חבילות: `@nestjs/config`, `zod` (ולידציה של משתני סביבה), `nestjs-pino` + `pino-http` (לוגים), `@nestjs/throttler` (Rate limiting).
- Dev: `jest`, `ts-jest`, `supertest`, `eslint` (flat config, `typescript-eslint`), `prettier`, `pino-pretty` (לוגים קריאים בפיתוח בלבד).

### 3.2 קבצים

```text
backend/
├── package.json
├── tsconfig.json / tsconfig.build.json
├── nest-cli.json
├── eslint.config.mjs
├── jest.config.ts
├── .env.example
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── clients/clients.module.ts             ← empty module (M2–M3)
│   ├── documents/documents.module.ts         ← empty module (M4)
│   ├── processing/processing.module.ts       ← empty module (M3–M4)
│   ├── extraction/extraction.module.ts       ← empty module (M4)
│   ├── notifications/notifications.module.ts ← empty module (M4)
│   └── common/
│       ├── config/
│       │   ├── env.schema.ts                 ← zod schema for section 19
│       │   └── app-config.module.ts          ← ConfigModule.forRoot({ validate })
│       ├── guards/api-key.guard.ts
│       ├── filters/all-exceptions.filter.ts
│       ├── logging/logging.module.ts         ← nestjs-pino setup + request ID
│       └── system/
│           ├── health.controller.ts          ← GET /health
│           └── ping.controller.ts            ← GET /api/v1/ping (internal test endpoint)
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

תיקיית `migrations/` וקבצי ה-services/controllers של ה-Modules **לא** נוצרים ב-Milestone זה. ה-Modules הריקים נרשמים ב-`AppModule`, כדי שהמבנה של סעיף 6.2 יהיה קיים ויתמלא ב-Milestones הבאים.

### 3.3 Config (סעיף 19)
`env.schema.ts` מגדיר את כל המשתנים של סעיף 19. ב-Milestone זה:

| משתנה | ב-M1 | ברירת מחדל |
|---|---|---|
| `BACKEND_API_KEY` | **חובה**, לפחות 16 תווים | — |
| `API_PORT` | אופציונלי | `4000` |
| `LOG_LEVEL` | אופציונלי, enum של pino | `info` |
| `MAX_UPLOAD_BYTES` | אופציונלי, מספר | `4194304` |
| `OPENAI_TIMEOUT_MS` | אופציונלי, מספר | `60000` |
| `MONGODB_URI`, `MONGODB_DATABASE`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EXTRACTION_PROMPT_VERSION`, `AWS_REGION`, `SES_FROM_ADDRESS`, `ADMIN_REVIEW_EMAIL` | אופציונלי ב-M1. יהפכו לחובה ב-Milestone שמשתמש בהם | — |

- אם הולידציה נכשלת, ה-Backend לא עולה, ומודפסת הודעה ברורה עם **שמות** המשתנים הבעייתיים בלבד, בלי הערכים.
- הגישה לערכים בקוד דרך `ConfigService` עם טיפוס (`ConfigService<Env, true>`), לא דרך `process.env` ישירות.
- `.env` נטען מ-`backend/.env`.

### 3.4 `main.ts`
- `app.setGlobalPrefix('api/v1', { exclude: ['health'] })` — כך `/health` נשאר בשורש וכל השאר תחת `/api/v1`.
- `bufferLogs: true` + `app.useLogger(app.get(Logger))` מ-nestjs-pino.
- CORS **כבוי** (לא קוראים ל-`enableCors`), לפי סעיף 16.1.
- `app.disable('x-powered-by')`.
- `app.enableShutdownHooks()`.
- האזנה על `API_PORT`.

### 3.5 Logging (סעיף 18, 16.7)
- `nestjs-pino`, פלט JSON. ב-`NODE_ENV !== 'production'` פלט קריא דרך `pino-pretty` (dev בלבד; ב-Production תמיד JSON).
- **Request ID:** `genReqId` לוקח את הכותרת `X-Request-Id` אם קיימת ותקינה (עד 128 תווים, אותיות/ספרות/`-`/`_`), אחרת יוצר `crypto.randomUUID()`. ה-ID מוחזר ב-Response בכותרת `X-Request-Id`, ומופיע בכל שורת לוג של הבקשה.
- **Redaction:** `req.headers["x-api-key"]`, `req.headers.authorization`, `req.headers.cookie` מוסתרים.
- לוג הבקשה כולל method, url, status, responseTime — בלי body.

### 3.6 Global exception filter (סעיף 16.5, 17)
`AllExceptionsFilter` נרשם גלובלית (`APP_FILTER`):
- `HttpException` → מחזיר את ה-status שלו, ו-body בפורמט אחיד:
  ```json
  { "error": "<CODE>", "message": "<safe message>", "requestId": "<id>" }
  ```
  `CODE` נגזר מה-status: `BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`, `TOO_MANY_REQUESTS` וכו'. אם ה-exception נזרק עם `{ error: 'SOME_CODE' }` (כמו `DUPLICATE_CLIENT` בעתיד) — הקוד הזה נשמר.
- כל שגיאה אחרת → `500` עם `{ "error": "INTERNAL_ERROR", "message": "Something went wrong.", "requestId": "..." }`. ה-stack trace נרשם **רק בלוג**, לעולם לא ב-Response.

### 3.7 `GET /health` (סעיף 12.3)
- `200` עם `{ "status": "ok" }`.
- לא דורש מפתח API, לא בודק שירותים חיצוניים, ופטור מ-Rate limiting (`@SkipThrottle()`), כי App Runner קורא לו בתדירות גבוהה.

### 3.8 API Key Guard (סעיף 16.1)
- נרשם גלובלית (`APP_GUARD`). חל על כל route **מלבד** routes שמסומנים ב-decorator `@Public()` (רק `/health`).
- קורא את הכותרת `X-API-Key` ומשווה ל-`BACKEND_API_KEY` בהשוואה constant-time (`crypto.timingSafeEqual` על SHA-256 של שני הערכים, כדי שאורך שונה לא יזרוק).
- חסר או שגוי → `401` עם `{ "error": "UNAUTHORIZED", "message": "Invalid or missing API key." }`.
- המפתח עצמו לא נרשם בלוג.

### 3.9 Rate limiting (סעיף 16.1)
- `@nestjs/throttler` גלובלי: **300 בקשות לדקה** לכל IP. חריגה → `429` (`TOO_MANY_REQUESTS`) דרך ה-filter.
- הערה: כל הבקשות מגיעות משרת ה-Next.js, ולכן בפועל זו מגבלה כוללת. 300/דקה רחב מספיק למשתמש יחיד וחוסם הצפה.
- סדר ה-Guards: Throttler **קודם** ואחריו API Key Guard, כדי שגם ניסיונות לנחש את המפתח יוגבלו. (נרשמים ב-`AppModule` בסדר הזה.)
- הערכים (`ttl`, `limit`) הם קבועים בקוד, לא משתני סביבה — כדי לא להוסיף משתנים שלא מופיעים בסעיף 19.

### 3.10 Endpoint בדיקה פנימי
- `GET /api/v1/ping` → `200` עם `{ "status": "ok" }`. מוגן ב-API Key כמו כל `/api/v1/*`.
- מטרתו: לבדוק ב-Milestone זה שה-Proxy וה-Guard עובדים מקצה לקצה. הוא לא חלק מה-API העסקי ואינו מוצג בממשק. יוסר כשיהיו endpoints אמיתיים (Milestone 2), יחד עם ה-Route התואם ב-Frontend.

### 3.11 Backend tests
**Unit** (`src/**/*.spec.ts`):
- `ApiKeyGuard`: מפתח נכון עובר; חסר / שגוי / באורך שונה → נכשל; route עם `@Public()` עובר בלי מפתח.
- `AllExceptionsFilter`: `HttpException` מחזיר status וקוד נכונים; `Error` רגיל מחזיר 500 עם הודעה כללית ובלי stack/message פנימי.
- `env.schema`: חסר `BACKEND_API_KEY` → שגיאה; ברירות מחדל מוחלות.

**E2E** (`test/app.e2e-spec.ts`, supertest על אפליקציה מלאה עם `BACKEND_API_KEY` של בדיקה):
- `GET /health` בלי מפתח → 200.
- `GET /api/v1/ping` בלי מפתח → 401; מפתח שגוי → 401; מפתח נכון → 200.
- `GET /api/v1/does-not-exist` עם מפתח → 404 בפורמט האחיד.
- Response מכיל `X-Request-Id`; `X-Request-Id` שנשלח בבקשה מוחזר כמו שהוא.
- Rate limit: חריגה מהמכסה → 429 (בבדיקה עם מכסה מוקטנת דרך override של ה-module).

Scripts: `test` (unit + e2e), `test:unit`, `test:e2e`, `lint`, `dev` (`nest start --watch`), `build`, `start`.

---

## 4. Frontend (`frontend/`)

### 4.1 טכנולוגיה
- Next.js (הגרסה היציבה האחרונה), React, TypeScript strict, App Router.
- **Tailwind CSS v4** עם design tokens ב-`@theme` בתוך `globals.css`.
- גופן **Inter** דרך `next/font/google`.
- אייקונים: `lucide-react` (סעיף 2.10).
- Dev: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `eslint` (`eslint-config-next`), `prettier`, `prettier-plugin-tailwindcss`.

> **שם קובץ ה-Middleware:** ב-Next.js 16 ומעלה הקובץ שנקרא בעבר `middleware.ts` נקרא `proxy.ts` (אותה יכולת, שם חדש). בזמן הבנייה בודקים את הגרסה המותקנת ומשתמשים בשם הנכון לה. במסמך זה "Middleware" מתייחס ליכולת, לא לשם הקובץ. ההחלטה תתועד כ-ADR (סעיף 9).

### 4.2 קבצים

```text
frontend/
├── package.json
├── next.config.ts              ← redirect "/" → "/clients"
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.ts / vitest.setup.ts
├── postcss.config.mjs
├── .env.example
└── src/
    ├── middleware.ts | proxy.ts   ← Basic Auth (name per Next version)
    ├── lib/
    │   ├── basic-auth.ts          ← pure check function (testable)
    │   ├── backend-proxy.ts       ← generic proxy helper
    │   └── cn.ts                  ← className join helper
    ├── app/
    │   ├── layout.tsx             ← html/body, Inter, AppShell
    │   ├── globals.css            ← Tailwind + @theme tokens
    │   ├── icon.svg               ← simple favicon in brand colors
    │   ├── clients/page.tsx       ← <h1>Clients</h1>
    │   ├── clients/[id]/page.tsx  ← <h1>Client Details</h1>
    │   ├── upload/page.tsx        ← <h1>Upload PDF</h1>
    │   ├── dev/components/page.tsx← component preview (development only, see 4.8)
    │   └── api/ping/route.ts      ← proxy test route → /api/v1/ping
    └── components/
        ├── layout/AppShell.tsx
        ├── layout/Sidebar.tsx
        ├── layout/SidebarDecoration.tsx
        └── ui/
            ├── Button.tsx
            ├── Input.tsx
            ├── Select.tsx
            ├── StatusBadge.tsx
            ├── Card.tsx
            ├── Alert.tsx
            └── Modal.tsx
```

### 4.3 Basic Auth (סעיף 5.1, 16.1)
- רץ על **כל** הבקשות: דפים, `/api/*` וקבצים סטטיים (`matcher` שתופס הכל).
- קורא `Authorization: Basic <base64>`, מפענח, **מתעלם משם המשתמש**, ומשווה את הסיסמה ל-`SITE_PASSWORD` בהשוואה constant-time (לולאת XOR ידנית, כי ה-runtime של ה-Middleware לא תמיד כולל `crypto.timingSafeEqual`).
- חסר / שגוי → `401` עם הכותרת `WWW-Authenticate: Basic realm="Ordan Cargo Future Clients", charset="UTF-8"` וגוף טקסט קצר `Authentication required.` — זה מה שגורם לדפדפן להציג את חלון הסיסמה.
- **Fail closed:** אם `SITE_PASSWORD` לא מוגדר, כל בקשה נחסמת ב-`500` עם `Site password is not configured.` (בלי פרטים נוספים).
- הלוגיקה עצמה ב-`lib/basic-auth.ts` כפונקציה טהורה, וה-Middleware רק קורא לה — כדי שאפשר לבדוק אותה ב-unit tests.

### 4.4 Proxy helper (סעיף 5.1, 5.3)
`lib/backend-proxy.ts` — פונקציה `proxyToBackend(request, backendPath)` שכל Route Handler עתידי ישתמש בה:
- בונה URL: `${BACKEND_API_URL}${backendPath}` + ה-query string המקורי.
- מעביר method, body (כ-stream/ArrayBuffer, כך שגם `multipart/form-data` יעבוד ב-Milestone 4) ו-`Content-Type`.
- מוסיף `X-API-Key: BACKEND_API_KEY` ו-`X-Request-Id` (חדש, `crypto.randomUUID()`).
- **לא** מעביר את הכותרות `Authorization` ו-`Cookie` של הדפדפן ל-Backend.
- מחזיר ל-Browser את ה-status וה-body של ה-Backend כמו שהם, עם `Content-Type`.
- אם ה-Backend לא זמין (שגיאת רשת) → `502` עם `{ "error": "BACKEND_UNAVAILABLE", "message": "Something went wrong. Please try again." }`. אם משתני הסביבה חסרים → `500` עם הודעה כללית. אין חשיפה של ה-URL או של ה-error המקורי.
- `BACKEND_API_URL` ו-`BACKEND_API_KEY` נקראים מ-`process.env` בצד השרת בלבד; אין שימוש ב-`NEXT_PUBLIC_*`. הקובץ מתחיל ב-`import 'server-only'` כדי שלא ייכנס בטעות לקוד הדפדפן.
- Route Handlers מגדירים `export const runtime = 'nodejs'` ו-`export const dynamic = 'force-dynamic'`.

`app/api/ping/route.ts`: `GET` → `proxyToBackend(request, '/api/v1/ping')`. מיועד לבדיקת ה-DoD בלבד, ויוסר ב-Milestone 2.

### 4.5 Design tokens (DESIGN סעיף 2)
ב-`globals.css` תחת `@theme`:

| קבוצה | Tokens |
|---|---|
| צבעים (2.2) | `primary #00C8C8`, `navy #0F1B3D`, `primary-light #E6FBFB`, `accent #B2EBF2`, `success #22C55E`, `warning #F59E0B`, `error #EF4444`, `info #3B82F6`, `background #F8FAFC`, `surface #FFFFFF`, `border #E5E7EB`, `text-primary #0F172A`, `text-secondary #64748B` |
| גוונים נגזרים | גוונים בהירים לרקעי Badges/Alerts (למשל `success-light`, `error-light`, `warning-light`, `info-light`) וגוון Hover/Pressed ל-Primary — **נגזרים** מהצבעים שלמעלה לפי ה-Style Guide, לא צבעים חדשים |
| גופן (2.3) | `--font-sans` = Inter |
| Typography (2.3) | מחלקות/utilities: `h1` 32/Bold, `h2` 24/Semibold, `h3` 18/Semibold, `subtitle` 16/Medium, `body-lg` 16, `body` 14, `body-sm` 12 |
| Spacing (2.12) | 8px grid — סקאלת ה-spacing של Tailwind (`2`=8px, `4`=16px, `6`=24px, `8`=32px) |
| Radius (2.11) | `--radius-card: 12px`; Buttons/Inputs `8px` (לפי ה-Style Guide) |
| Shadow (2.11) | `--shadow-card: 0 4px 16px rgba(15, 23, 42, 0.08)` |

`body`: רקע `background`, טקסט `text-primary`, גודל `body` (14px).

### 4.6 רכיבי בסיס (DESIGN 2.4–2.8, Style Guide סעיפים 03–05)

| רכיב | API עיקרי | פרטים |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'destructive' \| 'destructive-outline'`, `icon?`, `disabled`, וכל props של `<button>` | Primary: Teal + טקסט לבן. Secondary: לבן + border עדין + טקסט Navy. Destructive: אדום מלא + לבן (ב-Modal). Destructive-outline: border/טקסט אדומים על לבן (Delete ב-Client Details, לפי DESIGN 2.4). מצבי Hover, Pressed (active), Disabled ו-focus-visible בטבעת Teal. |
| `Input` | `icon?` (למשל `Search`), props של `<input>` | רקע לבן, border `#E5E7EB`, radius 8px, גובה קבוע (40px), placeholder בצבע Text Secondary, focus בטבעת Teal עדינה. |
| `Select` | `options: {value,label}[]`, props של `<select>` | `<select>` נייטיבי מעוצב, עם `ChevronDown` מימין, באותו גובה וסגנון כמו `Input`. |
| `StatusBadge` | `status: 'Success' \| 'Failed'` | Pill קטן. Success: רקע ירוק בהיר + טקסט ירוק. Failed: רקע אדום בהיר + טקסט אדום. הטקסט תמיד מוצג (2.7). רק שני הסטטוסים האלה (1.6). |
| `Card` | `title?`, `children` | Surface לבן, border עדין, radius 12px, padding 24px, `shadow-card`. |
| `Alert` | `variant: 'success' \| 'info' \| 'warning' \| 'error'`, `title?`, `children`, `action?` | רקע צבעוני בהיר מאוד, אייקון מתאים: Success → `CircleCheck`, Warning/Error → `AlertTriangle`/`CircleAlert`, Info → `Info`. `role="status"` (או `role="alert"` ל-error). `action` מאפשר כפתור כמו **Try Again**. |
| `Modal` | `open`, `onClose`, `title`, `icon?`, `children`, `footer` | Overlay כהה-שקוף, Card מרכזי, כפתור Close (`X`) בפינה, סגירה ב-Escape ובלחיצה על הרקע, `role="dialog"` + `aria-modal` + `aria-labelledby`, פוקוס עובר לחלון בפתיחה וחוזר בסגירה. מבוסס על `<dialog>` נייטיבי כדי להימנע מספרייה נוספת. |

הרכיבים נבנים עכשיו כדי שה-Milestones הבאים ישתמשו בהם; רובם עוד לא מופיעים במסכים האמיתיים ב-Milestone זה.

### 4.7 App Shell (DESIGN 1.0, Mockups)
- `layout.tsx` עוטף כל דף ב-`AppShell`: `Sidebar` קבוע משמאל (רוחב ~240px, גובה מלא), ואזור תוכן מימין עם רקע `background` ו-padding של 32px.
- **Sidebar:** רקע Navy.
  - למעלה: שם המערכת בשתי שורות כמו ב-Mockups — `Ordan Cargo` בלבן ו-`Future Clients` ב-Teal, H3 Bold.
  - פריטי ניווט עם אייקון: **Clients** (`Users`) → `/clients`, **Upload PDF** (`Upload`) → `/upload`.
  - הפריט הפעיל מודגש (רקע Navy בהיר יותר + פס/טקסט Teal), לפי `usePathname()`. `/clients/[id]` מדגיש את **Clients**.
  - `aria-current="page"` על הפריט הפעיל. `<nav aria-label="Main">`.
  - למטה: `SidebarDecoration` — SVG של צורות מופשטות מעוגלות בגווני Teal (DESIGN 2.11).
- `Sidebar` הוא Client Component (בגלל `usePathname`); שאר ה-Shell נשאר Server Component.
- Desktop בלבד — אין התאמה למובייל.
- `<html lang="en" dir="ltr">`, ו-`metadata.title` = `Ordan Cargo Future Clients`.

**הערה על Wireframes מול Mockups:** ב-Wireframes שם המערכת מופיע בפס עליון, וב-Mockups ובטקסט של DESIGN 1.0 הוא בראש הסרגל. DESIGN.md מנצח על פריסה, ולכן — בראש הסרגל, בלי פס עליון.

### 4.8 Routes
- `/` → redirect ל-`/clients` דרך `redirects()` ב-`next.config.ts` (`permanent: false`).
- `/clients` → H1 **Clients**.
- `/clients/[id]` → H1 **Client Details**.
- `/upload` → H1 **Upload PDF**.
- דף 404 ברירת המחדל של Next.js נשאר (בתוך ה-Shell).
- **`/dev/components`** — דף תצוגה של כל הרכיבים בכל הווריאנטים, כדי שאפשר יהיה לבדוק את סעיף ה-DoD "הצבעים, הגופן והרכיבים תואמים ל-DESIGN.md". הדף **זמין רק בהרצה מקומית** (`NODE_ENV !== 'production'`, אחרת `notFound()`), לא מופיע בסרגל הניווט ואינו חלק מהמוצר.

### 4.9 Frontend tests (Vitest)
- `basic-auth`: בלי כותרת → נדחה; סיסמה שגויה → נדחה; סיסמה נכונה עם כל שם משתמש → מאושר; כותרת פגומה (base64 לא תקין / בלי `:`) → נדחה; `SITE_PASSWORD` חסר → נדחה.
- Middleware: תגובת 401 כוללת `WWW-Authenticate`.
- `backend-proxy` (עם `fetch` מדומה): מוסיף `X-API-Key`; לא מעביר `Authorization`/`Cookie`; מעביר query string, method ו-body; מחזיר status ו-body של ה-Backend; שגיאת רשת → 502 בלי פרטים פנימיים.
- `next.config` redirects: `/` → `/clients`.
- `Sidebar`: מציג את שם המערכת ושני הפריטים; הפריט הפעיל מסומן ב-`aria-current` לפי ה-pathname (כולל `/clients/abc`).
- רכיבים: `StatusBadge` מציג את הטקסט לכל סטטוס; `Button` disabled לא מפעיל `onClick`; `Alert` מציג את ה-action; `Modal` נסגר ב-Close וב-Escape וקורא ל-`onClose`.

Scripts: `dev` (`next dev`, פורט 3000), `build`, `start`, `lint`, `test` (`vitest run`), `test:watch`.

---

## 5. משתני סביבה

**`backend/.env.example`** — כל משתני סעיף 19, ריקים, עם הערה קצרה לכל אחד ובאיזה Milestone הוא נדרש:
```text
# Required from Milestone 1
BACKEND_API_KEY=
API_PORT=4000
LOG_LEVEL=info
MAX_UPLOAD_BYTES=4194304
# Required from Milestone 2
MONGODB_URI=
MONGODB_DATABASE=
# Required from Milestone 4
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_EXTRACTION_PROMPT_VERSION=
OPENAI_TIMEOUT_MS=60000
AWS_REGION=
SES_FROM_ADDRESS=
ADMIN_REVIEW_EMAIL=
```
(ערכים לא-סודיים שיש להם ברירת מחדל במסמך — פורט, גודל קובץ, timeout — מופיעים עם הערך שלהם.)

**`frontend/.env.example`:**
```text
BACKEND_API_URL=http://localhost:4000
BACKEND_API_KEY=
SITE_PASSWORD=
```

- בבנייה: `.env.example` מועתק **פעם אחת** ל-`backend/.env` ול-`frontend/.env`. לא קוראים את קובצי ה-`.env` ולא כותבים בהם ערכים.
- לבדיקות האוטומטיות ולהרצת האימות שלי בזמן הבנייה, הערכים מועברים ישירות לתהליך (משתני סביבה זמניים של בדיקה), בלי לגעת ב-`.env`.

---

## 6. README (`README.md` בשורש)
- מה זה הפרויקט (שורה אחת) והפניה ל-`spec/`.
- דרישות: Node.js 24.
- התקנה: `npm install`.
- הגדרה: מילוי `backend/.env` ו-`frontend/.env` — מה למלא בכל אחד ב-Milestone 1 (סעיף 8), ושה-`BACKEND_API_KEY` חייב להיות **זהה** בשניהם.
- הרצה: `npm run dev` → פתיחת `http://localhost:3000` (Backend על `http://localhost:4000`).
- בדיקות: `npm test`, `npm run lint`, `npm run format:check`.
- מבנה התיקיות בקצרה.

## 7. עדכון `CLAUDE.md`
בסעיף "פקודות הרצה" בלבד:
- **הרצה (dev):** `npm run dev`
- **בדיקות (test):** `npm test` (ו-`npm run lint`)

---

## 8. מה המשתמש צריך לעשות
אחרי הבנייה ולפני "הרץ כדי שאבדוק", המשתמש ממלא שני ערכים (בלי חשבונות חיצוניים):

| קובץ | משתנה | מה לשים |
|---|---|---|
| `frontend/.env` | `SITE_PASSWORD` | סיסמת הכניסה לאתר שהמשתמש בוחר |
| `backend/.env` + `frontend/.env` | `BACKEND_API_KEY` | מחרוזת אקראית ארוכה (לפחות 32 תווים), **זהה בשני הקבצים**. ב-README תופיע פקודה אחת שמייצרת מחרוזת כזו |

---

## 9. ADRs שיתווספו ל-ARCHITECTURE.md בזמן הבנייה
- **npm workspaces + concurrently** — Repository אחד עם שתי אפליקציות, התקנה ופקודת הרצה אחת.
- **Tailwind CSS v4 ל-Design tokens**, ו-`lucide-react` לאייקונים.
- **nestjs-pino** ל-Structured JSON logging עם Request ID ו-redaction.
- **Config validation עם zod**, כשמשתנים של Milestones עתידיים אופציונליים עד שהם נדרשים.
- **שם קובץ ה-Middleware** לפי גרסת Next.js (`proxy.ts` ב-16+), אם רלוונטי.
- **Endpoint בדיקה זמני** `/api/v1/ping` + `/api/ping`, שיוסר ב-Milestone 2.

---

## 10. סדר הבנייה
1. שלד ה-Repository: root `package.json` עם workspaces, `.nvmrc`, Prettier.
2. Backend: יצירת פרויקט NestJS, Config, Logging, Exception filter, Guards, Throttler, Health, Ping, Modules ריקים.
3. Backend tests + lint — עוברים.
4. Frontend: יצירת פרויקט Next.js, Tailwind + tokens + Inter, Basic Auth, Proxy helper + `/api/ping`.
5. רכיבי UI, App Shell, Routes, ו-`/dev/components`.
6. Frontend tests + lint — עוברים.
7. `.env.example` ×2, העתקה ל-`.env`, README, `CLAUDE.md`, ADRs.
8. אימות מול ה-DoD (סעיף 11), תיקונים, סגירת ההרצה, וסימון 🟡 ב-MILESTONES.md.

---

## 11. אימות מול ה-Definition of Done

| # | תנאי | איך נבדק |
|---|---|---|
| 1 | שתי האפליקציות עולות בפקודה אחת, לפי ה-README, ללא שגיאות | `npm install` + `npm run dev` (עם ערכי בדיקה זמניים); שני התהליכים עולים ואין שגיאות בפלט |
| 2 | חלון סיסמה; שגויה נחסמת, נכונה נכנסת | `curl` בלי/עם סיסמה שגויה → 401 + `WWW-Authenticate`; סיסמה נכונה → 200. בנוסף, בדיקה בדפדפן המובנה |
| 3 | `GET /health` → 200 בלי מפתח | `curl localhost:4000/health` + E2E test |
| 4 | `/api/v1/*` בלי מפתח / מפתח שגוי → 401 | `curl localhost:4000/api/v1/ping` בשני המקרים + E2E tests |
| 5 | בקשה דרך ה-Proxy מגיעה ל-Backend | `curl -u x:<password> localhost:3000/api/ping` → 200 `{ "status": "ok" }`, ובלוג ה-Backend מופיעה הבקשה עם Request ID |
| 6 | `/` → `/clients` | `curl -I` → redirect ל-`/clients`; בדפדפן |
| 7 | סרגל ניווט בכל המסכים, ניווט עובד | בדפדפן המובנה: `/clients`, `/clients/123`, `/upload` — הסרגל מוצג והפריט הנכון מודגש; לחיצה על הפריטים מנווטת |
| 8 | צבעים, גופן ורכיבים תואמים ל-DESIGN | צילום מסך של המעטפת ושל `/dev/components`, והשוואה ל-Mockups ול-Style Guide (צבעים, Inter, Badges, Buttons, Alerts, Modal) |
| 9 | Lint ו-Tests עוברים בשתי האפליקציות | `npm run lint` + `npm test` + `npm run format:check` מהשורש |
| 10 | אין Secrets ב-Repository; `.env.example` מתעד הכל | `git status` — קובצי `.env` לא מופיעים (מכוסים ב-`.gitignore`); חיפוש בקוד אחר ערכים סודיים; השוואת `.env.example` מול סעיף 19 |

בסיום האימות — סוגרים את כל התהליכים שהורצו.
