# MILESTONES — Ordan Cargo Future Clients

מסמך זה מחלק את פיתוח ה-MVP לאבני דרך (Milestones), על בסיס [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md) ו-[DESIGN.md](DESIGN.md).

---

## Development Execution Rules — הנחיות מחייבות ל-AI המבצע את הפיתוח

1. יש לפתח את ה-Milestones **לפי הסדר** שמוגדר במסמך זה.
2. בסיום כל Milestone יש **לעצור את הפיתוח** ולהציג למשתמש:
   - את התוצר שהושלם: מה עובד, איך מריצים אותו ואיך בודקים אותו.
   - את תוצאות הבדיקה מול **כל** סעיף ב-Definition of Done. לכל סעיף יש לציין עבר/נכשל ואיך זה נבדק.
3. **אין להתחיל** את ה-Milestone הבא ללא אישור מפורש של המשתמש.
4. פעולות שדורשות חשבון, הרשאה או תשלום אצל ספק חיצוני (MongoDB Atlas, AWS, OpenAI, Vercel) מבצע **המשתמש**. ה-AI מנחה אותו צעד אחר צעד וממתין לאישור שהשלב בוצע. ה-AI לא מזין credentials בעצמו.
5. Secrets לא נכנסים ל-Git. ההגדרות נשמרות בקובצי `.env` מקומיים (ב-`.gitignore`), ולצדם קובץ `.env.example` ללא ערכים.
6. כל שינוי במבנה מסד הנתונים מתבצע באמצעות **Database Migration** בקוד, ונבדק מול סביבת **Development בלבד**. סביבת Production מתעדכנת רק ב-Milestone 6.
7. אין להוסיף פיצ'רים, מסכים או יכולות שלא מופיעים ב-PRD.

---

## מקור האמת

שלושת מסמכי הפרויקט מתואמים זה עם זה. אם תתגלה סתירה במהלך הפיתוח, **ה-PRD הוא מקור האמת**. במקרה כזה יש לעצור ולעדכן את המשתמש לפני שממשיכים.

---

## סקירת ה-Milestones

| # | Milestone | סוג | תלוי ב- |
|---|---|---|---|
| 1 | Project Foundation & App Shell | טכני (הקמה) | — |
| 2 | Clients List | Vertical Slice | 1 |
| 3 | Client Details, Edit & Delete | Vertical Slice | 2 |
| 4 | PDF Upload & Automatic Client Creation | Vertical Slice | 3 |
| 5 | Email Automation & Manual Review | Vertical Slice | 4 |
| 6 | Production Deployment | טכני (פריסה) | 5 |

---

## Milestone 1 — Project Foundation & App Shell

### שם ומטרה
הקמת שלד הפרויקט: Frontend ו-Backend רצים מקומית ומחוברים זה לזה, עם מעטפת ממשק (App Shell) שמבוססת על ה-Design System. זהו תנאי מקדים לכל ה-Slices הבאים.

### מה יש לממש
- **Repository** עם שתי אפליקציות: `frontend` (Next.js + React + TypeScript, App Router) ו-`backend` (NestJS + Node.js 24 LTS + TypeScript).
- **Backend:**
  - מבנה ה-Modules הריק לפי ARCHITECTURE סעיף 6.2.
  - Config module שקורא את משתני הסביבה מ-ARCHITECTURE סעיף 22.
  - Structured JSON logging עם Request ID.
  - Global exception filter שלא חושף raw errors.
  - `GET /health`.
  - Prefix `/api/v1`.
  - CORS לפי `FRONTEND_ORIGIN`.
  - `Dockerfile`.
- **Frontend:**
  - Design tokens מ-DESIGN סעיף 2: צבעים, הגופן Inter, Typography, Spacing, Radius ו-Shadow.
  - רכיבי בסיס: Button (Primary / Secondary / Destructive), Input, Select, Status Badge, Card, Alert, Modal.
  - Top Navigation עם שם המערכת **Ordan Cargo Future Clients** ופריטי הניווט **Clients** ו-**Upload PDF**.
  - Routes: `/` מפנה ל-`/clients`. בנוסף `/clients`, `/clients/[id]` ו-`/upload`, עם כותרות בלבד בשלב זה.
  - API client שמשתמש ב-`NEXT_PUBLIC_API_BASE_URL`.
