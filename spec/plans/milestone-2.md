# Plan — Milestone 2: Sign in with Google & Clients List

מקורות: [MILESTONES.md](../MILESTONES.md) (Milestone 2), [PRD.md](../PRD.md) סעיפים 3, 4.1, 4.2, [ARCHITECTURE.md](../ARCHITECTURE.md) סעיפים 5, 6.2, 9.2, 9.4, 11, 12.1, 12.3, 13, 16, 19, 20, 24 ו-ADR-14, ADR-17, ADR-18, ADR-19, ADR-20, [DESIGN.md](../DESIGN.md) סעיפים 1.0, 1.1, 1.6, 1.7, 2, והתמונות `wireframes.png`, `mockups.png`, `style-guide.png`.

---

## 1. היקף

**בתוך ה-Milestone:**
- הקמת Supabase (Development + Production) ו-Google OAuth (Development) — בהדרכה, המשתמש מבצע.
- חיבור ה-Backend ל-Supabase (PostgreSQL), מנגנון Migrations, Migration ראשון (טבלאות, Indexes ו-RLS), ו-Seed script ל-Development.
- Users Module ו-`POST /api/v1/users/google-sign-in`.
- Sign in with Google ב-Frontend (Auth.js), מסך Sign In, Proxy שבודק session, וכפתור **Sign out**.
- הסרת Basic Auth, `SITE_PASSWORD` וה-endpoints הזמניים `ping` (ADR-17).
- `GET /api/v1/clients` (חיפוש, סינון, מיון, Pagination) ומסך **Clients** מלא.

**מחוץ ל-Milestone (לא לבנות עכשיו):**
- `GET/PATCH/DELETE /api/v1/clients/:id`, `ClientStatusService`, `DuplicateDetectionService` ומסך Client Details (Milestone 3). הדף `/clients/[id]` נשאר עם כותרת בלבד, כך שלחיצה על View / שורה כבר מנווטת אליו.
- העלאת PDF, OpenAI ו-SES (Milestone 4). כפתור **Upload PDF** מנווט למסך שעדיין מציג כותרת בלבד.
- אין חיבור ל-Production, אין Migrations על Production ואין פריסה (Milestone 5).

### החלטות שהתקבלו מהמשתמש בתכנון
| נושא | החלטה |
|---|---|
| מסד הנתונים | Supabase (PostgreSQL) במקום MongoDB Atlas. ARCHITECTURE ו-MILESTONES עודכנו (ADR-19, ADR-20) |
| טקסט שגיאת כניסה (TBD) | `Sign in failed. Please try again.` |
| כפתור Sign out (TBD) | כן — קישור **Sign out** בתחתית סרגל הניווט |
| חיפוש טלפון | ספרות בלבד, ובנוסף: חיפוש שמתחיל ב-`0` מוצא גם את אותו מספר בפורמט `+972` (למשל `03-555` מוצא `+972 3 555...`) |

שתי ההחלטות האחרונות מוסיפות התנהגות שלא כתובה במפורש ב-PRD/DESIGN — יתועדו כ-ADR, ובסיום אציע למשתמש אם לעדכן את המסמכים.

---

## 2. מה המשתמש צריך לעשות (בהדרכה צעד אחר צעד)

הבנייה מתחילה בקוד שלא דורש חשבונות (Migrations, API, מסכים, tests עם mocks). כשמגיעים לשלב שדורש חיבור אמיתי — עוצרים ומדריכים את המשתמש, ממתינים לאישור שלו, ורק אז ממשיכים.

### 2.1 Supabase
1. יצירת חשבון ב-<https://supabase.com> (אפשר להתחבר עם GitHub או Google).
2. יצירת **שני Projects**: `ordan-dev` ו-`ordan-prod`. לכל אחד:
   - Database password חזק וייחודי (Supabase מציע כפתור Generate). שומרים אותו במנהל סיסמאות.
   - Region: אותו Region לשניהם, קרוב ל-Region של AWS שייבחר ב-Milestone 4–5 (למשל Frankfurt, `eu-central-1`).
   - תוכנית Free.
3. **ב-Project `ordan-dev` בלבד:**
   - **Connect → Session pooler:** העתקת ה-Connection String ל-`backend/.env` (`DATABASE_URL`), והחלפת `[YOUR-PASSWORD]` בסיסמה.
   - **Project Settings → General → Project ID:** העתקה ל-`backend/.env` (`DATABASE_DEV_PROJECT_REF`).
   - **Database Settings → SSL Configuration → Download certificate:** שמירת הקובץ כ-`backend/certs/supabase-ca.crt` (קובץ ציבורי, לא סוד).
4. שמירת פרטי `ordan-prod` **בצד** (במנהל סיסמאות). לא מתחברים ל-Production בשלב זה.

