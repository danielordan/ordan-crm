# MILESTONES — Ordan Cargo Future Clients

מסמך זה מחלק את פיתוח ה-MVP לאבני דרך (Milestones), על בסיס [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md) ו-[DESIGN.md](DESIGN.md).

---

## Development Execution Rules — הנחיות מחייבות ל-AI שמבצע את הפיתוח

1. יש לפתח את ה-Milestones **לפי הסדר** שמוגדר במסמך זה.
2. בסיום כל Milestone יש **לעצור את הפיתוח** ולהציג למשתמש:
   - את התוצר שהושלם: מה עובד, איך מריצים אותו ואיך בודקים אותו.
   - את תוצאות הבדיקה מול **כל** סעיף ב-Definition of Done. לכל סעיף יש לציין עבר או נכשל, ואיך זה נבדק.
3. **אין להתחיל** את ה-Milestone הבא ללא אישור מפורש של המשתמש.
4. פעולות שדורשות חשבון, הרשאה או תשלום אצל ספק חיצוני (Supabase, Google Cloud, OpenAI, Vercel, GitHub) מבצע **המשתמש**. ה-AI מנחה אותו צעד אחר צעד, בשפה פשוטה, וממתין לאישור שהשלב בוצע. ה-AI לא מזין credentials בעצמו.
5. Secrets לא נכנסים ל-Git. ההגדרות נשמרות בקובץ `.env` מקומי, ולצדו קובץ `.env.example` ללא ערכים.
6. כל שינוי במבנה מסד הנתונים מתבצע באמצעות **Database Migration** בקוד, ונבדק מול סביבת **Development בלבד**.
7. **סביבת Production לא בשימוש עד Milestone 5.** עד אז אין להריץ עליה Migrations ואין לגשת אליה. הבדיקה "Migrations שלא הורצו על Production" שמופיעה ב-`CLAUDE.md` לפני Push **לא חלה** על Milestones 1–4. בהם ה-Push לא ממתין ל-Production. ב-Milestone 5 ה-Migrations רצות על Production, באישור מפורש של המשתמש.
8. אין צורך להתקין Docker על מחשב המשתמש, ואין שימוש ב-Docker בפרויקט. הפריסה נעשית ישירות מ-GitHub ל-Vercel ב-Milestone 5.
9. אין להוסיף פיצ'רים, מסכים או יכולות שלא מופיעים ב-PRD. בפרט: **אין מייל שיווקי ואין Email Status**.
10. אם מתגלה סתירה בין המסמכים, יש לפעול לפי כללי הסתירות שב-`CLAUDE.md`. כשהם לא מכריעים, יש לעצור ולשאול.

---

## סקירת ה-Milestones

| # | Milestone | סוג | תלוי ב- |
|---|---|---|---|
| 1 | Project Foundation & App Shell | טכני (הקמה) | — |
| 2 | Sign in with Google & Clients List | Vertical Slice | 1 |
| 3 | Client Details, Edit & Delete | Vertical Slice | 2 |
| 4 | PDF Upload & Extraction | Vertical Slice | 3 |
| 5 | Production Deployment | טכני (פריסה) | 4 |

---

## Milestone 1 — Project Foundation & App Shell ✅

### שם ומטרה
הקמת שלד הפרויקט: Frontend ו-Backend רצים מקומית ומחוברים זה לזה דרך ה-Proxy המאובטח, עם מעטפת ממשק שמבוססת על ה-Design System. זהו תנאי מקדים לכל ה-Slices הבאים.

### מה יש לממש
- **Repository** עם שתי אפליקציות: `frontend` (Next.js + React + TypeScript, App Router) ו-`backend` (NestJS + Node.js 24 LTS + TypeScript).
- **Backend:**
  - מבנה ה-Modules לפי ARCHITECTURE סעיף 6.2.
  - Config module שקורא את משתני הסביבה מ-ARCHITECTURE סעיף 19.
  - Structured JSON logging עם Request ID.
  - Global exception filter שלא חושף raw errors.
  - `GET /health`, שלא דורש מפתח API.
  - API Key Guard על `/api/v1/*`, שמחזיר 401 כשהמפתח חסר או שגוי.
  - Rate limiting.