- **כלי פיתוח:** Lint, Formatter ו-Test runner לשתי האפליקציות, `.env.example`, ו-README עם הוראות הרצה מקומית.

### תוצר מצופה
המשתמש מריץ את שתי האפליקציות מקומית, רואה את מעטפת הממשק ומנווט בין Clients ל-Upload PDF. ה-Backend מחזיר תשובה תקינה ב-`/health`.

### Definition of Done
- [ ] `frontend` ו-`backend` עולים מקומית לפי ה-README, ללא שגיאות.
- [ ] `GET /health` מחזיר 200.
- [ ] גלישה ל-`/` מפנה ל-`/clients`.
- [ ] Top Navigation מוצג בכל המסכים, והניווט בין Clients ל-Upload PDF עובד.
- [ ] הצבעים, הגופן והרכיבים תואמים ל-DESIGN.md.
- [ ] Lint ו-Tests רצים ועוברים בשתי האפליקציות.
- [ ] Docker image של ה-Backend נבנה בהצלחה ומחזיר 200 ב-`/health` כשהוא רץ מקומית.
- [ ] אין Secrets ב-Repository, ו-`.env.example` מתעד את כל המשתנים.

---

## Milestone 2 — Clients List

### שם ומטרה
המשתמש צופה ברשימת הלקוחות במסך הבית, ומחפש, מסנן, ממיין ומדפדף בה. זהו ה-Milestone הראשון שמשתמש במסד הנתונים, ולכן הוא כולל גם את הקמת סביבות ה-Database.

### מה יש לממש
- **הקמת סביבות MongoDB Atlas.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  1. יצירת חשבון ו-Project ב-MongoDB Atlas.
  2. יצירת שתי סביבות נפרדות, **Development** ו-**Production**: Cluster נפרד לכל אחת, או לפחות Database נפרד, לפי ARCHITECTURE סעיף 23.
  3. יצירת Database User נפרד לכל סביבה.
  4. הגדרת Network Access.
  5. העתקת ה-Connection String של Development לקובץ `.env` מקומי.
  6. שמירת פרטי Production בצד לשימוש ב-Milestone 6.
- **מנגנון Database Migrations:**
  - Migration scripts בקוד, מנוהלים בגרסאות, שמריצים בפקודה אחת על הסביבה שמוגדרת ב-`MONGODB_URI`.
  - Migration ראשון: Collection בשם `clients` וכל ה-Indexes מ-ARCHITECTURE סעיף 11.4.
  - Unique partial index על `companyNameNormalized + emailNormalized`, לפי סעיף 11.5.
- **Client schema:** השדות מ-ARCHITECTURE סעיף 11.2, כולל פרטי המשלוח.
- **Backend:** `GET /api/v1/clients` עם:
  - `search` על Company Name, Email ו-Phone.
  - `processingStatus` ו-`emailStatus` כ-enums.
  - `sortBy` מ-allowlist ו-`sortOrder`.
  - `page` ו-`limit`, עם ברירת מחדל של 25 רשומות ומיון לפי `dateAdded desc`.
  - Response לפי ARCHITECTURE סעיף 12.1, ללא count.
- **Frontend:** מסך **Clients** לפי DESIGN סעיף 1.1:
  - כותרת וכפתור **Upload PDF**.
  - Search ו-Filters ל-Processing Status ול-Email Status.
  - מיון, כולל לפי Date Added.
  - טבלה עם 6 העמודות מה-PRD, Status Badges עם טקסט, ו-`NOT Available` לערכים חסרים.
  - פעולת **View** ולחיצה על שורה, שתיהן מובילות ל-`/clients/[id]`.
  - Pagination ו-**Refresh**.
  - מצב ריק ומצב טעינה.
