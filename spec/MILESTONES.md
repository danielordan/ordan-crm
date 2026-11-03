# MILESTONES — Ordan Cargo Future Clients

מסמך זה מחלק את פיתוח ה-MVP לאבני דרך (Milestones), על בסיס [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md) ו-[DESIGN.md](DESIGN.md).

---

## Development Execution Rules — הנחיות מחייבות ל-AI שמבצע את הפיתוח

1. יש לפתח את ה-Milestones **לפי הסדר** שמוגדר במסמך זה.
2. בסיום כל Milestone יש **לעצור את הפיתוח** ולהציג למשתמש:
   - את התוצר שהושלם: מה עובד, איך מריצים אותו ואיך בודקים אותו.
   - את תוצאות הבדיקה מול **כל** סעיף ב-Definition of Done. לכל סעיף יש לציין עבר או נכשל, ואיך זה נבדק.
3. **אין להתחיל** את ה-Milestone הבא ללא אישור מפורש של המשתמש.
4. פעולות שדורשות חשבון, הרשאה או תשלום אצל ספק חיצוני (MongoDB Atlas, AWS, OpenAI, Vercel, GitHub) מבצע **המשתמש**. ה-AI מנחה אותו צעד אחר צעד, בשפה פשוטה, וממתין לאישור שהשלב בוצע. ה-AI לא מזין credentials בעצמו.
5. Secrets לא נכנסים ל-Git. ההגדרות נשמרות בקובץ `.env` מקומי, ולצדו קובץ `.env.example` ללא ערכים.
6. כל שינוי במבנה מסד הנתונים מתבצע באמצעות **Database Migration** בקוד, ונבדק מול סביבת **Development בלבד**.
7. **סביבת Production לא בשימוש עד Milestone 5.** עד אז אין להריץ עליה Migrations ואין לגשת אליה. הבדיקה "Migrations שלא הורצו על Production" שמופיעה ב-`CLAUDE.md` לפני Push **לא חלה** על Milestones 1–4. בהם ה-Push לא ממתין ל-Production. ב-Milestone 5 ה-Migrations רצות על Production, באישור מפורש של המשתמש.
8. אין צורך להתקין Docker על מחשב המשתמש. ה-Docker image נבנה בענן ב-Milestone 5.
9. אין להוסיף פיצ'רים, מסכים או יכולות שלא מופיעים ב-PRD. בפרט: **אין מייל שיווקי ואין Email Status**.
10. אם מתגלה סתירה בין המסמכים, יש לפעול לפי כללי הסתירות שב-`CLAUDE.md`. כשהם לא מכריעים, יש לעצור ולשאול.

---

## סקירת ה-Milestones

| # | Milestone | סוג | תלוי ב- |
|---|---|---|---|
| 1 | Project Foundation & App Shell | טכני (הקמה) | — |
| 2 | Clients List | Vertical Slice | 1 |
| 3 | Client Details, Edit & Delete | Vertical Slice | 2 |
| 4 | PDF Upload, Extraction & Manual Review Alerts | Vertical Slice | 3 |
| 5 | Production Deployment | טכני (פריסה) | 4 |

---

## Milestone 1 — Project Foundation & App Shell

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
  - Middleware של Basic Auth עם `SITE_PASSWORD`.
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

## Milestone 2 — Clients List

### שם ומטרה
המשתמש צופה ברשימת הלקוחות במסך הבית, ומחפש, מסנן, ממיין ומדפדף בה. זהו ה-Milestone הראשון שמשתמש במסד הנתונים, ולכן הוא כולל גם את הקמת סביבות ה-Database.

### מה יש לממש
- **הקמת סביבות MongoDB Atlas.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  1. יצירת חשבון ב-MongoDB Atlas.
  2. יצירת **שני Projects נפרדים**, Development ו-Production, עם Cluster בכל אחד.
  3. יצירת Database User לכל סביבה.
  4. הגדרת Network Access.
  5. העתקת ה-Connection String של **Development** לקובץ `.env` המקומי.
  6. שמירת פרטי Production בצד, לשימוש ב-Milestone 5. **אין להתחבר ל-Production בשלב זה.**
- **מנגנון Database Migrations**, לפי ARCHITECTURE סעיף 11.6. ה-Migration הראשון יוצר את ה-Collection `clients` ואת כל ה-Indexes מסעיפים 11.4 ו-11.5.
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
- **Seed script לסביבת Development בלבד.** הסקריפט יוצר רשומות בדיקה שמכסות את שני הסטטוסים ואת השדות החסרים. הוא נחסם מלרוץ כש-`MONGODB_URI` מצביע על Cluster של Production.

### תוצר מצופה
מסך Clients עובד מקצה לקצה מול MongoDB Development: רשומות הבדיקה מוצגות, וחיפוש, סינון, מיון ו-Pagination פועלים.

