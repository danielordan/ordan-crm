# תוכנית — Milestone 11: Strong Password Enforcement

מקורות: `MILESTONES.md` (Milestone 11 והפריטים הפתוחים), PRD 4.1, DESIGN 1.8 (Create Account), ARCHITECTURE 12.3 (`POST /api/v1/users/register`) ו-ADR-40 (משתמשי שם משתמש וסיסמה), והקוד הקיים (`backend/src/users/dto/password-credentials.dto.ts`, `frontend/src/lib/password-rules.ts`, `frontend/src/lib/auth-actions.ts`, `frontend/src/lib/backend-client.ts`, `frontend/src/app/sign-up/SignUpForm.tsx`).

## 1. נקודת המוצא

- **הכלל היחיד היום:** 8–128 תווים, גם ב-Frontend (`validateSignUp`) וגם ב-Backend (`registerSchema`). לכן `12345678` מתקבלת.
- **הכניסה (`passwordSignInSchema`)** בודקת רק שהסיסמה לא ריקה — ולכן משתמשים קיימים עם סיסמה חלשה ימשיכו להיכנס בלי שינוי.
- **Backend → Frontend:** כש-`/register` מחזיר 400, `registerPasswordUser` זורק שגיאה והמשתמש רואה `Could not create the account. Please try again.` — הודעה לא מדויקת (בפועל זה קורה רק אם ה-Frontend וה-Backend לא מסונכרנים).
- **אין שינוי במסד הנתונים, אין Migration ואין משתני סביבה חדשים.**

## 2. החלטות המשתמש (23.11.2026)

| # | החלטה | הבחירה |
|---|---|---|
| א | **כללי הסיסמה** | "Strict": לפחות 10 תווים, ובהם אות גדולה באנגלית, אות קטנה באנגלית, ספרה וסימן. |
| ב | **חסימת סיסמאות נפוצות** | כן — רשימה מובנית של סיסמאות מוכרות נחסמת גם אם הן עומדות בכללים. |

פירוט הכללים (לאישור כחלק מהתוכנית):
- **אורך:** 10–128 תווים (המקסימום 128 נשאר כמו היום).
- **אות גדולה:** `A–Z`. **אות קטנה:** `a–z`. **ספרה:** `0–9`.
- **סימן:** אחד מסימני הפיסוק הרגילים במקלדת: `` ! @ # $ % ^ & * ( ) - _ = + [ ] { } ; : ' " , . < > / ? \ | ` ~ ``.
- **סיסמה נפוצה:** השוואה בלי הבדל בין אותיות גדולות לקטנות לרשימה מובנית של כ-50 סיסמאות מוכרות שעומדות בכללים (למשל `Password123!`, `P@ssw0rd123`, `Qwerty123!`, `Welcome123!`, `Admin@12345`). בלי שירות חיצוני ובלי תלות חדשה.

## 3. הגישה

### כללים משותפים, בשני הצדדים
כמו היום, ה-Frontend וה-Backend הם חבילות נפרדות, ולכן הכללים מוגדרים בכל צד בנפרד, עם אותם ערכים, ו-Tests בשני הצדדים שבודקים את אותן דוגמאות.
- פונקציה אחת בכל צד: `passwordProblems(password)` → רשימת הכללים החסרים (לפי הסדר: אורך, אות גדולה, אות קטנה, ספרה, סימן), ועוד בדיקה `isCommonPassword(password)`.
- **ה-Backend הוא המקור הקובע:** `registerSchema` משתמש באותם כללים (zod `superRefine`). סיסמה חלשה → `400` עם `Invalid value for: password.` (בלי לחזור על הסיסמה).

### הודעות למשתמש (באנגלית, כמו שאר הממשק)
- **טקסט עזר מתחת לשדה Password:** `At least 10 characters, with an uppercase letter, a lowercase letter, a digit and a symbol (like ! or #).`
- **כשחסרים כללים** — הודעה אחת שמפרטת רק מה חסר, למשל עבור `12345678`:
  `Password must include: at least 10 characters, an uppercase letter, a lowercase letter, a symbol.`
- **סיסמה נפוצה:** `This password is too common. Please choose a different one.`
- **ארוכה מדי:** `Password must be at most 128 characters.` (קיים).
- סדר הבדיקות במסך: שם משתמש ← כללי הסיסמה ← סיסמה נפוצה ← אישור סיסמה (`Passwords do not match.`).
- **רשת ביטחון:** אם ה-Backend בכל זאת מחזיר 400 בהרשמה, ה-Frontend מציג `Password does not meet the requirements.` במקום הודעת התקלה הכללית.
- הבדיקה ב-Frontend רצה ב-Server Action בלחיצה על Create account (כמו היום), כך שההודעה מוצגת מיד ב-Alert מעל השדות, ושם המשתמש נשאר בשדה.