- **Seed script לסביבת Development בלבד.** הסקריפט יוצר רשומות בדיקה שמכסות את כל הסטטוסים ואת השדות החסרים. הוא נחסם מלרוץ מול Production.

### תוצר מצופה
מסך Clients עובד מקצה לקצה מול MongoDB Development: רשומות הבדיקה מוצגות, וחיפוש, סינון, מיון ו-Pagination פועלים.

### Definition of Done
- [ ] שתי סביבות Atlas (Development ו-Production) קיימות. המשתמש אישר את הקמתן, וה-Backend המקומי מחובר ל-Development בלבד.
- [ ] ה-Migrations רצו בהצלחה על **Development**, וכל ה-Indexes קיימים בפועל (נבדק ב-Atlas או בסקריפט).
- [ ] הרצה חוזרת של ה-Migrations לא משנה ולא שוברת דבר.
- [ ] Seed script רץ על Development, ונחסם כש-`MONGODB_URI` מצביע על Production.
- [ ] החיפוש לפי Company Name, Email ו-Phone מחזיר את התוצאות הנכונות.
- [ ] כל אחד מהסינונים לפי Processing Status ו-Email Status עובד, גם בשילוב ביניהם.
- [ ] המיון לפי Date Added עובד, וברירת המחדל היא החדשים ראשונים.
- [ ] Pagination של 25 רשומות בעמוד, עם מעבר עמודים תקין.
- [ ] Refresh טוען את הנתונים מחדש.
- [ ] ערכים חסרים מוצגים כ-`NOT Available`, וה-Database שומר אותם כ-`null`.
- [ ] פרמטרים לא חוקיים (sortBy שלא ב-allowlist, status לא קיים) מחזירים 400, לא 500.
- [ ] Unit/Integration tests ל-API של הרשימה עוברים.
- [ ] המסך תואם ל-DESIGN.md.

---

## Milestone 3 — Client Details, Edit & Delete

### שם ומטרה
המשתמש צופה בכל פרטי הלקוח, עורך את פרטי הקשר שלו ומוחק אותו, כולל עדכון הסטטוסים שנגזר מעריכה ידנית.

### מה יש לממש
- **Backend:**
  - `GET /api/v1/clients/:id`, עם ObjectId validation ו-404 ללקוח שלא קיים.
  - `PATCH /api/v1/clients/:id`:
    - השדות הניתנים לעריכה: `companyName`, `address`, `phone`, `email` בלבד. פרטי המשלוח לקריאה בלבד.
    - הערכים נשמרים כפי שהוזנו, ללא ולידציה עסקית.
    - השדות המנורמלים מתעדכנים.
    - **גזירת סטטוסים** לפי PRD 4.5 ו-ARCHITECTURE 10.6:
      - השלמת Company Name ללקוח עם `Failed` משנה את Processing Status ל-`Success`.
      - הוספת Email ללקוח עם `Missing Email` משנה את Email Status ל-`Email Added Manually`.
      - `Sent` לא נוצר לעולם מעריכה.
    - עריכה **לא** שולחת מייל.
  - `DELETE /api/v1/clients/:id`: Hard delete.
- **Frontend:**
  - מסך **Client Details** לפי DESIGN סעיף 1.3:
    - **Back to Clients**.
    - השדות בסדר שמוגדר ב-PRD 4.2, כולל Origin Port, Origin Country, Destination Port, Incoterms ו-Shipment Type.
    - Status Badges.
    - **Error Details** רק כשיש ערך.
    - `NOT Available` לערכים חסרים.
  - מצב עריכה: **Edit**, ואחריו **Save** ו-**Cancel**. Cancel מחזיר את הערכים המקוריים.
  - Delete Modal לפי DESIGN סעיף 1.4: הכותרת **Delete Client**, הטקסט `Are you sure you want to delete this client?`, הבהרה שהפעולה אינה הפיכה, והכפתורים **Cancel**, **Delete** (אדום) ו-Close. אחרי המחיקה המשתמש חוזר ל-Clients.

