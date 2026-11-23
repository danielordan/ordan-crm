# תוכנית — Milestone 10: Wrong Credentials Error Handling

מקורות: `MILESTONES.md` (Milestone 10), PRD 4.1, DESIGN 1.2 (טבלת ההודעות), 1.7, 1.9 ו-2 (Style Guide), ARCHITECTURE ADR-18, ADR-37, ADR-42, והקוד הקיים (`auth.ts`, `lib/auth-actions.ts`, `lib/backend-client.ts`, `app/sign-in/*`, `NotFoundContent.tsx`, `users.service.ts` ב-Backend).

## 1. נקודת המוצא (מה נבדק בשלב התכנון)

- **הקוד כבר מנסה לטפל בכניסה שגויה:** `signInWithCredentials` ב-`lib/auth-actions.ts` תופס `AuthError`, ומחזיר `Wrong username or password.` כשהסוג הוא `CredentialsSignin`, או `Sign in failed. Please try again.` בכל `AuthError` אחר. **כל שגיאה אחרת נזרקת הלאה** (`throw error`) — וזה מה שמגיע למשתמש כדף `This page couldn't load` (דף השגיאה של Next.js 16 ב-Production).
- **ה-Backend תקין:** `POST /api/v1/users/password-sign-in` מחזיר 401 גם למשתמש שלא קיים וגם לסיסמה שגויה (עם השוואה ל-`DUMMY_HASH`, כך שאין הבדל בזמן התגובה), ו-`verifyPasswordUser` הופך 401/400 ל-`null`.
- **שחזור מקומי:**
  - `npm run dev` (Development) — כניסה עם `nosuchuser` וסיסמה שגויה מציגה את ה-Alert הנכון, השדות אדומים ושם המשתמש נשאר. **עובד.**
  - `next build` + `next start` (Production מקומי) — **עובד** גם כן.
  - כשהגדרת Auth.js לא תקינה (נבדק עם `UntrustedHost`), הדפדפן מועבר ל-`/api/auth/callback/credentials` ומקבל JSON עם שגיאת 500 במקום הודעה. זה מראה ש**שגיאה שאינה "סיסמה שגויה" לא מטופלת היטב** בזרימה.
- **מסקנה:** הבעיה מופיעה רק ב-Vercel. הסיבות האפשריות: (1) שגיאה שנזרקת הלאה מ-`signInWithCredentials` — למשל כשה-Backend ב-Vercel איטי בהתעוררות (Cold start) ועובר את מגבלת 10 השניות, או `instanceof AuthError` שנכשל בגלל שתי עותקים של המחלקה בקוד המקומפל; (2) הגדרת Auth.js ב-Production. כדי לדעת בוודאות צריך את ה-Logs של Vercel מרגע הכישלון (סעיף 3, שלב 1).
- **אין שום Error boundary** באפליקציה (`error.tsx` / `global-error.tsx` לא קיימים), ולכן כל שגיאה לא צפויה מציגה את דף ברירת המחדל.
- **אין שינוי במסד הנתונים, אין Migration ואין משתני סביבה חדשים.**

## 2. החלטות המשתמש

**אושרו:** א וב כפי שהוצעו, כולל הוספה ל-DESIGN.md. ג — הבדיקה ב-Production נעשית **לפני** הבנייה.

**תוצאת הבדיקה ב-Production (23.11.2026):** כניסה עם פרטים שגויים מציגה את `Wrong username or password.` כנדרש. ב-Logs של Vercel יש רק `[auth][error] CredentialsSignin` (רישום רגיל של Auth.js) עם `200 OK`, בלי קריסה. התקלה לא שוחזרה. הסיבה הסבירה למה שהמרצה ראה: דף Sign In שנשאר פתוח מגרסה קודמת של האתר (אחרי פריסה חדשה), או כשל טכני זמני (למשל `ordan-prod` מושהה). לכן הבנייה מתמקדת בתיקון הכללי (שלבים 2 ו-3), שמונע דף קריסה בכל המקרים האלה.

| # | החלטה | הצעה |
|---|---|---|
| א | **טקסטי דף השגיאה הכללי** (באנגלית, כמו שאר הממשק) | אייקון Lucide בסגנון outline באדום-עדין (`TriangleAlert`); כותרת `Something went wrong`; הסבר `An unexpected error occurred. Please try again.`; כפתור Primary `Try Again` וכפתור Secondary `Back to Clients`. הטקסטים עקביים עם ההודעה הקיימת `Something went wrong. Please try again.` (DESIGN 1.2). |
| ב | **איפה הדף מוצג** | כמו דף ה-404 (ADR-42): בתוך מעטפת המערכת עם סרגל הניווט, כשהשגיאה קרתה במסך פנימי. שגיאה במסכי Sign In / Create Account — אותו Card, על רקע Background, בלי סרגל. |
| ג | **בדיקה ב-Production** | אני מדריך אותך צעד אחר צעד: לנסות להיכנס ב-Production עם שם משתמש שלא קיים, ואז לפתוח ב-Vercel את ה-Logs של ה-Frontend ולהעתיק לי את השורות האדומות. **אני לא מזין פרטי כניסה באתר ה-Production בעצמי.** |