- **Frontend:**
  - Middleware של Basic Auth עם `SITE_PASSWORD`. **הגנה זמנית:** מוחלפת בכניסה עם Google ב-Milestone 2 (ARCHITECTURE ADR-18).
  - מנגנון Proxy ב-Route Handlers ל-`BACKEND_API_URL`, שמוסיף את `X-API-Key`. ב-Milestone זה הוא נבדק מול endpoint בדיקה פנימי.
  - Design tokens מ-DESIGN סעיף 2: צבעים, הגופן Inter, Typography, Spacing, Radius ו-Shadow.
  - רכיבי בסיס: Button (Primary / Secondary / Destructive), Input, Select, Status Badge, Card, Alert, Modal.
  - **App Shell עם סרגל ניווט בצד שמאל**, לפי DESIGN סעיף 1.0: שם המערכת, **Clients** ו-**Upload PDF**.
  - Routes: `/` מפנה ל-`/clients`. בנוסף `/clients`, `/clients/[id]` ו-`/upload`, עם כותרות בלבד בשלב זה.
- **כלי פיתוח:**
  - Lint, Formatter ו-Test runner לשתי האפליקציות.
  - `.env.example` לשתי האפליקציות.
  - פקודה אחת שמריצה את שתי האפליקציות מקומית.
  - README עם הוראות הרצה.
  - עדכון "פקודות הרצה" ב-`CLAUDE.md`.

### תוצר מצופה
המשתמש מריץ את המערכת מקומית, מזין את סיסמת הגישה, רואה את המעטפת עם סרגל הניווט ומנווט בין Clients ל-Upload PDF.

### Definition of Done
- [ ] `frontend` ו-`backend` עולים מקומית בפקודה אחת, לפי ה-README, ללא שגיאות.
- [ ] פתיחת האתר מציגה חלון סיסמה של הדפדפן. סיסמה שגויה נחסמת, וסיסמה נכונה נכנסת.
- [ ] `GET /health` מחזיר 200 בלי מפתח API.
- [ ] בקשה ל-`/api/v1/*` בלי `X-API-Key` או עם מפתח שגוי מחזירה 401.
- [ ] בקשה שעוברת דרך ה-Proxy של ה-Frontend מגיעה ל-Backend בהצלחה.
- [ ] גלישה ל-`/` מפנה ל-`/clients`.
- [ ] סרגל הניווט מוצג בכל המסכים, והניווט בין Clients ל-Upload PDF עובד.
- [ ] הצבעים, הגופן והרכיבים תואמים ל-DESIGN.md.
- [ ] Lint ו-Tests רצים ועוברים בשתי האפליקציות.
- [ ] אין Secrets ב-Repository, ו-`.env.example` מתעד את כל המשתנים.

---

## Milestone 2 — Sign in with Google & Clients List ✅

### שם ומטרה
המשתמש נכנס למערכת עם חשבון Google, ונרשם אוטומטית בכניסה הראשונה. אחר כך הוא צופה ברשימת הלקוחות במסך הבית, ומחפש, מסנן, ממיין ומדפדף בה. זהו ה-Milestone הראשון שמשתמש במסד הנתונים, ולכן הוא כולל גם את הקמת סביבות ה-Database.

### מה יש לממש
- **הקמת סביבות Supabase** (ARCHITECTURE ADR-19). המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  1. יצירת חשבון ב-Supabase.
  2. יצירת **שני Projects נפרדים**, `ordan-dev` ו-`ordan-prod`, כל אחד עם Database password חזק משלו.
  3. העתקת ה-Connection String של **Development** (Session pooler) ומזהה ה-Project שלו לקובץ `.env` המקומי (`DATABASE_URL`, `DATABASE_DEV_PROJECT_REF`).
  4. שמירת פרטי Production בצד, לשימוש ב-Milestone 5. **אין להתחבר ל-Production בשלב זה.**