### תוצר מצופה
המשתמש פותח לקוח מהרשימה, רואה את כל פרטיו, עורך ושומר אותם, ורואה את הסטטוסים מתעדכנים לפי הכללים. הוא יכול גם למחוק לקוח אחרי אישור.

### Definition of Done
- [ ] Client Details מציג את כל השדות בסדר שמוגדר ב-PRD 4.2, ו-Error Details מוצג רק כשיש ערך.
- [ ] Edit, Save ו-Cancel עובדים, והערכים נשמרים בדיוק כפי שהוזנו.
- [ ] פרטי המשלוח אינם ניתנים לעריכה, לא ב-UI ולא ב-API.
- [ ] השלמת Company Name ללקוח `Failed` משנה את Processing Status ל-`Success` (נבדק על רשומת Seed).
- [ ] הוספת Email ללקוח `Missing Email` משנה את Email Status ל-`Email Added Manually` (נבדק על רשומת Seed).
- [ ] עריכה לא משנה סטטוס ל-`Sent` ולא מפעילה שליחת מייל (נבדק ב-Unit test).
- [ ] Delete דורש אישור ב-Modal. Cancel ו-Close לא משנים דבר. Delete מוחק לצמיתות וחוזר ל-Clients.
- [ ] `:id` לא תקין מחזיר 400, ולקוח שלא קיים מחזיר 404.
- [ ] Unit tests לכללי גזירת הסטטוסים ו-Integration tests ל-GET, PATCH ו-DELETE עוברים.
- [ ] המסך וה-Modal תואמים ל-DESIGN.md.

---

## Milestone 4 — PDF Upload & Automatic Client Creation

### שם ומטרה
המשתמש מעלה PDF של HBL, והמערכת מחלצת ממנו את פרטי ה-Consignee ואת פרטי המשלוח, בודקת כפילות ושומרת לקוח חדש עם הסטטוסים הנכונים. שליחת המיילים בפועל מתווספת ב-Milestone 5.

### מה יש לממש
- **הקמת שירותים חיצוניים לסביבת Development.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  - S3 Bucket פרטי לסביבת Development, לפי ARCHITECTURE סעיף 14: Block Public Access, Encryption at rest ו-Lifecycle rule כ-safety net.
  - IAM credentials לפיתוח מקומי, עם הרשאות לאותו Bucket בלבד.
  - OpenAI API key לסביבת Development.
- **Database Migration:** עדכון ה-schema או ה-Indexes אם נדרש מעבר למה שנוצר ב-Milestone 2. ה-Migration רץ על Development.
- **Backend: `POST /api/v1/documents/process`.**
  - קובץ PDF יחיד, עם ולידציה בצד השרת: MIME, format ו-technical size limit מתוך configuration.
  - שמירה זמנית ב-S3 תחת `processing/{uuid}.pdf`, ומחיקה ב-`finally`.
  - חילוץ טקסט עם PDF.js.
  - חילוץ מובנה עם OpenAI Responses API ו-Structured Outputs.
    - Schema: `companyName`, `address`, `phone`, `email`, `originPort`, `originCountry`, `destinationPort`, `incoterms`, `shipmentType` (`FCL | LCL | null`).
    - Prompt rules לפי ARCHITECTURE סעיף 8.4: חילוץ Consignee בלבד ו-No guessing.
  - ולידציה ו-normalization של התוצאה לפי ARCHITECTURE סעיף 8.5.
  - **Business Rules** כקוד deterministic ב-`ProcessingService`:
    - Company Name חסר גורם ל-`Failed` ול-`errorDetails`.
    - Duplicate Detection לפי PRD 4.6. במקרה של כפילות המערכת מדלגת בשקט, לא משנה את הרשומה הקיימת, ומטפלת ב-duplicate-key conflict כ-duplicate ולא כ-500.
    - יצירת רשומה עם כל השדות, כולל פרטי המשלוח ו-`dateAdded`.
  - **Email Decision Engine** לפי PRD 4.7–4.8, שקובע את Email Status:
    - Email חסר: `Missing Email`.
    - פרט משלוח חסר: `Requires Manual Review`, עם `errorDetails` שמפרט את השדות החסרים.
    - כל התנאים מתקיימים: הרשומה מוכנה לשליחה.
    - השליחה עצמה עוברת דרך interface בשם `EmailSender`, לפי ARCHITECTURE סעיף 27. ב-Milestone זה מוזרק לו **Stub לפיתוח בלבד** שרושם ללוג את המייל שהיה נשלח. ה-Stub נחסם בהגדרת Production.
  - כשל PDF.js או כשל OpenAI (API או schema) עובר לנתיב Manual Review לפי ARCHITECTURE סעיפים 7.4 ו-8.5, עם שמירת המידע הזמין ו-`errorDetails`.
  - Response לפי ARCHITECTURE סעיף 12.2: `created`, `duplicate` או `manual_review`.
  - Log events מ-ARCHITECTURE סעיף 20 ו-processing outcome לפי סעיף 21, ללא תוכן המסמך.