אחרי האישור, הטקסטים יתווספו ל-DESIGN.md כסעיף חדש `1.10 Error Page`, באישור המשתמש.

## 3. הגישה

### שלב 1 — איתור הסיבה ב-Production
- המשתמש משחזר ב-Production ומעביר את ה-Logs (החלטה ג). לפי השגיאה שבלוג — תיקון ממוקד בנוסף לתיקון הכללי שבשלב 2 (למשל הגדלת מגבלת הזמן, או תיקון הגדרה ב-Vercel — אותו המשתמש מבצע בעצמו לפי הדרכה).
- אם ה-Logs לא מראים סיבה ברורה, התיקון הכללי בשלב 2 מספיק כדי שהמשתמש תמיד יראה הודעה ולא דף שגיאה.

### שלב 2 — זרימת כניסה שלא קורסת
ב-`lib/auth-actions.ts`, `signInWithCredentials`:
- **ההפניה אחרי כניסה מוצלחת** היא "שגיאה" מיוחדת של Next.js (`NEXT_REDIRECT`). רק אותה ממשיכים לזרוק, באמצעות `unstable_rethrow` מ-`next/navigation` (הדרך הרשמית של Next.js).
- **זיהוי פרטים שגויים** לפי השדה `type === 'CredentialsSignin'` (ולא רק `instanceof AuthError`), כך שגם אם יש שני עותקים של המחלקה — ההודעה נכונה.
- **כל שגיאה אחרת** (Backend לא זמין, מגבלת זמן, הגדרה שגויה) → `Sign in failed. Please try again.`, ושורת `console.error` ב-Logs (בלי סיסמה ובלי שם המשתמש, רק סוג השגיאה).
- שם המשתמש תמיד חוזר בתוצאה, כך שהוא נשאר בשדה.
- אותו טיפול חל גם על הכניסה האוטומטית אחרי Create Account (משתמשת באותה פונקציה).
- `verifyPasswordUser` ו-`authorize` לא משתנים בהתנהגות: פרטים שגויים → `null`; כשל טכני → שגיאה, שנתפסת עכשיו בשלב 2.
- ההודעה `Sign in failed. Please try again.` שכבר מוצגת כש-`?error=` בכתובת (כשל ב-Google) — נשארת.

### שלב 3 — Error boundary כללי
- **רכיב משותף `ErrorContent`**, באותו מבנה ועיצוב של `NotFoundContent` (Card לבן, אייקון, כותרת, הסבר, כפתורים), כדי שהשפה העיצובית תהיה אחת.
- **`app/(app)/error.tsx`** — שגיאה במסך פנימי (Clients, Upload, Client Details) מוצגת בתוך המעטפת עם הסרגל. `Try Again` קורא ל-`reset()` של Next.js (טעינה מחדש של המסך), `Back to Clients` מקשר ל-`/clients`.
- **`app/error.tsx`** — שגיאה מחוץ למעטפת (Sign In, Create Account), על רקע Background.
- **`app/global-error.tsx`** — גיבוי אחרון, כשגם ה-Layout הראשי נכשל. חייב לכלול `<html>` ו-`<body>` משלו, ולכן יציג את אותו `ErrorContent` עם הגופן והצבעים של המערכת.
- הדף לא מציג פרטים טכניים של השגיאה למשתמש. Next.js כבר רושם את השגיאה ב-Logs של השרת.
- `metadata.title`: `Error — Ordan Cargo Future Clients` (ב-`error.tsx`, שהוא Client Component, דרך תגית `<title>`).

## 4. שינויים בקבצים

### Frontend
- **`src/lib/auth-actions.ts`**: `signInWithCredentials` לפי שלב 2.
- **`src/components/ui/ErrorContent.tsx`** (חדש): רכיב דף השגיאה, מקבל `onRetry` ו-`className`.
- **`src/app/(app)/error.tsx`** (חדש), **`src/app/error.tsx`** (חדש), **`src/app/global-error.tsx`** (חדש).
- **`src/components/ui/NotFoundContent.tsx`**: אם יש קוד משותף (המסגרת של ה-Card) — הוצאה לרכיב קטן משותף. רק אם זה פשוט; אחרת נשאר כמו שהוא.

