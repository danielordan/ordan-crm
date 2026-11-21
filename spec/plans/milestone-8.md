# תוכנית — Milestone 8: Google Sign-In App Name

מקורות: `MILESTONES.md` (Milestone 8 ופריטים פתוחים), PRD 4.1, DESIGN 1.7, ARCHITECTURE (ADR-18, ADR-24, סעיף 16, טבלת הסביבות), README (Google OAuth Production), הקוד הקיים (`proxy.ts`, `lib/access.ts`, `next.config.ts`, `AuthLayout.tsx`), ותיעוד Google על Brand verification (נבדק בנובמבר 2026).

## 1. נקודת המוצא

- כרגע, במסך הבחירה של Google ב-Production מוצגת הכתובת `ordan-crm-3f91.vercel.app` במקום שם האפליקציה.
- **מה Google דורש:** השם והלוגו מוצגים רק אחרי **Brand verification**. בלי אימות, Google מציג רק את הכתובת. תנאי האימות:
  - דף בית (Home page) ציבורי, שלא דורש כניסה, שמתאר את האפליקציה ומקשר לדף מדיניות הפרטיות.
  - דף מדיניות פרטיות (Privacy policy) ציבורי.
  - **Authorized domain בבעלותנו**, שאומת ב-Google Search Console עם חשבון Google שהוא Owner ב-Project של Google Cloud. דף הבית ודף הפרטיות צריכים להיות על הדומיין הזה.
- **הכתובת `vercel.app` כנראה לא תעבור את האימות:** הבעלות על `vercel.app` שייכת ל-Vercel, וישנם דיווחים על אימות שנתקע בכתובות כאלה. לכן, לפי ההוראה ב-Milestone, **נדרשת החלטה של המשתמש על דומיין לפני הבנייה** (סעיף 2).
- הכניסה עם Google משתמשת ב-Scopes בסיסיים בלבד (`openid`, `email`, `profile`). לכן נדרש רק Brand verification קצר (בדרך כלל כמה ימי עבודה), ולא אימות מלא של הרשאות רגישות.
- **אין שינוי במבנה מסד הנתונים**, ולכן אין Migration ל-Production. אין משתני סביבה חדשים.

## 2. החלטות שנדרשות מהמשתמש לפני הבנייה

| # | החלטה | אפשרויות |
|---|---|---|
| א | **דומיין** | (1) לקנות דומיין חדש, למשל `ordancargo-crm.com` (בערך 10–20 דולר לשנה, דרך Vercel או ספק דומיינים אחר). (2) להשתמש בדומיין קיים של החברה, כתת-דומיין כמו `crm.<company>.com` (בלי עלות, אבל צריך גישה להגדרות ה-DNS של החברה). (3) לוותר על אימות: רק להגדיר שם, מייל תמיכה ולוגו. **במקרה זה Google ימשיך להציג את הכתובת, וה-DoD הראשון לא יתקיים.** |
| ב | **שם האפליקציה** | ברירת המחדל: `Ordan Cargo`. |
| ג | **לוגו** | אופציונלי. אם מעלים לוגו, הוא חייב לעבור את אותו אימות. הצעה: הלוגו הקיים (`icon.svg`), כ-PNG בגודל 120×120. |
| ד | **מייל תמיכה ומייל ליצירת קשר** | מייל של המשתמש או של החברה. |
| ה | **טקסט מדיניות הפרטיות** | הטקסט מגיע מהמשתמש, ולא מומצא (`MILESTONES.md`). Claude יכול להציע רשימה של הנושאים ש-Google מצפה לראות (אילו נתונים נאספים מ-Google: שם ומייל, למה, איפה נשמרים, ואיך מבקשים מחיקה), אבל הניסוח הוא של המשתמש. |
| ו | **שינוי במסך Sign In** | Google דורש שדף הבית יתאר את האפליקציה ויקשר לדף הפרטיות. ההצעה: להשתמש במסך **Sign In** כדף הבית, ולהוסיף לו קישור קטן `Privacy Policy` בתחתית ה-Card, ומשפט תיאור קצר (הנוסח מהמשתמש). זה שינוי ב-DESIGN 1.7, ולכן הוא דורש אישור מפורש לפני עדכון המסמך. |

אם המשתמש בוחר באפשרות (3) בהחלטה א, הבנייה מצטמצמת לשלב ג בסעיף 4 בלבד, וה-Milestone מסומן עם ההערה שה-DoD הראשון לא הושג.

## 3. שינויים בקבצים (לפי אפשרות 1 או 2)

### Frontend
- **`frontend/src/app/privacy/page.tsx`** (חדש): דף **Privacy Policy** ציבורי. משתמש ב-`AuthLayout` הקיים (רקע Navy ו-Card), עם כותרת, הטקסט של המשתמש וקישור חזרה ל-**Sign In**. `metadata.title`: `Privacy Policy — Ordan Cargo Future Clients`. טקסט באנגלית, LTR, כמו שאר הממשק.
- **`frontend/src/lib/access.ts`**: הוספת `/privacy` ל-`PUBLIC_PATHS`. בניגוד ל-`/sign-in`, משתמש מחובר **לא** מועבר ממנו ל-Clients.
- **`AuthLayout.tsx` או `sign-in/page.tsx`**: קישור `Privacy Policy` בתחתית, ומשפט התיאור (החלטה ו). ב-Create Account מופיע אותו קישור, אם הוא ב-`AuthLayout`.
- **Tests:**
  - `access.test.ts`: `/privacy` פתוח בלי כניסה, גם למשתמש מחובר. `/clients` ו-`/upload` עדיין מפנים ל-Sign In.
  - `privacy/page.test.tsx` (חדש): הכותרת והקישור חזרה מוצגים.
  - `sign-in/page.test.tsx`: הקישור ל-`/privacy` מוצג.