**למה לא Lovable Cloud:** מסד הנתונים המובנה של Lovable לא נותן כתובת חיבור ישירה, וה-Backend שלנו (NestJS) צריך כזו. Projects שנוצרים ישירות ב-Supabase אפשר לחבר ל-Lovable בהמשך, אם תרצה (ADR-19).

### 2.2 Google OAuth (Development)
1. יצירת Project ב-<https://console.cloud.google.com>: `Ordan Cargo Future Clients`.
2. **OAuth consent screen** (Google Auth Platform): סוג External, שם האפליקציה, מייל תמיכה. Scopes: `openid`, `email`, `profile` בלבד (לא דורשים אימות של Google). העברה ל-**In production**.
3. **Credentials → Create OAuth client ID** מסוג Web application:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. העתקת Client ID ו-Client Secret ל-`frontend/.env` (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`).
5. יצירת `AUTH_SECRET` בפקודה שתינתן (`npx auth secret` או `node -e ...randomBytes`), והדבקה ל-`frontend/.env`.

ה-AI לא מזין credentials בעצמו ולא קורא את `.env`.

---

## 3. Backend (`backend/`)

### 3.1 תלויות חדשות
- `pg` (node-postgres) ו-`@types/pg`. **בלי ORM ובלי Supabase client** — המודל פשוט, ה-queries כתובים כ-SQL parameterized, והולידציה נעשית עם `zod` שכבר קיים (ARCH ADR-19).

### 3.2 קבצים

```text
backend/
├── certs/supabase-ca.crt               ← Supabase Root CA (public file, downloaded by the user)
└── src/
    ├── database/
    │   ├── database.module.ts          ← global; provides a pg Pool (token DATABASE_POOL)
    │   ├── database.constants.ts       ← DATABASE_POOL token
    │   ├── pool.ts                     ← creates the Pool: SSL with the CA, search_path, timeouts
    │   └── dev-guard.ts                ← assertDevelopmentDatabase(): ARCH ADR-20
    ├── migrations/
    │   ├── 001_initial.sql             ← tables, indexes, RLS
    │   ├── runner.ts                   ← applies pending .sql files, records them in schema_migrations
    │   └── cli.ts                      ← entry point for `npm run db:migrate`
    ├── seed/
    │   ├── seed-data.ts                ← test clients
    │   └── seed.cli.ts                 ← entry point for `npm run db:seed` (Development only)
    ├── common/text/normalize.ts        ← company/email normalization, phone digits (ARCH 9.4)
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts         ← POST /api/v1/users/google-sign-in
    │   ├── users.service.ts
    │   ├── users.repository.ts
    │   └── dto/google-sign-in.dto.ts   ← zod schema
    └── clients/
        ├── clients.module.ts
        ├── clients.controller.ts       ← GET /api/v1/clients
        ├── clients.service.ts
        ├── clients.repository.ts       ← builds the SQL (search/filter/sort/paging)
        ├── client.mapper.ts            ← DB row (snake_case) → API item (camelCase)
        ├── client.types.ts             ← row + API types (ARCH 11.2)
        └── dto/list-clients.query.ts   ← zod schema for query params
```

להסרה: `common/system/ping.controller.ts` והרישום שלו ב-`app.module.ts` (ADR-17).

`nest-cli.json` יוגדר להעתיק את קובצי ה-`.sql` ל-`dist` (assets), כדי שה-Migrations יעבדו גם מה-build (חשוב ל-Milestone 5).

### 3.3 Config
- ב-`env.schema.ts`: `MONGODB_URI` ו-`MONGODB_DATABASE` מוסרים. נוספים:
  - `DATABASE_URL` — **חובה**. Backend לא עולה בלעדיו, עם הודעה שמציינת שם משתנה בלבד.
  - `DATABASE_DEV_PROJECT_REF` — אופציונלי לשרת, **חובה** ל-Seed ול-Integration tests (ADR-20).
  - `DATABASE_SCHEMA` — אופציונלי, ברירת מחדל `public`. משמש את ה-tests ל-schema זמני.
- `test/setup-env.ts` מגדיר ערכי בדיקה (ראה 3.10).

### 3.4 Database module
- `Pool` אחד של `pg` לכל האפליקציה, נסגר ב-shutdown.
- **SSL:** `ssl: { ca: <certs/supabase-ca.crt>, rejectUnauthorized: true }` — החיבור מוצפן **ומאומת** (לא `rejectUnauthorized: false`).
- `search_path` נקבע ל-`DATABASE_SCHEMA` בכל חיבור חדש.
- `connectionTimeoutMillis` של כ-10 שניות, ו-`max` של 5 חיבורים (מתאים ל-Session pooler בתוכנית החינמית).
- כשל חיבור נרשם ב-log בלי ה-URL ובלי הסיסמה (ARCH 16.7).
- `/health` **לא** בודק את ה-Database (ARCH 12.4).

### 3.5 Migrations (ARCH 11.7)
- Runner פשוט, בלי ספרייה חיצונית ובלי Supabase CLI:
  1. `CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`.
  2. קורא את קובצי `NNN_*.sql` לפי הסדר.
  3. כל קובץ שלא רשום — רץ **בתוך transaction** יחד עם הרישום שלו. כשל → rollback, הודעה ברורה, ויציאה עם שגיאה.
  4. `pg_advisory_lock` למניעת שתי הרצות במקביל.
- פקודה: `npm run db:migrate` (בתוך `backend`, ו-alias בשורש). מדפיסה איזה migrations רצו ואיזה כבר היו, ואת ה-Project ref וה-schema (בלי ה-URL המלא).
- **`001_initial.sql`:**

  ```sql
  CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text, company_name_normalized text,
    address text,
    phone text, phone_digits text,
    email text, email_normalized text,
    origin_port text, origin_country text, destination_port text, incoterms text,
    shipment_type text CHECK (shipment_type IN ('FCL', 'LCL')),
    date_added timestamptz NOT NULL DEFAULT now(),
    processing_status text NOT NULL CHECK (processing_status IN ('Success', 'Failed')),
    error_details text
  );
  CREATE UNIQUE INDEX clients_company_email_unique
    ON clients (company_name_normalized, email_normalized)
    WHERE company_name_normalized IS NOT NULL AND email_normalized IS NOT NULL;
  CREATE INDEX clients_company_idx ON clients (company_name_normalized);
  CREATE INDEX clients_email_idx ON clients (email_normalized);
  CREATE INDEX clients_date_added_idx ON clients (date_added DESC, id DESC);
  CREATE INDEX clients_status_date_added_idx ON clients (processing_status, date_added DESC, id DESC);

  CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id text NOT NULL UNIQUE,
    email text NOT NULL,
    name text,
    date_added timestamptz NOT NULL DEFAULT now()
  );

  -- Block Supabase's public Data API; the backend connects as the table owner
  ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
  ```

  (ה-SQL הסופי ייכתב בבנייה; זה המבנה.) הרצה חוזרת בטוחה בזכות `schema_migrations`.

### 3.6 Seed script (Development בלבד)
- פקודה: `npm run db:seed`. **מוחק רק רשומות Seed קודמות** ואז מכניס אותן מחדש. כדי לא להוסיף עמודה ל-schema, הזיהוי הוא לפי ה-`id`-ים הקבועים של רשומות ה-Seed (UUIDs שמוגדרים מראש ב-`seed-data.ts`). כך הרצה חוזרת לא יוצרת כפילויות ולא נוגעת ברשומות אחרות.
- **חסימת Production (ADR-20):** `assertDevelopmentDatabase()` עוצר עם הודעה ברורה אם:
  - `DATABASE_DEV_PROJECT_REF` לא מוגדר, **או**
  - ה-`DATABASE_URL` לא מכיל את ה-ref הזה (בשם המשתמש `postgres.<ref>` של ה-pooler או ב-host `db.<ref>.supabase.co`), **או**
  - `NODE_ENV=production`.
- **נתונים:** כ-60 לקוחות (מספיק ל-3 עמודים של 25), כולל:
  - `Success` ו-`Failed`, עם `error_details` תואם (`Missing required fields: Email, Incoterms.`).
  - ערכים חסרים (`NULL`) ב-Company Name, Email, Phone, Address ובשדות המשלוח.
  - רשומה בלי Company Name ובלי Email.
  - טלפונים בפורמטים שונים: `+972 3 555 1234`, `03-555-1234`, `(212) 555-0100`, וכד'.
  - `date_added` מפוזר על פני כמה חודשים, כדי לבדוק מיון.
  - שדות מנורמלים מחושבים עם `normalize.ts`, `processing_status` לפי כלל ARCH 9.1 (פונקציה פנימית פשוטה ב-seed; `ClientStatusService` עצמו נבנה ב-Milestone 3).

### 3.7 Users (ARCH 12.3, 11.6)
- `POST /api/v1/users/google-sign-in`, body: `{ googleId, email, name }`. מוגן ב-API Key Guard.
- ולידציה (zod): `googleId` ו-`email` חובה (מחרוזות לא ריקות), `name` אופציונלי/`null`. חסר → `400`.
- SQL אטומי אחד:
  ```sql
  INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3)
  ON CONFLICT (google_id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name
  RETURNING id, email, name;
  ```
  שתי כניסות ראשונות במקביל לא יוצרות כפילות.
- Response: `{ id, email, name }`. לא נרשם ב-log מייל או שם (רק `userId`).

### 3.8 Clients list (ARCH 12.1, 13)

**Query params (zod, `dto/list-clients.query.ts`):**
| פרמטר | ולידציה | ברירת מחדל |
|---|---|---|
| `search` | מחרוזת, trim, עד 200 תווים. ריק = אין חיפוש | — |
| `processingStatus` | `Success` / `Failed` בלבד | הכל |
| `sortOrder` | `asc` / `desc` בלבד | `desc` |
| `page` | מספר שלם, 1 עד 10,000 | 1 |
| `limit` | רק `25` | 25 |

ערך לא חוקי → `400` עם `error: "BAD_REQUEST"` והודעה קצרה (דרך ה-exception filter הקיים). פרמטר מופיע פעמיים (מערך) → `400`. פרמטרים לא מוכרים — מתעלמים.

**בניית ה-SQL (`clients.repository.ts`):** כל הערכים עוברים כפרמטרים (`$1`, `$2`, ...), וכיוון המיון נבחר מתוך enum קבוע בקוד — אף ערך מהבקשה לא משורשר ל-SQL.
- `search`:
  - הטקסט עובר escape לתווים של `LIKE` (`\`, `%`, `_`) ונעטף ב-`%...%`.
  - `company_name ILIKE $s OR email ILIKE $s`.
  - אם בטקסט יש ספרות: `OR phone_digits LIKE $d`, כשהספרות בלבד (למשל `03-555` → `%03555%`).
  - **התאמה לפורמט ישראלי (החלטת משתמש, ADR-21):** אם הספרות מתחילות ב-`0`, נוסף `OR phone_digits LIKE $d972` עם `972` + הספרות בלי ה-`0` (`03555` → `%9723555%`). כך `03-555` מוצא `+972 3 555...`, ו-`972 3 555` ממשיך למצוא `+972 3 555...` כרגיל.
- `processingStatus`: `processing_status = $n`.
- מיון: `ORDER BY date_added <dir>, id <dir>` (ה-`id` שובר שוויון, כדי שה-Pagination יהיה יציב, ומתאים ל-Indexes).
- Pagination: `LIMIT 26 OFFSET (page-1)*25`. `hasNextPage = rows.length > 25`, מחזירים 25. אין `COUNT` (ARCH 12.1).
- `SELECT` רק לעמודות שנדרשות לטבלה + `id`.

**Response:**
```json
{
  "items": [
    { "id": "…uuid…", "companyName": "…|null", "email": "…|null", "phone": "…|null",
      "dateAdded": "2026-07-20T11:32:00.000Z", "processingStatus": "Success|Failed" }
  ],
  "page": 1, "limit": 25, "hasNextPage": true
}
```
הרשימה מחזירה רק את 5 עמודות הטבלה + `id`. הפרטים המלאים יוחזרו מ-`GET /clients/:id` ב-Milestone 3.

### 3.9 `normalize.ts` (ARCH 9.4)
- `normalizeCompanyName`: trim, כיווץ רווחים, lowercase, NFKC. ריק → `null`.
- `normalizeEmail`: trim, lowercase. ריק → `null`.
- `phoneToDigits`: ספרות בלבד. אין ספרות → `null`.
משמש כאן ב-Seed, וב-Milestones 3–4 ב-PATCH וביצירה.

### 3.10 Backend tests
- **Unit (ללא Database):**
  - `normalize.ts`.
  - `list-clients.query.ts` — ערכים חוקיים, ברירות מחדל, וכל ערך לא חוקי → שגיאה.
  - בניית ה-SQL ב-repository — escape של `LIKE`, תנאי הטלפון, תנאי `0` → `972`, ושכל הערכים נשלחים כפרמטרים.
  - `google-sign-in.dto.ts`.
  - `dev-guard.ts` — URL עם ref אחר נחסם, ref חסר נחסם, `NODE_ENV=production` נחסם, ה-ref של Development מותר.
- **Integration / e2e (מול Database אמיתי):**
  - רצים מול ה-Project של **Development**, ב-**Postgres schema זמני** (`test_<random>`), שנוצר בתחילת ההרצה ונמחק בסופה (`DROP SCHEMA ... CASCADE`). אין Database מקומי ואין Docker (ADR-20).
  - לפני הכל: `assertDevelopmentDatabase()` — לא רצים בשום מקרה מול Project אחר.
  - `test/setup-env.ts` קורא את `DATABASE_URL` ו-`DATABASE_DEV_PROJECT_REF` מ-`backend/.env` (בלי להדפיס אותם). אם הם לא מוגדרים — ה-e2e של ה-Database נכשלים עם הודעה ברורה (לא מדלגים בשקט).
  - תרחישים:
    - Migrations רצים, הטבלאות וכל ה-Indexes קיימים (בדיקה מול `pg_indexes`), RLS מופעל (`pg_class.relrowsecurity`), והרצה שנייה לא משנה דבר.
    - `GET /api/v1/clients`: ברירת מחדל (25, החדשים ראשונים), `asc`, סינון `Success`/`Failed`, חיפוש לפי שם (case-insensitive), מייל, טלפון (`03-555` מוצא `+972 3 555...`), תווים מיוחדים (`%`, `_`, `'`, `\`) לא שוברים ולא מתנהגים כ-wildcard, `hasNextPage` בעמוד אמצעי ובעמוד האחרון, עמוד מעבר לסוף מחזיר `items: []`, ערכים חסרים מוחזרים כ-`null`.
    - פרמטרים לא חוקיים (`page=0`, `page=abc`, `limit=100`, `sortOrder=x`, `processingStatus=Pending`) → `400`.
    - `POST /api/v1/users/google-sign-in`: כניסה ראשונה יוצרת משתמש; כניסה חוזרת עם מייל/שם חדשים מעדכנת ולא יוצרת כפילות; חסר `googleId`/`email` → `400`; אין עמודת סיסמה בטבלה.
    - בלי `X-API-Key` → `401` (הבדיקות הקיימות עוברות ל-`/api/v1/clients` במקום `/api/v1/ping`).

---

## 4. Frontend (`frontend/`)

### 4.1 תלויות חדשות
- `next-auth@5` (Auth.js v5, תומך ב-Next.js 16). הגרסה שתותקן: ה-beta האחרון (`5.0.0-beta.x`) — זו הגרסה הרשמית שתומכת ב-App Router. **לפני כתיבת קוד:** לקרוא את המדריכים הרלוונטיים ב-`node_modules/next/dist/docs/` (Proxy, Route Handlers, Route Groups) לפי `frontend/AGENTS.md`.

### 4.2 קבצים

```text
frontend/src/
├── auth.ts                              ← NextAuth config: Google provider, JWT session, callbacks
├── proxy.ts                             ← rewritten: session check instead of Basic Auth
├── lib/
│   ├── backend-proxy.ts                 ← unchanged helper
│   ├── backend-client.ts                ← server-only: registerGoogleUser() → POST /api/v1/users/google-sign-in
│   ├── public-paths.ts                  ← which paths need no session
│   ├── format.ts                        ← formatDate (Asia/Jerusalem), displayValue (NOT Available)
│   └── clients-query.ts                 ← URL search params ↔ list query (shared by page + tests)
├── app/
│   ├── layout.tsx                       ← html/body + font only (AppShell moves out)
│   ├── sign-in/page.tsx                 ← Sign In screen (no AppShell)
│   ├── sign-in/SignInButton.tsx
│   ├── api/auth/[...nextauth]/route.ts  ← Auth.js handlers
│   ├── api/clients/route.ts             ← GET → /api/v1/clients
│   └── (app)/                           ← route group with AppShell
│       ├── layout.tsx                   ← <AppShell>
│       ├── clients/page.tsx
│       ├── clients/ClientsView.tsx      ← client component: toolbar + table + pagination
│       ├── clients/[id]/page.tsx        ← unchanged (title only)
│       ├── upload/page.tsx              ← unchanged (title only)
│       └── dev/components/...           ← moved here, unchanged
├── components/
│   ├── layout/Sidebar.tsx               ← + Sign out at the bottom
│   ├── layout/SignOutButton.tsx
│   ├── clients/ClientsToolbar.tsx       ← Search, Filter, Refresh
│   ├── clients/ClientsTable.tsx         ← table, sortable Date Added, View, empty/loading
│   ├── clients/Pagination.tsx           ← Previous / Next
│   └── ui/GoogleIcon.tsx                ← official multi-color "G" (SVG)
```

להסרה: `lib/basic-auth.ts` ו-`lib/basic-auth.test.ts`, `app/api/ping/route.ts` (ADR-17), `SITE_PASSWORD` מ-`.env.example` ומה-README.

### 4.3 Auth.js (ARCH 5.1, 16.1, ADR-18)
- `auth.ts`:
  - Provider: Google, עם `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (Auth.js קורא אותם אוטומטית).
  - `session: { strategy: 'jwt' }` — אין sessions ב-Database. Cookie: `HttpOnly`, `Secure` ב-Production (ברירת המחדל של Auth.js).
  - `pages: { signIn: '/sign-in', error: '/sign-in' }`.
  - `callbacks.signIn`: קורא ל-`registerGoogleUser({ googleId: profile.sub, email, name })`. אם ה-Backend נכשל או שאין `sub`/`email` → מחזיר `false` (הכניסה נדחית, והמשתמש חוזר ל-`/sign-in?error=...`). כך **רק משתמש שנרשם ב-`users` נכנס** (PRD 4.1).
  - `callbacks.jwt`: שומר ב-token את `userId` שהוחזר מה-Backend.
  - לא נשמרים OAuth tokens (access/refresh) ב-session, ולא נרשמים ב-log.
- `registerGoogleUser` משתמש ב-`BACKEND_API_URL` + `BACKEND_API_KEY` בצד השרת בלבד, עם timeout של כ-10 שניות. אין לו Proxy route לדפדפן (ARCH 12.3).

### 4.4 Proxy — בדיקת session (ARCH 5.1, 16.1, ADR-14)
- `proxy.ts` משתמש ב-`auth` של Auth.js כדי לבדוק session בכל בקשה.
- **מותר בלי session:** `/sign-in`, `/api/auth/*`, `/_next/*`, `icon.svg`/`favicon.ico` וקבצים סטטיים (`public-paths.ts`).
- **בלי session:**
  - `/api/*` → `401` JSON: `{ "error": "UNAUTHORIZED", "message": "Authentication required." }`.
  - כל דף אחר → redirect ל-`/sign-in?callbackUrl=<הנתיב המקורי>` (רק נתיב יחסי באותו אתר — לא כתובת חיצונית).
- **עם session ופתיחת `/sign-in`** → redirect ל-`/clients`.
- `AUTH_SECRET` חסר → Auth.js נכשל סגור (אין גישה). ה-README יסביר.

### 4.5 מסך Sign In (DESIGN 1.7)
- בלי AppShell, רקע `Background`, Card אחד במרכז (רוחב כ-400px, radius 12px, הצל מ-DESIGN 2.11).
- שם המערכת בשתי שורות: `Ordan Cargo` ב-Navy ו-`Future Clients` ב-Teal (כמו בסרגל).
- כפתור **Sign in with Google** ברוחב ה-Card, Secondary, עם הלוגו הצבעוני של Google משמאל לטקסט, לפי הנחיות המיתוג של Google (לוגו לא משונה, הטקסט "Sign in with Google").
- כש-`?error` קיים: `Alert` מסוג Error מעל הכפתור עם `Sign in failed. Please try again.`
- לחיצה → `signIn('google', { redirectTo: callbackUrl ?? '/clients' })`. בזמן ההפניה הכפתור מושבת.

### 4.6 Sign out
- קישור/כפתור **Sign out** בתחתית סרגל הניווט (מעל הצורות הדקורטיביות), עם אייקון `LogOut` של Lucide, טקסט לבן-שקוף כמו פריטי ניווט לא פעילים.
- לחיצה → `signOut({ redirectTo: '/sign-in' })`.

### 4.7 Route group ו-AppShell
- `app/layout.tsx` נשאר עם `html`, `body`, הגופן ו-`metadata` בלבד.
- `app/(app)/layout.tsx` עוטף ב-`AppShell` את `clients`, `upload` ו-`dev/components`. ה-URLs לא משתנים.
- redirect של `/` ל-`/clients` נשאר ב-`next.config.ts` (לפני הכניסה, ה-Proxy יפנה ל-`/sign-in`).

### 4.8 Proxy route לרשימה
- `app/api/clients/route.ts`: `GET` → `proxyToBackend(request, '/api/v1/clients')`. ה-query string מועבר כמו שהוא; הולידציה ב-Backend.

### 4.9 מסך Clients (DESIGN 1.1, 1.6, 2.6, 2.7)

**מבנה (לפי ה-Wireframes וה-Mockups):**
- שורת כותרת: **Clients** (H1) משמאל, כפתור Primary **Upload PDF** עם אייקון Upload מימין → `/upload`.
- שורת כלים: Search (אייקון זכוכית מגדלת, placeholder `Search by company name, email or phone`), Select (`All Processing Status`, `Success`, `Failed`), כפתור Secondary **Refresh** עם אייקון RefreshCw.
- טבלה ב-Card לבן: **Company Name**, **Email**, **Phone**, **Date Added**, **Processing Status**, **Actions**.
  - **Date Added** היא כותרת-כפתור עם חץ (`ArrowDown` = החדשים ראשונים, `ArrowUp` = הישנים ראשונים), ו-`aria-sort`.
  - Status → `StatusBadge`.
  - Actions → כפתור Secondary קטן **View** בלבד (בלי chevron — DESIGN 1.6).
  - כל השורה לחיצה (hover עדין, cursor pointer) → `/clients/[id]`. גם View מנווט. השורה נגישה במקלדת דרך כפתור View (לא מוסיפים tab stop כפול).
- Pagination מתחת לטבלה, מיושר לימין: **Previous** / **Next** (Secondary). Previous מושבת בעמוד 1, Next מושבת כש-`hasNextPage=false`. בלי מספרי עמודים ובלי ספירה.
- **לא נבנים** (DESIGN 1.6): עמודות `#` ו-Address, chevron ליד View, Email Status, מספרי עמודים / "1 - 7 of 32", Total Clients, פעמון, אווטאר.

**מצב (state):**
- הפרמטרים נשמרים ב-URL (`?search=&status=&sort=&page=`), כך ש-Back בדפדפן וחזרה מ-Client Details שומרים על אותה תצוגה. ברירות מחדל לא נכתבות ל-URL.
- חיפוש: עדכון אחרי השהיה של כ-300ms מסיום ההקלדה. שינוי חיפוש, סינון או מיון → חזרה לעמוד 1.
- **Refresh** טוען מחדש את העמוד הנוכחי עם אותם פרמטרים (בלי cache).
- **טעינה:** בטעינה ראשונה — שורות skeleton בתוך הטבלה. בטעינה חוזרת — הנתונים הקודמים נשארים, הטבלה מעומעמת קלות, ו-Refresh מציג אייקון מסתובב. `aria-busy` על הטבלה.
- **מצב ריק:** שורה אחת על כל רוחב הטבלה עם `No clients found.`
- **שגיאה** (Backend לא זמין וכו'): `Alert` Error עם `Something went wrong. Please try again.` וכפתור **Try Again** (הטקסט הכללי מ-PRD 4.3). 401 מה-API (session פג) → מעבר ל-`/sign-in`.
- בקשה ישנה שחוזרת אחרי בקשה חדשה לא דורסת אותה (AbortController).

**תצוגה (`lib/format.ts`):**
- `displayValue(v)`: `null`/ריק → `NOT Available` בצבע Text Secondary.
- `formatTableDate(iso)`: `Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', month: 'short', day: 'numeric', year: 'numeric' })` → `Jul 20, 2026`.
- ערכים ארוכים (מייל, שם חברה) נחתכים עם `…` ו-`title` עם הערך המלא, כדי שהטבלה לא תישבר.

### 4.10 Frontend tests (Vitest)
- `proxy.test.ts` (נכתב מחדש): בלי session — דף מפנה ל-`/sign-in?callbackUrl=...`, `/api/clients` מחזיר 401, `/sign-in` ו-`/api/auth/*` פתוחים; עם session — עובר; `/sign-in` עם session → `/clients`. (ה-`auth` מדומה.)
- `public-paths.test.ts`, `format.test.ts` (כולל מעבר תאריך בחצות לפי Asia/Jerusalem), `clients-query.test.ts`.
- `auth.test.ts`: `signIn` callback — הצלחה כשה-Backend מחזיר משתמש, `false` כשה-Backend נכשל או אין `sub`/`email`.
- `ClientsView.test.tsx` עם fetch מדומה: הצגת שורות, `NOT Available`, Badge, מצב ריק, מצב שגיאה + Try Again, לחיצה על Date Added מחליפה כיוון, Previous/Next מושבתים בקצוות, Refresh שולח בקשה חדשה, חיפוש שולח `search` אחרי ההשהיה.
- `SignInPage.test.tsx`: הכפתור מוצג; עם `error` מוצגת ההודעה.
- `Sidebar.test.tsx`: קיים + Sign out מוצג.
- `next-config.test.ts`: קיים.

---

## 5. משתני סביבה

### `backend/.env.example`
- `MONGODB_URI` ו-`MONGODB_DATABASE` מוסרים.
- נוספים בקבוצת "Required from Milestone 2 (Supabase Development)": `DATABASE_URL` ו-`DATABASE_DEV_PROJECT_REF`, עם הערה: Development בלבד, Session pooler.

### `frontend/.env.example`
```text
BACKEND_API_URL=http://localhost:4000
BACKEND_API_KEY=
# Auth.js (Sign in with Google) — Development OAuth client
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```
`SITE_PASSWORD` מוסר. ה-`.env` הקיים של המשתמש לא נקרא ולא נדרס — אומר למשתמש אילו שורות להוסיף ואיזו להסיר.

---

## 6. README ו-`CLAUDE.md`
- README: הסרת ההסבר על סיסמת האתר; הוספת "First-time setup" ל-Supabase ול-Google OAuth (בקצרה, עם קישור להדרכה), טבלת המשתנים החדשה, והפקודות `npm run db:migrate` ו-`npm run db:seed` (Development בלבד), ושההרצה הראשונה צריכה migrate לפני dev.
- `CLAUDE.md` → "פקודות הרצה": הוספת `npm run db:migrate` ו-`npm run db:seed`, וציון ש-`npm test` צריך חיבור ל-Supabase Development.
- Root `package.json`: aliases `db:migrate`, `db:seed` → workspace `backend`.

---

## 7. ADRs שיתווספו ל-ARCHITECTURE.md בזמן הבנייה
ADR-19 (Supabase במקום MongoDB) ו-ADR-20 (הגנה מהרצה על Production) כבר נוספו בתכנון. בזמן הבנייה יתווספו:
- **ADR-21: התאמת חיפוש טלפון לפורמט ישראלי** — `0…` מוצא גם `972…` (החלטת משתמש). סעיף 12.1 כבר מפנה אליו.
- **ADR-22: Auth.js v5 (beta)** — הגרסה שתומכת ב-App Router וב-Next.js 16; כניסה נדחית אם הרישום ב-Backend נכשל; Route group `(app)` להפרדת Sign In מה-AppShell.
- **ADR-23: כפתור Sign out בסרגל הניווט** (החלטת משתמש, לא מופיע ב-PRD/DESIGN).

---

## 8. סדר הבנייה
1. Backend: `normalize.ts`, Database module (`pg`), Config (`DATABASE_URL` חובה), הסרת `ping`.
2. Migrations runner + `001_initial.sql` + פקודת `db:migrate`, `dev-guard.ts`, ו-unit tests.
3. Users module + DTO + tests.
4. Clients list: DTO, repository, service, controller + unit tests.
5. Frontend: Route group, הסרת Basic Auth ו-`ping`, `.env.example`.
6. Auth.js, Proxy, מסך Sign In, Sign out + tests.
7. Proxy route ל-`/api/clients`, `format.ts`, מסך Clients + tests.
8. Seed script + חסימת Production.
9. **עצירה: הדרכת המשתמש בהקמת Supabase (סעיף 2.1)** והמתנה לאישור.
10. `db:migrate` על Development, `db:seed`, ו-Integration tests.
11. **עצירה: הדרכת המשתמש בהקמת Google OAuth (סעיף 2.2)** והמתנה לאישור.
12. בדיקה ידנית בדפדפן מקצה לקצה (כניסה, רשימה, חיפוש, סינון, מיון, Pagination, Sign out), השוואה ל-Mockups.
13. README, `CLAUDE.md`, ADRs, Lint, Format, Tests. סימון 🟡 ב-MILESTONES.md.

---

## 9. אימות מול ה-Definition of Done

| תנאי | איך נבדק |
|---|---|
| שני Projects ב-Supabase, ה-Backend מחובר ל-Development בלבד | אישור המשתמש; ה-migrate מדפיס את ה-Project ref, והוא זהה ל-`DATABASE_DEV_PROJECT_REF` (בלי סיסמה) |
| Migrations רצו על Development וה-Indexes קיימים | `db:migrate` + integration test מול `pg_indexes`; גם בדיקה ב-Table Editor של Supabase |
| הרצה חוזרת לא משנה דבר | `db:migrate` שני מדפיס "nothing to apply"; test מוודא שה-Indexes זהים |
| Seed רץ על Development | `db:seed`; ניסיון עם URL של Project אחר נחסם (unit test) |
| Google OAuth הוגדר והכניסה עובדת | כניסה ידנית בדפדפן (אני מבקש מהמשתמש להיכנס, כי נדרש חשבון Google שלו) |
| כניסה ראשונה יוצרת `users`, חוזרת לא יוצרת כפילות, אין סיסמאות | integration test + בדיקה ב-Table Editor של Supabase אחרי כניסה של המשתמש |
| בלי כניסה: דפים → `/sign-in`, `/api/*` → 401; Basic Auth ו-`SITE_PASSWORD` הוסרו | proxy tests + `curl` לדף ול-`/api/clients`; `grep` שאין `SITE_PASSWORD` בקוד |
| Sign In תואם DESIGN 1.7 | צילום מסך והשוואה ל-Style Guide |
| חיפוש לפי Company Name, Email, Phone (כולל `03-555`) | integration tests + בדיקה ידנית |
| סינון לפי Processing Status | integration tests + ידני |
| מיון בשני הכיוונים, ברירת מחדל החדשים ראשונים | integration + component tests |
| 25 בעמוד, Previous/Next מושבתים בקצוות | integration + component tests; ידני על נתוני Seed (3 עמודים) |
| Refresh טוען מחדש | component test (בקשה חדשה) + ידני (רשומה שנוספה ב-Supabase מופיעה) |
| `NOT Available` בתצוגה, `NULL` ב-Database | component test + integration test |
| פרמטרים לא חוקיים → 400 | integration tests |
| Tests ל-API של הרשימה עוברים | `npm test` |
| המסך תואם DESIGN, כולל 1.6 | צילום מסך מול Wireframes/Mockups; רשימת "לא נבנה" נבדקת אחת-אחת |