- **Frontend:** מסך **Upload PDF** לפי DESIGN סעיף 1.2:
  - אזור Drag & Drop, הטקסט **Drag and drop PDF file here** והכפתור **Choose PDF File**.
  - חסימת קובץ שאינו PDF עם ההודעה `Only PDF files are supported.`
  - Processing indicator.
  - הודעת הצלחה בחלק העליון, ללא שם הקובץ. אזור ההעלאה נשאר זמין.
  - בכשל טכני: הודעת Error וכפתור **Try Again**.

### תוצר מצופה
המשתמש מעלה HBL אמיתי, והלקוח מופיע במסך Clients עם פרטי Consignee ופרטי משלוח נכונים ב-Client Details, ועם Processing Status ו-Email Status שנקבעו לפי הכללים. העלאה חוזרת של אותו קובץ לא יוצרת רשומה כפולה. קובץ ה-PDF לא נשאר ב-S3.

### Definition of Done
- [ ] S3 Development ו-OpenAI key הוגדרו על ידי המשתמש, והחיבור אליהם עובד.
- [ ] Migrations, אם נוספו, רצו בהצלחה על **Development**.
- [ ] העלאת HBL תקין יוצרת לקוח עם כל 9 השדות שחולצו בצורה נכונה. נבדק על קובצי HBL לדוגמה שהמשתמש סיפק.
- [ ] שדה שלא מופיע במסמך נשמר כ-`null`. המערכת לא מנחשת ערכים.
- [ ] העלאה חוזרת עם Company Name ו-Email זהים מדלגת בשקט: אין רשומה חדשה, ו-`dateAdded` ופרטי המשלוח הקיימים לא משתנים.
- [ ] Company Name זהה עם Email שונה יוצר רשומה חדשה.
- [ ] בלי Email, הכפילות נקבעת לפי Company Name בלבד.
- [ ] Company Name חסר נותן `Processing Status = Failed`, והמידע שחולץ נשמר.
- [ ] Email חסר נותן `Email Status = Missing Email`.
- [ ] פרט משלוח חסר נותן `Email Status = Requires Manual Review`, ו-`errorDetails` מפרט אילו שדות חסרים.
- [ ] Address או Phone חסרים לא מונעים `Success`.
- [ ] כשל PDF.js או OpenAI לא מחזיר 500 למשתמש ומטופל לפי הכללים.
- [ ] קובץ שאינו PDF נחסם גם ב-Frontend וגם ב-Backend.
- [ ] קובץ ה-PDF נמחק מ-S3 בסיום העיבוד, בכל מסלול (נבדק ב-Bucket).
- [ ] הלוגים מכילים את אירועי העיבוד ואת ה-outcome, ללא טקסט ה-PDF וללא Secrets.
- [ ] Unit tests עם mocks ל-OpenAI, S3 ו-EmailSender עוברים לכל תרחישי ARCHITECTURE סעיף 28 שרלוונטיים לשלב זה.
- [ ] מסך Upload PDF תואם ל-DESIGN.md.

---