### משתמשים קיימים
- הכניסה לא משתנה: `passwordSignInSchema` ו-`password-sign-in` לא בודקים את הכללים החדשים. משתמש קיים עם סיסמה חלשה ממשיך להיכנס; אין דרישה להחליף סיסמה (אין שינוי סיסמה בגרסה הזו — PRD 4.1).

## 4. שינויים בקבצים

### Backend
- **`src/users/password-policy.ts`** (חדש): הכללים, רשימת הסיסמאות הנפוצות, `passwordProblems` ו-`isCommonPassword`.
- **`src/users/dto/password-credentials.dto.ts`**: `PASSWORD_MIN_LENGTH` = 10; `registerSchema.password` עם `superRefine` לפי `password-policy`. `passwordSignInSchema` לא משתנה.
- **Tests:**
  - `src/users/password-policy.spec.ts` (חדש): `12345678`, סיסמה בלי כל אחד מהכללים, סיסמה נפוצה (גם באותיות שונות) — נדחות; סיסמה חזקה מתקבלת.
  - `dto/password-credentials.dto.spec.ts`: עדכון הדוגמאות לסיסמה חזקה, והוספת `12345678` לרשימת הנדחות.
  - `test/users.e2e-spec.ts`: עדכון הדוגמאות; `register` עם `12345678` וסיסמה נפוצה → 400; סיסמה חזקה → 201; **משתמש קיים** עם סיסמה חלשה (נוצר ישירות בטבלה עם Hash) נכנס → 200.

### Frontend
- **`src/lib/password-rules.ts`**: אותם כללים ורשימה, `PASSWORD_MIN_LENGTH` = 10, `PASSWORD_HINT` (טקסט העזר), ו-`validateSignUp` מחזיר את ההודעות מסעיף 3.
- **`src/lib/backend-client.ts`**: `registerPasswordUser` מחזיר `'invalid'` כשהתשובה 400.
- **`src/lib/auth-actions.ts`**: `signUpWithPassword` מציג `Password does not meet the requirements.` כשהתוצאה `'invalid'`.
- **`src/app/sign-up/SignUpForm.tsx`**: טקסט העזר מ-`PASSWORD_HINT`.
- **Tests:** `password-rules.test.ts` (אותן דוגמאות כמו ב-Backend + ההודעות המדויקות), `auth-actions.test.ts` (סיסמאות חזקות בדוגמאות, ומקרה ה-400), `app/sign-up/page.test.tsx` (טקסט העזר החדש).

### מסמכים (כפי שנדרש ב-Milestone, אחרי אישור התוכנית)
- **PRD 4.1:** שורת "סיסמה" מתעדכנת לכללים מסעיף 2, והודעות השגיאה מסעיף 3 מחליפות את `Password must be at least 8 characters.` + משפט: הכללים חלים רק על חשבונות חדשים.
- **DESIGN 1.8:** טקסט העזר החדש מתחת לשדה Password.
- **ARCHITECTURE 12.3:** כללי `password` ב-`/register`; סעיף ה-Tests; **ADR-44: כללי סיסמה חזקה** (הקשר: משוב המרצה; החלטה: הכללים, בדיקה בשני הצדדים, רשימה מובנית; השלכות: משתמשים קיימים לא מושפעים, כפילות הכללים בין Frontend ל-Backend מכוסה ב-Tests).
- **MILESTONES.md:** הפריט הפתוח "כללי סיסמה חזקה" נסגר (מוסר מהטבלה), ו-🟡 ליד הכותרת בסיום הבנייה.

## 5. בדיקה בסיום הבנייה
1. `npm run lint`, `npm run format:check`, `npm test` (כולל e2e מול Supabase Development).
2. `npm run dev`, ובדפדפן במסך Create account:
   - `12345678` → הודעה שמפרטת מה חסר; שם המשתמש נשאר בשדה.
   - `Password123!` → `This password is too common…`.
   - סיסמה חזקה (למשל `Ordan#Cargo26`) → כניסה אוטומטית ל-Clients.
   - טקסט העזר מציג את כל הכללים.
3. בקשה ישירה ל-`POST /api/v1/users/register` עם `12345678` → 400.
4. כניסה עם משתמש קיים שנרשם בעבר עם סיסמה של 8 תווים → מצליחה.
5. אין קובץ Migration חדש.

## 6. מחוץ לתחום
- מד חוזק סיסמה, בדיקה בזמן ההקלדה, או בדיקה מול שירותי דליפות (למשל Have I Been Pwned).
- חיוב משתמשים קיימים להחליף סיסמה, שינוי סיסמה או שחזור סיסמה.
- איסור על סיסמה שמכילה את שם המשתמש (לא נבחר).
