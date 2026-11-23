# תוכנית — Milestone 9: 404 Page

מקורות: `MILESTONES.md` (Milestone 9 ופריטים פתוחים), DESIGN 1.3, 1.5, 1.7 ו-2 (Style Guide), ARCHITECTURE 16.1, והקוד הקיים (`app/layout.tsx`, `app/(app)/layout.tsx`, `app/(app)/clients/[id]/page.tsx`, `ClientDetailsView.tsx`, `lib/clients-api.ts`, `lib/access.ts`, `proxy.ts`, `AuthLayout.tsx`).

## 1. נקודת המוצא

- **כתובת שלא קיימת** (למשל `/abc`): משתמש מחובר רואה את דף ה-404 של ברירת המחדל של Next.js (לבן, "This page could not be found"). משתמש לא מחובר מועבר קודם ל-Sign In (ה-`proxy` חוסם כל כתובת שאינה ציבורית), ואחרי הכניסה חוזר ל-`/abc` ורואה את אותו דף ברירת מחדל.
- **Client Details של לקוח שלא קיים או מזהה לא תקין:** הטעינה נעשית בדפדפן (`fetchClient`). 404 או 400 מה-Backend הופכים ל-`ClientNotFoundError`, ו-`ClientDetailsView` מציג בתוך המסך את ההודעה `Client not found.` — לא דף 404.
- אותה הודעה מוצגת גם כשהלקוח נמחק בזמן שהמסך פתוח (בשמירה או במחיקה).
- **אין שינוי במסד הנתונים, אין Migration ואין משתני סביבה חדשים.** אין שינוי ב-Backend.

## 2. החלטות המשתמש

**אושרו כל ההצעות שבטבלה** (א: הטקסטים כמו שהוצעו; ב: אפשרות 1, בתוך מעטפת המערכת עם סרגל הניווט; ג: גם לקוח שנמחק בזמן שהמסך פתוח מציג את דף ה-404). כולל אישור להוסיף אותן ל-DESIGN.md.

| # | החלטה | הצעה |
|---|---|---|
| א | **טקסטי הדף** (באנגלית, כמו שאר הממשק) | מספר גדול `404` בצבע Teal; כותרת `Page not found`; הסבר `The page you're looking for doesn't exist or may have been deleted.`; כפתור Primary `Back to Clients`. |
| ב | **איפה הדף מוצג** | **(1) מומלץ:** בתוך מעטפת המערכת, עם סרגל הניווט בצד (כמו Clients ו-Upload PDF). המשתמש רואה מיד שהוא עדיין במערכת, ויכול גם לנווט מהסרגל. (2) דף נפרד על רקע Navy עם Card לבן, כמו מסך Sign In. |
| ג | **לקוח שנמחק בזמן שהמסך פתוח** | ההצעה: גם במקרה הזה מוצג דף ה-404, כדי שתהיה התנהגות אחת לכל "לקוח לא נמצא". |

אחרי האישור, הטקסטים וההחלטות יתווספו ל-DESIGN.md כסעיף חדש `1.9 Page Not Found`, ושורה בתרשים הניווט (1.5). ההוספה ל-DESIGN.md רק באישור המשתמש.

## 3. הגישה

- **משתמש לא מחובר** ממשיך להיות מועבר ל-Sign In בכל כתובת לא ציבורית, גם כזו שלא קיימת. כך לא נחשף מי שלא מחובר לשום דף פנימי, ואין שינוי ב-`proxy` או ב-`access.ts`. לכן דף ה-404 מוצג בפועל רק למשתמש מחובר, והכפתור `Back to Clients` תמיד מתאים. (אם בכל זאת המשתמש לא מחובר ולוחץ, ה-`proxy` מעביר אותו ל-Sign In — כך מתקיים גם התנאי ב-DoD.)
- **רכיב אחד משותף** `NotFoundContent`, שמשמש בכל המקרים, כדי שהטקסט והעיצוב יהיו זהים.
- **כתובת לא קיימת:** קובץ `not-found.tsx` של Next.js. כדי שהדף יופיע עם סרגל הניווט (החלטה ב1), נוסיף Route "תופס הכל" בתוך קבוצת `(app)` (`app/(app)/[...missing]/page.tsx`) שקורא ל-`notFound()`, וקובץ `app/(app)/not-found.tsx` שמציג את `NotFoundContent`. כך כתובת לא מוכרת נכנסת ל-`(app)` ומקבלת את ה-AppShell. Routes מוגדרים (`/clients`, `/upload`, `/sign-in`, `/sign-up`, `/api/...`) קודמים ל-Route התופס, ולכן לא מושפעים.
  - בנוסף, `app/not-found.tsx` בשורש, כגיבוי לכל `notFound()` אחר (למשל `/dev/components` ב-Production). בשורש אין AppShell, ולכן הוא יציג את `NotFoundContent` במרכז המסך על רקע Background.
  - אם נבחרת אפשרות ב2: אין צורך ב-Route התופס — רק `app/not-found.tsx` שמשתמש ב-`AuthLayout` (או בגרסה שלו בלי הכותרת).