### Definition of Done
- [ ] שני Projects ב-Atlas (Development ו-Production) קיימים, והמשתמש אישר את הקמתם. ה-Backend המקומי מחובר ל-Development בלבד.
- [ ] ה-Migrations רצו בהצלחה על **Development**, וכל ה-Indexes קיימים בפועל.
- [ ] הרצה חוזרת של ה-Migrations לא משנה ולא שוברת דבר.
- [ ] Seed script רץ על Development.
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

## Milestone 3 — Client Details, Edit & Delete

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
  - ObjectId validation, ו-404 ללקוח שלא קיים.
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

## Milestone 4 — PDF Upload, Extraction & Manual Review Alerts

### שם ומטרה
המשתמש מעלה PDF של HBL. המערכת מחלצת ממנו את פרטי ה-Consignee ואת פרטי המשלוח, בודקת כפילות ושומרת לקוח עם הסטטוס הנכון. כשנדרש טיפול ידני, נשלחת למשתמש התראה במייל עם ה-PDF.

### מה יש לממש
- **הקמת שירותים חיצוניים לסביבת Development.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  - OpenAI API key לסביבת Development.
  - חשבון AWS, ובו Amazon SES ב-Region שנבחר:
    - אימות ה-identity של תיבת המייל הייעודית (`SES_FROM_ADDRESS`).
    - אימות כתובת המשתמש (`ADMIN_REVIEW_EMAIL`).
    - SES נשאר ב-Sandbox.
  - IAM user לפיתוח מקומי עם הרשאת `ses:SendRawEmail` בלבד.
- **Database Migration**, אם נדרש שינוי ב-schema או ב-Indexes. ה-Migration רץ על Development.
- **Backend:** `POST /api/v1/documents/process`, לפי ARCHITECTURE סעיפים 6.3, 7, 8, 9, 10 ו-12.2:
  - קובץ PDF יחיד עד 4 MB, עם ולידציה של MIME ו-magic bytes. הקובץ נשאר בזיכרון בלבד.
  - חילוץ טקסט עם PDF.js.
  - חילוץ מובנה עם OpenAI Structured Outputs, עם timeout של 60 שניות, לפי ה-Prompt rules בסעיף 8.4.
  - Normalization וכלל "TO ORDER".
  - כשל חילוץ מלא: לא נוצרת רשומה, ונשלחת התראה.
  - Duplicate Detection באמצעות `DuplicateDetectionService` מ-Milestone 3.
  - יצירת רשומה, כשהסטטוס מחושב ב-`ClientStatusService`.
  - כשהרשומה נשמרה עם `Failed`: **התראה אחת** עם כל השדות החסרים, המידע שחולץ וה-PDF.
  - `SesNotificationSender`: אין retry, ובכשל מוחזר `notificationSent: false`.
  - Log events ו-`processing_outcome`, לפי ARCHITECTURE סעיף 18. בלי תוכן המסמך ובלי Secrets.
- **Frontend:** מסך **Upload PDF**, לפי DESIGN סעיף 1.2:
  - Drag & Drop ו-**Choose PDF File**.
  - בדיקת סוג וגודל בצד הלקוח.
  - Processing indicator.
  - הודעות התוצאה לפי הטבלה ב-DESIGN.
  - **Try Again** בכשל טכני.
  - Route ההעלאה ב-Proxy מגדיר `maxDuration` מתאים.

### תוצר מצופה
- המשתמש מעלה HBL אמיתי, והלקוח מופיע במסך Clients עם הפרטים והסטטוס הנכונים.
- מקרה חריג מייצר התראה אחת שמגיעה לתיבת המשתמש, עם ה-PDF מצורף.
- העלאה חוזרת של אותו קובץ לא יוצרת כפילות.

### Definition of Done
- [ ] OpenAI ו-SES Development הוגדרו על ידי המשתמש, והחיבור אליהם עובד.
- [ ] Migrations, אם נוספו, רצו בהצלחה על **Development**.
- [ ] העלאת HBL תקין יוצרת לקוח עם כל 9 השדות שחולצו בצורה נכונה, עם `Success`, ומוצגת `Client added successfully.` נבדק על קובצי HBL לדוגמה שהמשתמש סיפק.
- [ ] שדה שלא מופיע במסמך נשמר כ-`null`. המערכת לא מנחשת ערכים.
- [ ] HBL שחסר בו שדה חובה אחד או יותר נשמר עם `Failed`, ו-Error Details מפרט את כולם. מתקבלת **התראה אחת** עם ה-PDF, ומוצגת הודעת Manual Review.
- [ ] Address או Phone חסרים לא מונעים `Success`.
- [ ] Consignee מסוג "TO ORDER" נשמר עם Company Name חסר.
- [ ] כפילות לפי כל אחד משלושת הכללים: אין רשומה חדשה, אין שינוי ברשומה הקיימת, ומוצגת הודעת כפילות.
- [ ] בלי Company Name ובלי Email נוצרת רשומה חדשה גם בהעלאה חוזרת.
- [ ] PDF ללא טקסט, כשל AI או timeout מדומה: לא נוצרת רשומה, ומתקבלת התראה עם סיבת הכשל וה-PDF.
- [ ] כשל מדומה בשליחת ההתראה: אין retry, ומוצגת ההודעה `Manual review required, but the notification email could not be sent...`
- [ ] קובץ שאינו PDF, או קובץ גדול מ-4 MB, נחסם גם ב-Frontend וגם ב-Backend, עם ההודעה המתאימה.
- [ ] ה-PDF לא נשמר בשום מקום: לא בדיסק ולא ב-Database.
- [ ] הלוגים מכילים את אירועי העיבוד ואת ה-outcome, ללא טקסט ה-PDF וללא Secrets.
- [ ] כל תרחישי ARCHITECTURE סעיף 24 מכוסים ב-tests, עם mocks ל-OpenAI ול-SES, ועוברים.
- [ ] מסך Upload PDF תואם ל-DESIGN.md.

