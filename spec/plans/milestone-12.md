# תוכנית — Milestone 12: Activity Log Table

מקורות: `MILESTONES.md` (Milestone 12 והפריטים הפתוחים), ARCHITECTURE 11 (Data Model ו-Migrations), 16.7 (Logging), 18 (Observability), 21 (נוהל Migrations), 22 (Data Lifecycle), ADR-35 ו-ADR-38, והקוד הקיים (`backend/src/users/users.service.ts`, `backend/src/clients/clients.service.ts`, `backend/src/clients/clients.repository.ts`, `backend/src/processing/processing.service.ts`, `backend/src/common/logging/logging.module.ts`, `backend/src/migrations/`, `backend/test/`).

## 1. נקודת המוצא

- **כל האירועים נכתבים היום רק ל-Logs** דרך `PinoLogger` (ADR-35), ומגיעים ל-Runtime Logs של Vercel, שנשמרים שעה אחת עד יום אחד.
- **מי ביצע:** ה-Next.js שולח `X-User-Id`, ו-`resolveUserId` (`logging.module.ts`) מוסיף אותו לכל שורת לוג. **Request ID:** `pino-http` שומר אותו ב-`req.id` (`resolveRequestId`).
- **השירותים לא מכירים את הבקשה:** `ClientsService`, `ProcessingService` ו-`UsersService` מקבלים רק את הנתונים, בלי `userId` ובלי Request ID.
- **ב-Vercel הפונקציה עלולה להיעצר מיד אחרי שליחת התשובה**, ולכן כתיבה ללוג "ברקע" (בלי לחכות לה) עלולה ללכת לאיבוד.
- `ClientsRepository.delete` מחזיר רק `true/false`, בלי שם החברה.
- **ה-Frontend לא משתנה** במסך ובהתנהגות. אין משתני סביבה חדשים.

## 2. החלטות המשתמש (23.11.2026)

| # | שאלה (מהפריטים הפתוחים) | הבחירה |
|---|---|---|
| א | לתעד גם צפייה ברשימה ובפרטי לקוח? | **לא.** רק פעולות שמשנות נתונים, וכניסות. |
| ב | לשמור בעריכה את הערכים הישנים והחדשים? | **לא.** רק שמות השדות ששונו. |
| ג | (נוסף בתכנון) לשמור במחיקה את שם החברה? | **כן.** אחרי מחיקה, מזהה הלקוח כבר לא מוביל לשום רשומה. |
| ד | כמה זמן לשמור את הלוגים? | **לתמיד.** אין מחיקה אוטומטית. |

## 3. מבנה הטבלה — Migration `003_activity_logs.sql`

| עמודה | סוג | הערות |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `created_at` | `timestamptz` not null | `DEFAULT now()`, UTC |
| `user_id` | `uuid` null | המשתמש שביצע. **בלי Foreign key**, כדי שכשל של קשר בין טבלאות לא ימנע רישום |
| `action` | `text` not null | סוג הפעולה (סעיף 4). בלי `CHECK`, כדי שפעולה חדשה בעתיד לא תדרוש Migration |
| `client_id` | `uuid` null | הלקוח, כשרלוונטי. **בלי Foreign key**, כי לקוח נמחק והשורה נשארת |
| `result` | `text` not null | `CHECK (result IN ('success','failure'))` |
| `details` | `jsonb` null | פרטים קצרים לפי סעיף 4 |
| `request_id` | `text` null | ה-Request ID של הבקשה, לחיבור ל-Logs של Vercel |

- Indexes: `activity_logs (created_at DESC)`, `activity_logs (user_id, created_at DESC)`, `activity_logs (client_id, created_at DESC)`.
- `ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;` — בלי policies, כמו שאר הטבלאות (11.1).
- ה-Migration רק מוסיף טבלה, ולכן הוא תואם גם לגרסה הישנה שרצה ב-Production עד הפריסה (סעיף 21).

## 4. הפעולות שנרשמות

| `action` | מתי | `result` | `user_id` | `client_id` | `details` |
|---|---|---|---|---|---|
| `user_registered` | הרשמה עם שם משתמש וסיסמה | success | המשתמש החדש | — | `{ "method": "password" }` |
| `user_signed_in` | כניסה מוצלחת | success | המשתמש | — | `{ "method": "password" }` או `{ "method": "google" }` |
| `password_sign_in_failed` | כניסה שנכשלה | failure | בעל החשבון אם שם המשתמש קיים, אחרת ריק | — | `{ "method": "password" }` |
| `client_created` | העלאה שיצרה לקוח | success | המעלה | הלקוח החדש | `{ "outcome": "AUTO_SUCCESS" \| "MANUAL_REVIEW", "processingStatus": ... }` |
| `duplicate_detected` | העלאה של לקוח שכבר קיים | success | המעלה | הלקוח **הקיים** | `{ "outcome": "DUPLICATE_SKIPPED" }` |
| `extraction_failed` | העלאה שלא חולץ ממנה מידע | failure | המעלה | — | `{ "outcome": "EXTRACTION_FAILED", "reason": "<קטגוריה, למשל AI_TIMEOUT>" }` |
| `processing_failed` | תקלה לא צפויה בעיבוד | failure | המעלה | — | `{ "outcome": "TECHNICAL_FAILURE" }` |
| `client_updated` | עריכה שנשמרה | success | העורך | הלקוח | `{ "changedFields": ["email", "phone"], "processingStatus": ... }` |
| `client_deleted` | מחיקה | success | המוחק | הלקוח שנמחק | `{ "companyName": "<שם החברה או null>" }` |