- **`robots.txt`:** לא משתנה. דף הפרטיות צריך להיות נגיש ל-Google.

### תיעוד
- **README**, בסעיף Google OAuth (Production): הדומיין, ה-Origins וה-Redirect URIs המעודכנים, הגדרות ה-Branding, ואימות הדומיין ב-Search Console.
- **`ARCHITECTURE.md`**: ADR חדש — "דומיין משלנו ו-Brand verification ב-Google", עם הקשר, החלטה והשלכות (עלות שנתית, תלות ב-DNS, דף ציבורי חדש). עדכון טבלת הסביבות ורשימת הנתיבים הציבוריים, באישור המשתמש.
- **`DESIGN.md`**: הוספת דף Privacy Policy ועדכון 1.7, רק באישור המשתמש (החלטה ו).
- **`PRD.md`**: לא משתנה, אלא אם המשתמש יבקש.

## 4. סדר הביצוע

Claude עוצר בכל שלב שדורש פעולה של המשתמש, מדריך אותו צעד אחר צעד בשפה פשוטה וממתין לאישור. Claude לא מתחבר לחשבונות ולא מזין פרטים.

| # | שלב | מי מבצע | עצירה לאישור |
|---|---|---|---|
| א | קבלת ההחלטות מסעיף 2, כולל טקסט מדיניות הפרטיות | המשתמש | כן |
| ב | בניית דף הפרטיות, הקישור במסך Sign In והבדיקות (סעיף 3), ובדיקה מקומית | Claude | — |
| ג | Google Auth Platform → **Branding**: שם, מייל תמיכה, לוגו (אם נבחר) ומייל ליצירת קשר. ב-Project של **Production** | המשתמש | כן |
| ד | קניית הדומיין או הכנת תת-הדומיין, וחיבורו ל-Project של ה-Frontend ב-Vercel (Settings → Domains), כולל רשומות ה-DNS ש-Vercel מציג | המשתמש | כן |
| ה | אימות הדומיין ב-**Google Search Console** (Domain property, רשומת TXT ב-DNS), עם החשבון שהוא Owner ב-Google Cloud | המשתמש | כן |
| ו | **Push** של הקוד (דף הפרטיות) כדי שיעלה ל-Production | Claude | **כן, אישור מפורש** |
| ז | ב-OAuth Client של Production: הוספת Origin ו-Redirect URI עם הדומיין החדש (`https://<domain>/api/auth/callback/google`). הכתובת של `vercel.app` נשארת, כדי ששתי הכתובות ימשיכו לעבוד | המשתמש | כן |
| ח | ב-Branding: Home page `https://<domain>/sign-in`, Privacy policy `https://<domain>/privacy`, Authorized domain `<domain>`. ואז **Submit for verification** | המשתמש | כן |
| ט | המתנה לאישור של Google (בדרך כלל כמה ימי עבודה). אם Google מבקש תיקונים — Claude עוזר לטפל בהם | שניהם | כן |
| י | בדיקה סופית (סעיף 5) וסימון 🟡 | Claude והמשתמש | — |

**הערות:**
- Auth.js ב-Vercel מזהה את הכתובת לפי הבקשה, ולכן לא נדרש משתנה סביבה חדש בשביל הדומיין. אם יתברר אחרת בבדיקה — Claude יעצור ויגיד למשתמש איזה משתנה להוסיף ב-Vercel.
- ה-Push בשלב ו נעשה לפני הסימון 🟡, כי Google צריך לראות את דף הפרטיות באוויר. לכן Claude מבקש עליו אישור מפורש (`CLAUDE.md`). ה-Push לא מאשר את ה-Milestone.
- Google Cloud של **Development** לא משתנה. הכניסה עם Google ב-`localhost` ממשיכה לעבוד כמו היום.

## 5. בדיקות מול ה-Definition of Done

| תנאי | איך נבדק |
|---|---|
| במסך הבחירה של Google ב-Production מוצג `Ordan Cargo` | המשתמש לוחץ **Sign in with Google** ב-Production (בדומיין החדש וגם ב-`vercel.app`), ומוודא שמוצג השם ולא הכתובת. אפשר רק אחרי אישור Google |
| הכניסה עם Google עובדת ב-Development וב-Production | כניסה מלאה ב-`localhost` (Claude, בדפדפן המובנה) וב-Production (המשתמש), עד מסך Clients |
| דף ציבורי נפתח בלי כניסה, ושאר הדפים דורשים כניסה | Tests של `access.ts`, ובדיקה בדפדפן: `/privacy` נפתח בלי כניסה; `/clients` ו-`/upload` מפנים ל-Sign In |
| Lint ו-Tests עוברים | `npm run lint`, `npm run format:check`, `npm test` |

## 6. סיכונים

- **Google עלול לדחות את האימות** (למשל אם דף הבית לא מתאר מספיק את האפליקציה). במקרה זה Claude מציג את הסיבה ומציע תיקון.
- **זמן ההמתנה לאישור** לא בשליטתנו. ה-Milestone מסומן 🟡 רק אחרי שהשם מוצג בפועל, או בהחלטה של המשתמש לסמן אותו עם הערה.
- **עלות:** דומיין חדש הוא הוצאה שנתית שצריך לחדש, אחרת האתר והאימות יפסיקו לעבוד.