- **מזהה לא תקין:** `clients/[id]/page.tsx` (Server Component) בודק שה-`id` הוא UUID. אם לא — `notFound()` מיד, בלי לפנות ל-Backend.
- **לקוח שלא קיים (UUID תקין):** הטעינה בדפדפן מחזירה `ClientNotFoundError`. במקום ההודעה `Client not found.`, `ClientDetailsView` מציג את `NotFoundContent` (במקום כל תוכן המסך, באותו מיקום שבו מוצג דף ה-404 תחת `(app)`). זה נראה זהה לדף ה-404.
  - הערה טכנית: במקרה הזה כתובת הדף מחזירה לדפדפן קוד HTTP 200 ולא 404, כי הבדיקה נעשית אחרי שהדף נטען. למשתמש זה לא נראה שונה, ובמערכת פנימית שלא נסרקת במנועי חיפוש זה לא משנה. מזהה לא תקין וכתובת לא קיימת כן מחזירים 404 אמיתי.
- **לקוח שנמחק בזמן שהמסך פתוח** (החלטה ג): אותו מצב `not-found` שקיים כבר — רק התצוגה משתנה ל-`NotFoundContent`.
- `metadata.title` של הדף: `Page Not Found — Ordan Cargo Future Clients`.

## 4. שינויים בקבצים

### Frontend
- **`src/components/ui/NotFoundContent.tsx`** (חדש): Card לבן ממורכז (radius 12px, צל לפי DESIGN 2.11), אייקון Lucide בסגנון outline (למשל `FileQuestion` או `SearchX`) ב-Teal, המספר `404` (H1, Bold, Teal), הכותרת (H2, Navy), ההסבר (Body Large, Text Secondary), וכפתור `Button` הקיים במצב Primary שמקשר ל-`/clients` (באמצעות `Link`). רווחים לפי grid של 8px.
- **`src/app/(app)/not-found.tsx`** (חדש): מציג `NotFoundContent`.
- **`src/app/(app)/[...missing]/page.tsx`** (חדש): קורא ל-`notFound()` בלבד.
- **`src/app/not-found.tsx`** (חדש): גיבוי בשורש, `NotFoundContent` על רקע Background, ממורכז.
- **`src/lib/client-details.ts`**: פונקציה קטנה `isClientId(value)` שבודקת פורמט UUID.
- **`src/app/(app)/clients/[id]/page.tsx`**: אם `!isClientId(id)` — `notFound()`.
- **`src/components/clients/ClientDetailsView.tsx`**: במצב `not-found` — `NotFoundContent` במקום ההודעה `Client not found.`.
- **`lib/clients-api.ts`**: נשאר כמו שהוא (400 עדיין נחשב לא נמצא, כגיבוי).

### Tests
- **`src/components/ui/NotFoundContent.test.tsx`** (חדש): הכותרת, ההסבר וה-`404` מוצגים, והכפתור מקשר ל-`/clients`.
- **`src/lib/client-details.test.ts`** (חדש או קיים): `isClientId` מקבל UUID ודוחה מחרוזות כמו `abc`, `123`, ריק.
- **`ClientDetailsView.test.tsx`**: שלושת ה-Tests הקיימים שבודקים `Client not found.` (לקוח חסר, מזהה לא תקין, נמחק בינתיים) יבדקו עכשיו את כותרת דף ה-404 ואת הכפתור `Back to Clients`.
- **`access.test.ts`**: Test שמוודא שכתובת לא קיימת (`/abc`) עדיין מעבירה משתמש לא מחובר ל-Sign In.

### מסמכים (באישור המשתמש)
- **DESIGN.md**: סעיף `1.9 Page Not Found` עם הטקסטים, המיקום וההתנהגות; שורה בתרשים 1.5; ב-1.3 — "לקוח שלא קיים מציג את דף ה-404".
- **ARCHITECTURE.md**: ADR קצר — דף 404 בתוך `(app)` עם Route תופס, בדיקת UUID ב-Server, ולקוח חסר מוצג בדפדפן עם HTTP 200.
- **README**: אין שינוי.

## 5. בדיקה בסיום הבנייה

1. `npm run lint`, `npm run format:check`, `npm test` — עוברים.
2. הרצה מקומית (`npm run dev`) ובדיקה בדפדפן, כשמחוברים:
   - `/abc` ו-`/clients/abc/xyz` → דף 404 מעוצב עם סרגל הניווט; הכפתור מחזיר ל-Clients.
   - `/clients/abc` (מזהה לא תקין) → דף 404.
   - `/clients/<UUID אקראי>` → דף 404.
   - לקוח קיים → Client Details רגיל. `/clients`, `/upload` — עובדים כרגיל.
3. כשלא מחוברים: `/abc` → מעבר ל-Sign In; אחרי כניסה → דף ה-404.
4. השוואה ויזואלית לצבעים, לגופן ולכפתורים של DESIGN 2 (צילום מסך).
5. אין Migration, ולכן אין צורך בפעולה ב-Production לפני הדחיפה.

## 6. התאמה ל-Definition of Done

| תנאי | איך מתקיים |
|---|---|
| כתובת לא קיימת מציגה את דף ה-404 של המערכת | Route תופס + `(app)/not-found.tsx`, וגיבוי ב-`app/not-found.tsx` |
| תואם ל-DESIGN.md | `NotFoundContent` בנוי מה-`Button` הקיים ומצבעי ה-Tailwind של המערכת |
| הכפתור מחזיר ל-Clients (או ל-Sign In כשלא מחובר) | קישור ל-`/clients`; ה-`proxy` מעביר משתמש לא מחובר ל-Sign In |
| לקוח שלא קיים או מזהה לא תקין מציג 404 | בדיקת UUID ב-`page.tsx`, ומצב `not-found` ב-`ClientDetailsView` |
| Lint ו-Tests עוברים | סעיף 5 |