- כל העלאה יוצרת **שורה אחת** שמכילה את התוצאה, ולא שורה לכל שלב. השם `processing_failed` חדש; כל השאר הם שמות האירועים הקיימים (ARCHITECTURE 18).
- **לא נשמרים לעולם:** סיסמה, Hash, שם משתמש, מייל, מפתחות, tokens, טקסט ה-PDF, ערכים מהמסמך או ערכי שדות בעריכה. היוצא היחיד הוא שם החברה במחיקה (החלטה ג).
- שם המשתמש בכניסה שנכשלה **לא נשמר** (כמו היום ב-ADR-38). לכן ניסיון עם שם משתמש שלא קיים נרשם בלי משתמש.
- ה-Logs הרגילים ב-Vercel ממשיכים בדיוק כמו היום. הטבלה מתווספת להם, לא מחליפה אותם.

## 5. הגישה

### מי ביצע ו-Request ID
- **`common/request-actor.ts`** (חדש): Decorator `@RequestActor()` לפרמטר של Controller, שמחזיר `{ userId: string | null, requestId: string | null }` — `userId` דרך `resolveUserId` הקיים, `requestId` מ-`req.id`.
- ה-Controllers (`clients`, `documents`, `users`) מעבירים את האובייקט לשירותים. אין ספריית Context חדשה ואין תלות חדשה.

### כתיבה ללוג
- **`activity-log/activity-log.service.ts`** (חדש, Module גלובלי קטן): `record({ action, result, actor, userId?, clientId?, details? })`.
  - `INSERT` אחד עם ערכים parameterized (16.5), דרך ה-Pool הקיים.
  - **הכתיבה ממתינה לסיום** (`await`) לפני שהתשובה נשלחת, כדי שלא תלך לאיבוד ב-Vercel.
  - **כל שגיאה נבלעת:** הפונקציה לעולם לא זורקת. הכשל נרשם ב-Logs הרגילים כ-`activity_log_write_failed`, עם `action` וקוד השגיאה בלבד.
- הרישום נעשה **אחרי** שהפעולה הצליחה (או נכשלה), ולכן כשל בלוג לא מבטל פעולה שכבר הושלמה.

### שינויים בשירותים
- **`UsersService`:** `register`, `signInWithGoogle`, `signInWithPassword` רושמים לפי הטבלה. בכניסה שנכשלה, `user_id` = `found?.id ?? null`.
- **`ProcessingService.process(pdf, actor)`:** כל מסלול סיום רושם שורה אחת (`client_created` / `duplicate_detected` / `extraction_failed` / `processing_failed`). `duplicate()` מקבל את מזהה הלקוח הקיים מ-`findDuplicate` (כבר מוחזר היום). במקרה של unique violation בין שתי העלאות מקבילות, אין מזהה קיים, ו-`client_id` נשאר ריק.
- **`ClientsService.update(id, changes, actor)`** ו-**`delete(id, actor)`:** רושמים `client_updated` / `client_deleted`.
- **`ClientsRepository.delete`:** `DELETE ... RETURNING company_name`, ומחזיר `{ companyName } | null` במקום `boolean`.

## 6. שינויים בקבצים

### Backend
- **`src/migrations/003_activity_logs.sql`** (חדש) — סעיף 3.
- **`src/activity-log/activity-log.module.ts`**, **`activity-log.service.ts`** (חדשים) — סעיף 5. רישום ב-`app.module.ts`.
- **`src/common/request-actor.ts`** (חדש).
- **`src/users/users.controller.ts`**, **`users.service.ts`**.
- **`src/documents/documents.controller.ts`**, **`src/processing/processing.service.ts`**.
- **`src/clients/clients.controller.ts`**, **`clients.service.ts`**, **`clients.repository.ts`**.
- **`src/migrations/prod-cli.ts`:** אם רשימת הטבלאות בסיום מוגדרת ידנית — להוסיף את `activity_logs`.