### Backend
- אין שינוי, אלא אם ה-Logs של Production יראו שהבעיה שם.

### Tests
- **`src/lib/auth-actions.test.ts`** (חדש), עם `signIn` מדומה:
  - `CredentialsSignin` → `Wrong username or password.` ושם המשתמש חוזר.
  - שגיאה עם `type: 'CredentialsSignin'` שאינה מופע של המחלקה (מצב שני העותקים) → אותה הודעה.
  - `AuthError` אחר, `Error` רגיל (למשל מגבלת זמן) → `Sign in failed. Please try again.`
  - הפניה (`NEXT_REDIRECT`) אחרי כניסה מוצלחת → נזרקת הלאה ולא הופכת להודעה.
  - שדות ריקים → `Enter your username and password.`
  - כשל בכניסה האוטומטית אחרי Create Account → הודעה ולא קריסה.
- **`src/app/sign-in/PasswordSignInForm.test.tsx`** (חדש): כשהפעולה מחזירה שגיאה — ה-Alert מוצג מעל השדות, השדות מסומנים `aria-invalid`, ושם המשתמש נשאר בשדה.
- **`src/components/ui/ErrorContent.test.tsx`** (חדש): הכותרת וההסבר מוצגים, `Try Again` קורא ל-`onRetry`, ו-`Back to Clients` מקשר ל-`/clients`.
- **Backend** (`test/users.e2e-spec.ts`): לוודא שקיים Test שמשתמש שלא קיים וסיסמה שגויה מחזירים שניהם 401 עם אותה הודעה; להוסיף אם חסר.

### מסמכים (באישור המשתמש)
- **DESIGN.md**: סעיף `1.10 Error Page` (טקסטים, מיקום, כפתורים) ושורה בתרשים הניווט 1.5.
- **ARCHITECTURE.md**: ADR — טיפול בשגיאות בכניסה עם `unstable_rethrow` וזיהוי לפי `type`, ו-Error boundaries ב-`(app)`, בשורש וב-`global-error`. ואם יתגלה ב-Logs גורם ספציפי ל-Production — גם הוא יתועד.
- **README**: אין שינוי.

## 5. בדיקה בסיום הבנייה

1. `npm run lint`, `npm run format:check`, `npm test` — עוברים.
2. **Development** (`npm run dev`):
   - שם משתמש שלא קיים + סיסמה כלשהי → `Wrong username or password.`, השדות אדומים, שם המשתמש נשאר.
   - שם משתמש קיים + סיסמה שגויה → אותה הודעה בדיוק.
   - ניסיון חוזר מיד עם הסיסמה הנכונה → כניסה ל-Clients.
   - כשל טכני: עצירת ה-Backend (פורט 4000) וניסיון כניסה → `Sign in failed. Please try again.`, בלי דף שגיאה.
   - דף השגיאה הכללי: שגיאה זמנית שנזרקת בכוונה במסך פנימי (רק לבדיקה, ונמחקת מיד אחריה) → `Something went wrong` בתוך המעטפת, ו-`Try Again` / `Back to Clients` עובדים.
3. **Production מקומי** (`next build` + `next start`) — אותן בדיקות כניסה.
4. **Production (Vercel)** — רק אחרי Push באישור המשתמש: המשתמש חוזר על הבדיקה עם שם משתמש שלא קיים, ומאשר שמוצגת ההודעה. אם לא — חוזרים ל-Logs.
5. אין Migration, ולכן אין פעולה במסד הנתונים של Production לפני הדחיפה.

## 6. התאמה ל-Definition of Done

| תנאי | איך מתקיים |
|---|---|
| שם משתמש לא קיים או סיסמה שגויה מציגים `Wrong username or password.` בלי דף שגיאה, ובלי לגלות אם המשתמש קיים | Backend מחזיר 401 זהה; `signInWithCredentials` מזהה לפי `type` ולא זורק הלאה |
| שם המשתמש נשאר בשדה ואפשר לנסות שוב מיד | `username` חוזר בכל תוצאה; Test לטופס |
| כשל טכני מציג `Sign in failed. Please try again.` | כל שגיאה שאינה הפניה או פרטים שגויים הופכת להודעה הזו |
| שגיאה לא צפויה מציגה דף שגיאה בעיצוב המערכת | `error.tsx` ב-`(app)` ובשורש, ו-`global-error.tsx` |
| נבדק ב-Development וב-Production | סעיף 5, שלבים 2–4 |
| Lint ו-Tests עוברים | סעיף 5, שלב 1 |