---

## Milestone 5 — Production Deployment

### שם ומטרה
פריסת המערכת לסביבת Production מאובטחת, ועדכון סביבת Production לכל השינויים שבוצעו עד כה.

### מה יש לממש
- **הקמת שירותי Production.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  - **MongoDB Atlas Production**, שהוקם ב-Milestone 2: הרצת **כל ה-Database Migrations** על Production, **באישור מפורש של המשתמש**.
  - **SES:** אימות ה-identities לשימוש ב-Production. הם נשארים ב-Sandbox.
  - **OpenAI key** ל-Production.
  - **GitHub Actions + Amazon ECR:**
    - Dockerfile ל-Backend.
    - Workflow שבונה את ה-image ודוחף אותו ל-ECR.
    - AWS credentials מוגדרים כ-GitHub Secrets.
  - **AWS App Runner:**
    - deploy מ-ECR.
    - IAM instance role עם הרשאת `ses:SendRawEmail` בלבד.
    - Environment variables ו-Secrets.
    - Health check ל-`/health`.
  - **Vercel:** חיבור ה-Repository והגדרת `BACKEND_API_URL`, `BACKEND_API_KEY` ו-`SITE_PASSWORD` עם ערכי Production. כדאי לבדוק מול המשתמש איזו תוכנית Vercel נדרשת לשימוש מסחרי.
- **אבטחה לפי ARCHITECTURE סעיף 16:**
  - `SITE_PASSWORD` ו-`BACKEND_API_KEY` חזקים ושונים מאלה של Development.
  - HTTPS בלבד.
  - אין Secrets בקוד או ב-Repository.
- **Smoke test ב-Production:** העלאה של HBL אמיתי ובדיקת התהליך כולו.
- **README:** עדכון הוראות הפריסה, ותיעוד איך מריצים Migrations על Production.

### תוצר מצופה
המערכת זמינה ב-Production בכתובת HTTPS שמוגנת בסיסמה, מחוברת לשירותי Production בלבד, וכל זרימות ה-PRD עובדות בה מקצה לקצה.

### Definition of Done
- [ ] כל ה-Migrations רצו בהצלחה על **Production**, באישור המשתמש, וה-Indexes קיימים.
- [ ] GitHub Actions בונה את ה-image ודוחף אותו ל-ECR בהצלחה.
- [ ] ה-Frontend ב-Vercel וה-Backend ב-App Runner זמינים ב-HTTPS, ו-`/health` מחזיר 200.
- [ ] האתר דורש סיסמה. ה-Backend מחזיר 401 לבקשה ישירה בלי מפתח API.
- [ ] ה-Backend ב-Production מחובר רק לשירותי Production.
- [ ] Smoke test: העלאת HBL תקין יוצרת לקוח עם `Success`.
- [ ] Smoke test: מקרה Manual Review שולח התראה עם ה-PDF ל-`ADMIN_REVIEW_EMAIL`.
- [ ] Clients, Client Details, Edit ו-Delete עובדים ב-Production.
- [ ] Logs זמינים ב-CloudWatch, ללא תוכן PDF וללא Secrets.
- [ ] ה-README מעודכן עם הוראות הפריסה וה-Migration.

---

## פריטים פתוחים (TBD) שמשפיעים על הפיתוח

| פריט | השפעה | Milestone |
|---|---|---|
| קובצי HBL לדוגמה | נדרשים לבדיקת החילוץ | 4 |
| כתובת תיבת המייל הייעודית | נדרשת לאימות ב-SES | 4 |
| כתובת המייל של המשתמש להתראות | `ADMIN_REVIEW_EMAIL` | 4 |
| זמינות מודל ה-AI שנבחר | לבדוק בתחילת Milestone 4 | 4 |
| מדיניות שמירת הנתונים של OpenAI | לבדוק לפני שימוש עם נתונים אמיתיים | 4 |
| תוכנית Vercel לשימוש מסחרי | עלות | 5 |
| בדיקה משפטית למייל שיווקי | לא משפיעה על ה-MVP. תנאי לגרסה עתידית | — |
| מדיניות גיבוי | לא משפיעה על ה-MVP | — |