### Tests
- **`src/activity-log/activity-log.service.spec.ts`** (חדש): כתיבה תקינה שולחת את הערכים הנכונים; כשל ב-Pool לא זורק, ונרשם `activity_log_write_failed`.
- **`test/activity-logs.e2e-spec.ts`** (חדש, מול Supabase Development ב-schema זמני, עם ה-AI מוחלף כמו ב-`documents.e2e-spec.ts`):
  - הרשמה, כניסה עם סיסמה, כניסה שנכשלה (שם קיים ושם לא קיים), כניסה עם Google — כל אחת יוצרת שורה עם `action`, `result`, `user_id` ו-`request_id` נכונים.
  - העלאה: לקוח חדש (Success ו-Failed), כפילות (עם מזהה הלקוח הקיים), כשל חילוץ, תקלה טכנית.
  - עריכה (שמות השדות בלבד) ומחיקה (עם שם החברה); `user_id` מגיע מ-`X-User-Id`.
  - **אין מידע רגיש:** הטקסט של כל השורות לא מכיל את הסיסמה, את שם המשתמש, את טקסט ה-PDF או את הערכים החדשים מהעריכה.
  - **כשל בכתיבה לא מפיל את הפעולה:** מוחקים את הטבלה ב-schema הזמני (`DROP TABLE activity_logs`), ואז עריכה, מחיקה, העלאה והרשמה עדיין מצליחות.
- **`test/migrations.e2e-spec.ts`:** הטבלה קיימת אחרי Migration, ו-RLS מופעל עליה.
- עדכון Tests קיימים שמשתמשים בחתימות שהשתנו (`ProcessingService.process`, `ClientsService.update/delete`, `ClientsRepository.delete`).

### מסמכים
- **ARCHITECTURE:**
  - 11.1 — `activity_logs` ברשימת הטבלאות; סעיף חדש **11.8 Activity Log Table** (מבנה הטבלה ו-Indexes); 11.7 — אזכור `003_activity_logs.sql`.
  - 16.7 — מה לא נשמר בטבלה.
  - 18 — האירועים נשמרים גם בטבלה; טבלת הפעולות מסעיף 4; משפט ה-KPI ב-18.1 מתעדכן (אפשר לחשב אותו מהטבלה לאורך זמן).
  - 22 — שורת "Activity log: נשמר לתמיד; במחיקת לקוח נשאר שם החברה".
  - 24 — תרחישי הבדיקה החדשים.
  - **ADR-45: טבלת לוג פעולות במסד הנתונים** (הקשר: Logs של Vercel נשמרים שעה עד יום; החלטה: טבלה, שורה אחת לפעולה, `await` עם בליעת שגיאות, בלי Foreign keys, החלטות המשתמש א–ד; השלכות: כל פעולה מוסיפה `INSERT` אחד, הטבלה גדלה לתמיד, שם חברה נשאר אחרי מחיקה).
- **README:** סעיף "Activity log" — איך לפתוח את `activity_logs` ב-Table Editor של Supabase (Development ו-Production), מיון לפי `created_at`, ושתי שאילתות מוכנות ל-SQL Editor: "כל הפעולות של משתמש, עם שם המשתמש" (`JOIN users`), ו"כל ההיסטוריה של לקוח".
- **MILESTONES.md:** שלושת הפריטים הפתוחים של Milestone 12 נסגרים (מוסרים מהטבלה), ו-🟡 ליד הכותרת בסיום הבנייה.
- **PRD ו-DESIGN:** אין שינוי (אין מסך חדש).

## 7. בדיקה בסיום הבנייה
1. `npm run db:migrate` על Development — `003_activity_logs` רץ.
2. `npm run lint`, `npm run format:check`, `npm test` (כולל e2e).
3. `npm run dev`, ובדפדפן: הרשמה, יציאה, כניסה שנכשלה, כניסה, העלאת PDF, עריכה, מחיקה.
4. בדיקה ב-`activity_logs` ב-Development שכל הפעולות מופיעות, עם המשתמש, הזמן ומזהה הלקוח, ובלי מידע רגיש.

## 8. Production (בשלב הדחיפה, לא בבנייה)
- לפי סעיף 21 ו-CLAUDE.md: לפני ה-Push אעצור ואבקש אישור מפורש להריץ את `003_activity_logs.sql` על Production — דרך `npm run db:migrate:prod`, או, כמו ב-ADR-34/37, בהדבקה ב-SQL Editor של `ordan-prod` (כולל רישום ב-`schema_migrations`). אכין את הטקסט המדויק.
- אחרי ה-Push והפריסה: בדיקה ב-Production שפעולה (למשל כניסה) נרשמת בטבלה. רק אז תנאי ה-DoD הזה מסומן.

## 9. מחוץ לתחום
- מסך לוגים בתוך האפליקציה (לא ב-PRD).
- רישום צפייה ברשימה ובפרטי לקוח, וערכים ישנים/חדשים בעריכה (החלטות א, ב).
- מחיקה אוטומטית של לוגים ישנים (החלטה ד).
- רישום ניסיונות שנחסמו לפני השירות: קובץ שאינו PDF או גדול מדי, שגיאות אימות (400), עריכה שנחסמה ככפילות (409), בקשות בלי מפתח API (401).
- רישום יציאה (Sign out) — מתבצעת רק ב-Next.js, בלי פנייה ל-Backend.