## Milestone 5 — Email Automation & Manual Review

### שם ומטרה
המערכת שולחת בפועל את המייל השיווקי ללקוח, ושולחת למשתמש התראות Manual Review עם ה-PDF המקורי. זה משלים את התהליך האוטומטי מקצה לקצה.

### מה יש לממש
- **הקמת Amazon SES לסביבת Development.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  - אימות ה-identity של תיבת המייל הייעודית.
  - אימות כתובת המשתמש שמקבלת את ההתראות (`ADMIN_REVIEW_EMAIL`).
  - ב-SES Sandbox, אימות כתובות הבדיקה שאליהן יישלח המייל השיווקי.
- **`SesEmailSender`:** מימוש של `EmailSender` שמחליף את ה-Stub מ-Milestone 4.
- **Marketing Email:**
  - בעברית, לפי תבנית קבועה (HTML עם plain-text fallback) ושדות משתנים מתוך ה-HBL, כולל פרטי המשלוח.
  - כל עוד הנוסח הסופי הוא **TBD**, משתמשים בתבנית placeholder שמסומנת בבירור. התבנית נשמרת כקובץ בקוד, כך שאפשר להחליף אותה בלי לשנות לוגיקה.
- **Manual Review Email:**
  - באנגלית, נשלח ל-`ADMIN_REVIEW_EMAIL`, עם ה-PDF המקורי מצורף, לפי PRD 4.10.
  - מכיל את סיבת הבדיקה ואת המידע שחולץ.
  - כשחסרים פרטי משלוח, מכיל גם את רשימת השדות החסרים ואת נוסח המייל השיווקי שתוכנן.
- **חיווט לכל המסלולים:**
  - Company Name חסר.
  - Email חסר.
  - פרט משלוח חסר.
  - כשל PDF.js או AI.
  - כשל SES: Email Status הופך ל-`Failed`, נשלחת התראה, ואין retry עסקי.
  - שליחה מוצלחת: Email Status הופך ל-`Sent`, רק אחרי אישור מ-SES.
  - מחיקת ה-PDF מ-S3 מתבצעת רק אחרי ניסיון שליחת ההתראה.

### תוצר מצופה
התהליך המלא מה-PRD עובד בסביבת Development:
- HBL תקין מגיע ללקוח ממייל שיווקי בעברית, ו-Email Status הוא `Sent`.
- כל מקרה חריג מגיע לתיבת המשתמש כמייל באנגלית עם ה-PDF מצורף.

### Definition of Done
- [ ] SES Development הוגדר על ידי המשתמש, וה-identities מאומתים.
- [ ] HBL עם כל הנתונים גורם לשליחת מייל שיווקי בעברית שמתקבל בפועל, והסטטוסים הם `Sent` ו-`Success`.
- [ ] Email חסר: לא נשלח מייל שיווקי, ומתקבלת התראה באנגלית עם ה-PDF.
- [ ] פרט משלוח חסר: לא נשלח מייל שיווקי, ומתקבלת התראה עם ה-PDF, רשימת השדות החסרים ונוסח המייל המתוכנן.
- [ ] Company Name חסר: מתקבלת התראה עם ה-PDF.
- [ ] כשל SES (מדומה): Email Status הופך ל-`Failed`, אין ניסיון שליחה חוזר, ומתקבלת התראה עם סיבת הכשל וה-PDF, ככל שאפשר.
- [ ] `Sent` לא מוצג אף פעם בלי שליחה מוצלחת בפועל.
- [ ] כפילות ועריכה ידנית לא שולחות אף מייל.
- [ ] ה-PDF נמחק מ-S3 אחרי שליחת ההתראה, בכל המסלולים.
- [ ] `errorDetails` קצר וברור למשתמש, ללא stack traces או Secrets.
- [ ] כל תרחישי ARCHITECTURE סעיף 28 מכוסים ב-tests ועוברים.
- [ ] תבנית המייל השיווקי מסומנת כ-placeholder עד שיתקבל הנוסח הסופי.

---

## Milestone 6 — Production Deployment