- **הקמת Google OAuth לסביבת Development.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  1. יצירת Project ב-Google Cloud.
  2. הגדרת OAuth consent screen, והעברתו למצב "In production" כדי שכל חשבון Google יוכל להיכנס.
  3. יצירת OAuth Client מסוג Web application, עם redirect ל-`http://localhost:3000/api/auth/callback/google`.
  4. העתקת ה-Client ID וה-Client Secret ל-`frontend/.env` (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`), ויצירת `AUTH_SECRET`.
- **מנגנון Database Migrations**, לפי ARCHITECTURE סעיף 11.7. ה-Migration הראשון יוצר את הטבלאות `clients` ו-`users`, את כל ה-Indexes מסעיפים 11.4, 11.5 ו-11.6, ומפעיל RLS.
- **Sign in with Google**, לפי PRD 4.1, ARCHITECTURE סעיפים 5.1, 11.6, 12.3 ו-16.1, ו-DESIGN סעיף 1.7:
  - Backend: Users Module ו-`POST /api/v1/users/google-sign-in` (upsert לפי `googleId`).
  - Frontend: Auth.js עם Google provider, מסך **Sign In**, ו-Proxy שבודק session: דפים מפנים ל-`/sign-in`, ו-`/api/*` מחזירים 401.
  - הסרת Basic Auth ו-`SITE_PASSWORD` מ-Milestone 1, ועדכון `.env.example` וה-README.
- **Client schema** לפי ARCHITECTURE סעיף 11.2.
- **Backend:** `GET /api/v1/clients` לפי ARCHITECTURE סעיפים 12.1 ו-13:
  - `search` על Company Name, Email ו-Phone. חיפוש הטלפון לפי ספרות בלבד.
  - סינון לפי `processingStatus`.
  - `sortOrder` לפי `dateAdded`.
  - Pagination של 25 רשומות, עם `hasNextPage`.
- **Frontend:** מסך **Clients** לפי DESIGN סעיף 1.1:
  - כותרת וכפתור **Upload PDF**.
  - Search, Filter ו-Refresh.
  - טבלה עם 5 עמודות ו-**View**.
  - מיון בלחיצה על Date Added.
  - Status Badges.
  - הצגת `NOT Available` לערכים חסרים.
  - תאריכים בפורמט `Jul 20, 2026`, לפי Asia/Jerusalem.
  - **Previous** ו-**Next**.
  - מצב ריק ומצב טעינה.
- **Seed script לסביבת Development בלבד.** הסקריפט יוצר רשומות בדיקה שמכסות את שני הסטטוסים ואת השדות החסרים. הוא נחסם מלרוץ כש-`DATABASE_URL` לא מצביע על ה-Project של Development (ARCHITECTURE ADR-20).

### תוצר מצופה
המשתמש נכנס עם Google ונרשם בטבלת `users`. מסך Clients עובד מקצה לקצה מול ה-Database של Development: רשומות הבדיקה מוצגות, וחיפוש, סינון, מיון ו-Pagination פועלים.

### Definition of Done
- [ ] שני Projects ב-Supabase (Development ו-Production) קיימים, והמשתמש אישר את הקמתם. ה-Backend המקומי מחובר ל-Development בלבד.
- [ ] ה-Migrations רצו בהצלחה על **Development**, וכל ה-Indexes קיימים בפועל.
- [ ] הרצה חוזרת של ה-Migrations לא משנה ולא שוברת דבר.
- [ ] Seed script רץ על Development.
- [ ] Google OAuth Development הוגדר על ידי המשתמש, והכניסה עם Google עובדת.
- [ ] כניסה ראשונה עם Google יוצרת רשומה ב-`users`, וכניסה חוזרת לא יוצרת כפילות. אין סיסמאות ב-Database.
- [ ] בלי כניסה, כל דף מפנה ל-`/sign-in`, ו-`/api/*` מחזיר 401. חלון הסיסמה של הדפדפן ו-`SITE_PASSWORD` הוסרו.
- [ ] מסך Sign In תואם ל-DESIGN.md סעיף 1.7.
- [ ] החיפוש לפי Company Name, Email ו-Phone מחזיר תוצאות נכונות. למשל, `03-555` מוצא את `+972 3 555...` כשהספרות תואמות.
- [ ] הסינון לפי Processing Status עובד.
- [ ] המיון לפי Date Added עובד בשני הכיוונים, וברירת המחדל היא החדשים ראשונים.
- [ ] יש 25 רשומות בעמוד, ו-Previous ו-Next עובדים ומושבתים בקצוות.
- [ ] Refresh טוען את הנתונים מחדש.
- [ ] ערכים חסרים מוצגים כ-`NOT Available`, וב-Database הם `null`.
- [ ] פרמטרים לא חוקיים מחזירים 400, לא 500.
- [ ] Tests ל-API של הרשימה עוברים.
- [ ] המסך תואם ל-DESIGN.md, כולל סעיף 1.6 (מה לא נבנה).

---

## Milestone 3 — Client Details, Edit & Delete ✅

### שם ומטרה
המשתמש צופה בכל פרטי הלקוח, עורך אותם, כולל פרטי המשלוח, ורואה את הסטטוס מחושב מחדש. בנוסף הוא יכול למחוק לקוח.

### מה יש לממש
- **Backend:**
  - `ClientStatusService`, לפי ARCHITECTURE סעיף 9.1, שמחשב את `processingStatus` ואת `errorDetails`.
  - `DuplicateDetectionService`, לפי ARCHITECTURE סעיפים 9.3 ו-9.4. ב-Milestone זה הוא משמש לעריכה, וב-Milestone 4 גם להעלאה.
  - `GET /api/v1/clients/:id`.
  - `PATCH /api/v1/clients/:id`, עם כל 9 השדות הניתנים לעריכה:
    - עדכון השדות המנורמלים.
    - חישוב מחדש של הסטטוס.
    - החזרת 409 על כפילות.
  - `DELETE /api/v1/clients/:id`.
  - UUID validation, ו-404 ללקוח שלא קיים.
- **Frontend:**
  - מסך **Client Details**, לפי DESIGN סעיף 1.3: Cards לפרטי הלקוח, לפרטי המשלוח ולמצב הרשומה; Date Added עם שעה; Error Details רק כשהסטטוס הוא `Failed`.
  - מצב עריכה, עם Save ו-Cancel ו-Dropdown ל-Shipment Type. בכפילות מוצגת הודעה, והטופס נשאר במצב עריכה.
  - Delete Modal, לפי DESIGN סעיף 1.4. אחרי המחיקה המשתמש חוזר ל-Clients.

### תוצר מצופה
המשתמש פותח לקוח מהרשימה, רואה את כל פרטיו, עורך ושומר אותם, ורואה את הסטטוס מתעדכן לפי הכללים. בנוסף הוא יכול למחוק לקוח אחרי אישור.

### Definition of Done
- [ ] Client Details מציג את כל השדות לפי DESIGN, ו-Error Details מוצג רק כשהסטטוס הוא `Failed`.
- [ ] Edit, Save ו-Cancel עובדים, והערכים נשמרים בדיוק כפי שהוזנו.
- [ ] השלמה של כל שדות החובה ברשומה `Failed` משנה את הסטטוס ל-`Success` ומרוקנת את Error Details. נבדק על רשומת Seed.
- [ ] מחיקה של שדה חובה ברשומה `Success` משנה את הסטטוס ל-`Failed`, ו-Error Details מפרט את השדות החסרים.
- [ ] Address ו-Phone ריקים לא משפיעים על הסטטוס.
- [ ] עריכה שיוצרת כפילות נחסמת, לפי כל אחד משלושת כללי הכפילות, ומוצגת הודעה. שום דבר לא נשמר.
- [ ] Delete דורש אישור. Cancel ו-Close לא משנים דבר, ו-Delete מוחק לצמיתות וחוזר ל-Clients.
- [ ] `:id` לא תקין מחזיר 400, ולקוח שלא קיים מחזיר 404.
- [ ] Unit tests ל-`ClientStatusService` ול-`DuplicateDetectionService`, ו-Integration tests ל-GET, PATCH ו-DELETE, עוברים.
- [ ] המסך וה-Modal תואמים ל-DESIGN.md.

---

## Milestone 4 — PDF Upload & Extraction

### שם ומטרה
המשתמש מעלה PDF של HBL. המערכת מחלצת ממנו את פרטי ה-Consignee ואת פרטי המשלוח, בודקת כפילות ושומרת לקוח עם הסטטוס הנכון. כשנדרש טיפול ידני, מוצגת הודעה במסך.

### מה יש לממש
- **הקמת OpenAI לסביבת Development.** המשתמש יוצר OpenAI API key בהדרכה צעד אחר צעד, ושומר אותו ב-`backend/.env`.
- **Database Migration**, אם נדרש שינוי ב-schema או ב-Indexes. ה-Migration רץ על Development.
- **Backend:** `POST /api/v1/documents/process`, לפי ARCHITECTURE סעיפים 6.3, 7, 8, 9 ו-12.2:
  - קובץ PDF יחיד עד 4 MB, עם ולידציה של MIME ו-magic bytes. הקובץ נשאר בזיכרון בלבד.
  - חילוץ טקסט עם PDF.js.
  - חילוץ מובנה עם OpenAI Structured Outputs, עם timeout של 60 שניות, לפי ה-Prompt rules בסעיף 8.4.
  - Normalization וכלל "TO ORDER".
  - כשל חילוץ מלא: לא נוצרת רשומה.
  - Duplicate Detection באמצעות `DuplicateDetectionService` מ-Milestone 3.
  - יצירת רשומה, כשהסטטוס מחושב ב-`ClientStatusService`.
  - Log events ו-`processing_outcome`, לפי ARCHITECTURE סעיף 18. בלי תוכן המסמך ובלי Secrets.
- **Frontend:** מסך **Upload PDF**, לפי DESIGN סעיף 1.2:
  - Drag & Drop ו-**Choose PDF File**.
  - בדיקת סוג וגודל בצד הלקוח.
  - Processing indicator.
  - הודעות התוצאה לפי הטבלה ב-DESIGN.
  - **Try Again** בכשל טכני.
  - Route ההעלאה ב-Proxy מגדיר `maxDuration` של 130 שניות (ARCHITECTURE סעיף 7.5).

### תוצר מצופה
- המשתמש מעלה HBL אמיתי, והלקוח מופיע במסך Clients עם הפרטים והסטטוס הנכונים.
- מקרה חריג מציג הודעת טיפול ידני במסך.
- העלאה חוזרת של אותו קובץ לא יוצרת כפילות.

### Definition of Done
- [ ] OpenAI Development הוגדר על ידי המשתמש, והחיבור אליו עובד.
- [ ] Migrations, אם נוספו, רצו בהצלחה על **Development**.
- [ ] העלאת HBL תקין יוצרת לקוח עם כל 9 השדות שחולצו בצורה נכונה, עם `Success`, ומוצגת `Client added successfully.` נבדק על קובצי HBL לדוגמה שהמשתמש סיפק.
- [ ] שדה שלא מופיע במסמך נשמר כ-`null`. המערכת לא מנחשת ערכים.
- [ ] HBL שחסר בו שדה חובה אחד או יותר נשמר עם `Failed`, ו-Error Details מפרט את כולם, ומוצגת הודעת Manual Review.
- [ ] Address או Phone חסרים לא מונעים `Success`.
- [ ] Consignee מסוג "TO ORDER" נשמר עם Company Name חסר.
- [ ] כפילות לפי כל אחד משלושת הכללים: אין רשומה חדשה, אין שינוי ברשומה הקיימת, ומוצגת הודעת כפילות.
- [ ] בלי Company Name ובלי Email נוצרת רשומה חדשה גם בהעלאה חוזרת.
- [ ] PDF ללא טקסט, כשל AI או timeout מדומה: לא נוצרת רשומה, ומוצגת ההודעה `File could not be processed. Please review the file manually.`
- [ ] קובץ שאינו PDF, או קובץ גדול מ-4 MB, נחסם גם ב-Frontend וגם ב-Backend, עם ההודעה המתאימה.
- [ ] ה-PDF לא נשמר בשום מקום: לא בדיסק ולא ב-Database.
- [ ] הלוגים מכילים את אירועי העיבוד ואת ה-outcome, ללא טקסט ה-PDF וללא Secrets.
- [ ] כל תרחישי ARCHITECTURE סעיף 24 מכוסים ב-tests, עם mock ל-OpenAI, ועוברים.
- [ ] מסך Upload PDF תואם ל-DESIGN.md.

---

## Milestone 5 — Production Deployment

### שם ומטרה
פריסת המערכת לסביבת Production מאובטחת, ועדכון סביבת Production לכל השינויים שבוצעו עד כה.

### מה יש לממש
- **הכנת הקוד לפריסה ב-Vercel** (ARCHITECTURE סעיף 15.2 ו-ADR-24):
  - `backend/vercel.json`, עם `maxDuration` של 120 שניות ו-`includeFiles` עבור `certs/supabase-ca.crt`.
  - נעילת גרסת Node.js ל-`24.x` בשדה `engines`.
  - Pool קטן של חיבורי Database ב-Production.
  - פקודת Migration ל-Production, שמבקשת את ה-Connection String בשדה נסתר ולא שומרת אותו (ARCHITECTURE סעיף 21).
- **הרצת Migrations על Production**, לפי הנוהל ב-ARCHITECTURE סעיף 21: **כל ה-Database Migrations** רצים על Supabase Production, **באישור מפורש של המשתמש**, לפני ה-Push של הגרסה שתלויה בהם.
- **הקמת שירותי Production.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  - **Supabase Production**, שהוקם ב-Milestone 2: בדיקה שהפרויקט פעיל ולא מושהה.
  - **OpenAI key** ל-Production.
  - **Vercel, Project ל-Backend:**
    - חיבור ה-Repository ב-GitHub, עם Root Directory `backend`.
    - Region הקרוב ביותר ל-Supabase Production.
    - הגדרת משתני הסביבה של ה-Backend (ARCHITECTURE סעיף 19) עם ערכי Production, כולל `DATABASE_URL`. הערכים הסודיים מוגדרים כ-Secret, ורק לסביבת Production של Vercel.
  - **Vercel, Project ל-Frontend:**
    - חיבור אותו Repository, עם Root Directory `frontend` ואותו Region.
    - הגדרת `BACKEND_API_URL` (הכתובת של Project ה-Backend), `BACKEND_API_KEY`, `AUTH_SECRET`, `AUTH_GOOGLE_ID` ו-`AUTH_GOOGLE_SECRET` עם ערכי Production, רק לסביבת Production של Vercel.
  - **Google OAuth Production:** OAuth Client נפרד, עם redirect לכתובת ה-Production של ה-Frontend.
  - **תוכנית Vercel ותוכנית Supabase:** בדיקה מול המשתמש אם נדרשות תוכניות בתשלום (ARCHITECTURE סעיפים 3.2 ו-15.4). התוכנית החינמית של Vercel מיועדת לשימוש לא מסחרי בלבד.
- **אבטחה לפי ARCHITECTURE סעיף 16:**
  - `AUTH_SECRET` ו-`BACKEND_API_KEY` חזקים ושונים מאלה של Development.
  - HTTPS בלבד.
  - אין Secrets בקוד או ב-Repository.
- **Smoke test ב-Production:** העלאה של HBL אמיתי ובדיקת התהליך כולו.
- **README:** עדכון הוראות הפריסה, ותיעוד איך מריצים Migrations על Production.

### תוצר מצופה
המערכת זמינה ב-Production בכתובת HTTPS שמוגנת בכניסה עם Google, מחוברת לשירותי Production בלבד, וכל זרימות ה-PRD עובדות בה מקצה לקצה.

### Definition of Done
- [ ] כל ה-Migrations רצו בהצלחה על **Production**, באישור המשתמש, וה-Indexes קיימים.
- [ ] Push ל-`main` ב-GitHub מפעיל פריסה אוטומטית ב-Vercel, ושני ה-Projects נפרסים בהצלחה.
- [ ] ה-Frontend וה-Backend זמינים ב-Vercel ב-HTTPS, ו-`/health` מחזיר 200.
- [ ] ה-Backend מתחבר ל-Database עם אימות תעודה ב-Production, ו-PDF.js עובד בסביבת Vercel.
- [ ] פרטי Production נשמרים רק ב-Vercel, ולא ב-Repository או בקובץ במחשב המשתמש. Preview deployments לא מקבלים פרטי Production.
- [ ] האתר דורש כניסה עם Google, והכניסה עובדת ב-Production. ה-Backend מחזיר 401 לבקשה ישירה בלי מפתח API.
- [ ] ה-Backend ב-Production מחובר רק לשירותי Production.
- [ ] Smoke test: העלאת HBL תקין יוצרת לקוח עם `Success`.
- [ ] Smoke test: מקרה Manual Review מציג את ההודעה המתאימה במסך.
- [ ] Clients, Client Details, Edit ו-Delete עובדים ב-Production.
- [ ] Logs זמינים ב-Runtime Logs של Vercel, ללא תוכן PDF וללא Secrets.
- [ ] ה-README מעודכן עם הוראות הפריסה וה-Migration.

---

## פריטים פתוחים (TBD) שמשפיעים על הפיתוח

| פריט | השפעה | Milestone |
|---|---|---|
| טקסט הודעת השגיאה במסך Sign In | נדרש להצגת כשל כניסה | 2 |
| כפתור Sign out | לא מוגדר ב-PRD. להחליט אם נדרש | 2 |
| קובצי HBL לדוגמה | נדרשים לבדיקת החילוץ | 4 |
| זמינות מודל ה-AI שנבחר | לבדוק בתחילת Milestone 4 | 4 |
| מדיניות שמירת הנתונים של OpenAI | לבדוק לפני שימוש עם נתונים אמיתיים | 4 |
| תוכנית Vercel לשימוש מסחרי | עלות | 5 |
| תוכנית Supabase ל-Production | עלות, גיבוי ומניעת השהיה | 5 |
| שליחת מיילים דרך סוכן עם קונקטור ל-Microsoft 365 | לא חלק מה-MVP. שלב עתידי | — |
| בדיקה משפטית למייל שיווקי | לא משפיעה על ה-MVP. תנאי לגרסה עתידית | — |
| מדיניות גיבוי | לא משפיעה על ה-MVP | — |