### שם ומטרה
פריסת המערכת לסביבת Production מאובטחת, ועדכון סביבת Production לכל השינויים שבוצעו עד כה.

### מה יש לממש
- **הקמת שירותי Production.** המשתמש מבצע את הצעדים בהדרכה צעד אחר צעד:
  - **MongoDB Atlas Production**, שהוקם ב-Milestone 2: הרצת **כל ה-Database Migrations** על Production.
  - **S3 Bucket ל-Production**, עם אותן הגדרות אבטחה ו-Lifecycle כמו ב-Development.
  - **SES Production:** אימות ה-domain או ה-identity של התיבה הייעודית, ובקשת יציאה מ-Sandbox.
  - **OpenAI key** ל-Production.
  - **AWS App Runner:** ECR, Docker image, IAM instance role עם הרשאות מינימליות ל-S3 ול-SES, Environment variables ו-Secrets, ו-Health check ל-`/health`.
  - **Vercel:** חיבור ה-Repository, והגדרת `NEXT_PUBLIC_API_BASE_URL` לכתובת ה-Backend ב-Production.
- **אבטחה לפי ARCHITECTURE סעיפים 17–18:**
  - CORS allowlist לכתובת ה-Frontend ב-Production בלבד.
  - Rate limiting.
  - הגבלת גישה ברמת hosting או network, ככל שהפלטפורמה מאפשרת.
  - HTTPS בלבד.
  - אין Secrets ב-`NEXT_PUBLIC_*`.
  - כל ההגדרות נקראות מקונפיגורציה, וה-Stub של `EmailSender` חסום.
- **Smoke test ב-Production:** העלאה של HBL אמיתי ובדיקת התהליך כולו.
- **README:** עדכון הוראות הפריסה, ותיעוד איך מריצים Migrations על Production.

### תוצר מצופה
המערכת זמינה ב-Production בכתובת HTTPS, מחוברת לשירותי Production בלבד, וכל זרימות ה-PRD עובדות בה מקצה לקצה.

### Definition of Done
- [ ] כל ה-Migrations רצו בהצלחה על **Production**, וה-Indexes קיימים.
- [ ] ה-Frontend ב-Vercel וה-Backend ב-App Runner זמינים ב-HTTPS, ו-`/health` מחזיר 200.
- [ ] ה-Backend ב-Production מחובר רק לשירותי Production: Atlas, S3, SES ו-OpenAI.
- [ ] Smoke test: העלאת HBL תקין יוצרת לקוח, ומייל שיווקי נשלח ומתקבל.
- [ ] Smoke test: מקרה Manual Review שולח התראה עם ה-PDF ל-`ADMIN_REVIEW_EMAIL`.
- [ ] Clients, Client Details, Edit ו-Delete עובדים ב-Production.
- [ ] CORS חוסם origins אחרים, ואין Secrets בקוד ה-Frontend או ב-Repository.
- [ ] ה-S3 Bucket ב-Production פרטי ומוצפן, עם Lifecycle rule, ואין בו קבצים שנשארו אחרי העיבוד.
- [ ] Logs זמינים ב-CloudWatch, ללא תוכן PDF וללא Secrets.
- [ ] ה-README מעודכן עם הוראות הפריסה וה-Migration.

---

## פריטים פתוחים (TBD) שמשפיעים על הפיתוח

אלה פריטים מה-PRD שאינם חוסמים את ה-Milestones, אבל צריך להשלים אותם לפני השימוש האמיתי:

| פריט | השפעה | Milestone |
|---|---|---|
| נוסח סופי של המייל השיווקי בעברית | עד שיתקבל, משתמשים בתבנית placeholder | 5 (החלפה בכל שלב) |
| כתובת תיבת המייל הייעודית | נדרשת לאימות ב-SES | 5 (Development), 6 (Production) |
| כתובת המייל של המשתמש להתראות | `ADMIN_REVIEW_EMAIL` | 5 |
| קובצי HBL לדוגמה | נדרשים לבדיקת החילוץ | 4 |
