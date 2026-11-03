# ARCHITECTURE — Ordan Cargo Future Clients

## 1. מטרת המסמך

מסמך זה מגדיר את הארכיטקטורה הטכנית של **Ordan Cargo Future Clients** בהתאם ל־PRD ול־Technology Stack שנבחר.

המטרה היא לתרגם את דרישות המוצר לתכנון טכני ברור ומעשי, כך שמפתח או מערכת AI יוכלו להשתמש במסמך כמקור לבניית ה־MVP.

המסמך מתמקד בארכיטקטורה, רכיבים, מודל נתונים, APIs, אינטגרציות, אבטחה, תשתיות וזרימות מערכת. הוא אינו כולל Milestones, משימות, שלבי פיתוח או לוחות זמנים.

---

## 2. עקרונות ארכיטקטוניים

הארכיטקטורה תתבסס על העקרונות הבאים:

1. **פשטות** — להימנע מ־Microservices, Message Brokers ותשתיות שאינן נדרשות ל־MVP.
2. **אמינות** — הלוגיקה העסקית הקריטית תישאר ב־Backend ולא תועבר למודל AI.
3. **AI מוגבל לתפקיד חילוץ מידע** — המודל יחזיר נתונים מובנים בלבד ולא יקבע לבדו אם לשלוח מייל, אם לקוח הוא כפילות או איזה Status לשמור.
4. **No guessing** — מידע שלא מופיע במסמך יוחזר כחסר; אין להמציא ערכים.
5. **Temporary document handling** — קובצי PDF אינם נכס קבוע של המערכת. הם יישמרו זמנית בלבד לצורך העיבוד והטיפול בכשל.
6. **Managed services** — שימוש בשירותים מנוהלים עבור Database, Email, Object Storage ו־Hosting.
7. **Single backend application** — ה־MVP יהיה Modular Monolith ולא Microservices.
8. **TypeScript end-to-end** — Frontend ו־Backend ישתמשו ב־TypeScript.
9. **Server-side business rules** — כל בדיקות הכפילויות, הסטטוסים, ההחלטה על שליחת מייל ומחיקת קבצים יבוצעו בצד השרת.
10. **Idempotent processing where practical** — פעולות קריטיות יתוכננו כך שלא ייצרו שליחה כפולה או רשומה כפולה במקרה של בקשה חוזרת.

---

## 3. Technology Stack

| שכבה | טכנולוגיה |
|---|---|
| Frontend | Next.js + React + TypeScript |
| Backend | Node.js 24 LTS + NestJS + TypeScript |
| Database | MongoDB Atlas |
| PDF Text Extraction | Mozilla PDF.js |
| AI Extraction | OpenAI Responses API + GPT-5.4 mini + Structured Outputs |
| Email | Amazon SES |
| Temporary File Storage | Amazon S3 |
| Frontend Hosting | Vercel |
| Backend Hosting | AWS App Runner |
| Backend Packaging | Docker |
| API Style | REST + JSON |
| Authentication | ללא Login ב־MVP; Amazon Cognito מיועד לשלב עתידי |
| Cloud Provider for Backend Services | AWS |

---

## 4. מבנה המערכת ברמה גבוהה

```text
┌─────────────────────────────────────┐
│           Desktop Browser           │
│                                     │
│   Next.js / React / TypeScript      │
│   - Clients                         │
│   - Upload PDF                      │
│   - Client Details                  │
└─────────────────┬───────────────────┘
                  │ HTTPS / REST
                  ▼
┌─────────────────────────────────────┐
│       NestJS Backend / App Runner   │
│                                     │
│  Clients Module                     │
│  Documents Module                   │
│  Processing Module                  │
│  AI Extraction Module              │
│  Duplicate Detection Service       │
│  Email Module                       │
│  Storage Module                     │
└───────┬──────────┬──────────┬───────┘
        │          │          │
        ▼          ▼          ▼
 MongoDB Atlas   OpenAI     AWS SES
        │
        │
        ▼
     Client Data

Temporary PDF flow:
Browser → Backend → S3 → PDF.js → OpenAI
                       │
                       ├─ Success → delete object
                       │
                       └─ Manual/Error → attach/send → delete object
```

---

## 5. Frontend Architecture

### 5.1 אחריות ה־Frontend

ה־Frontend אחראי על:

- הצגת מסכי המערכת.
- ניווט בין Clients, Upload PDF ו־Client Details.
- העלאת PDF.
- הצגת Processing state.
- הצגת טבלת הלקוחות.
- Search, Filters, Sorting ו־Pagination.
- הצגת פרטי לקוח ושגיאות.
- עריכת לקוח.
- מחיקת לקוח לאחר Confirmation.
- Refresh ידני של רשימת הלקוחות.

ה־Frontend **לא** יבצע:

- חילוץ מידע מה־PDF.
- קריאה ישירה ל־OpenAI.
- גישה ישירה ל־MongoDB.
- שליחת SES.
- Duplicate Detection.
- החלטה אם לשלוח מייל.
- חישוב Processing Status או Email Status.

כל אלה הם באחריות ה־Backend.

### 5.2 Routes

מומלץ להשתמש ב־Next.js App Router.

```text
/
└── redirects to /clients

/clients
/clients/[id]
/upload
```

`/clients` הוא מסך הבית.

### 5.3 Clients Page

המסך יקרא:

```http
GET /api/clients
```

Query parameters אפשריים:

```text
search
processingStatus
emailStatus
sortBy
sortOrder
page
limit
```

ברירת מחדל:

```text
page = 1
limit = 25
sortBy = dateAdded
sortOrder = desc
```

### 5.4 Client Details

```http
GET /api/clients/:id
```

המסך יציג:

1. Company Name
2. Address
3. Phone
4. Email
5. Origin Port
6. Origin Country
7. Destination Port
8. Incoterms
9. Shipment Type (FCL/LCL)
10. Date Added
11. Processing Status
12. Email Status
13. Error Details — רק כאשר קיים מידע כזה

פרטי המשלוח (5–9) מוצגים לקריאה בלבד.

### 5.5 Edit

```http
PATCH /api/clients/:id
```

ה־Frontend שולח רק את השדות שנערכו.

בהתאם ל־PRD, עריכה ידנית אינה מפעילה מייל שיווקי.

אין לבצע validation עסקי של הערכים שהמשתמש הקליד מעבר לדרישות טכניות בסיסיות של JSON/API.

### 5.6 Delete

```http
DELETE /api/clients/:id
```

לפני הקריאה יוצג Confirmation dialog.

המחיקה היא Hard Delete ואין Undo.

### 5.7 Upload PDF

המסך יקבל PDF אחד בכל פעולה באמצעות:

- Drag & Drop
- File Picker

ה־Frontend יבצע בדיקת MIME/extension בסיסית לצורך UX, אך ה־Backend יבצע בדיקה עצמאית ואינו סומך על ה־Client.

```http
POST /api/documents/process
Content-Type: multipart/form-data
```

ה־UI יציג Processing indicator לאורך הבקשה.

לאחר שה־Backend מסיים את ניסיון העיבוד, המסך נשאר ב־Upload ומציג הודעת completion/processing success בהתאם ל־PRD. פרטי שגיאות עסקיות נמצאים ב־Client Details ובמייל ההתראה.

בכשל טכני של העלאה/תקשורת יוצגו Error ו־Try Again.

---

## 6. Backend Architecture

### 6.1 סגנון

ה־Backend יהיה **Modular Monolith** אחד ב־NestJS.

אין הצדקה ב־MVP ל־Microservices.

היישום ירוץ כ־Docker container ב־AWS App Runner.

### 6.2 Modules

מבנה מומלץ:

```text
src/
├── clients/
│   ├── clients.controller.ts
│   ├── clients.service.ts
│   ├── clients.repository.ts
│   ├── schemas/
│   └── dto/
│
├── documents/
│   ├── documents.controller.ts
│   ├── documents.service.ts
│   └── validators/
│
├── processing/
│   ├── processing.service.ts
│   ├── duplicate-detection.service.ts
│   └── processing-rules.service.ts
│
├── extraction/
│   ├── pdf-text.service.ts
│   ├── ai-extraction.service.ts
│   ├── extraction.schema.ts
│   └── extraction-validator.service.ts
│
├── email/
│   ├── email.service.ts
│   ├── marketing-email.template.ts
│   └── manual-review.template.ts
│
├── storage/
│   └── s3.service.ts
│
├── common/
│   ├── filters/
│   ├── interceptors/
│   ├── logging/
│   └── config/
│
└── app.module.ts
```

### 6.3 Processing Orchestrator

`ProcessingService` יהיה הרכיב המרכזי שמנהל את workflow.

הוא אינו מבצע בעצמו PDF parsing או email delivery אלא מתאם בין השירותים.

Pseudo-flow:

```text
receive PDF
↓
validate PDF type
↓
store temporary object in S3
↓
extract text using PDF.js
↓
extract structured fields using OpenAI
↓
normalize fields for comparison
↓
check required Company Name
↓
check duplicate
↓
if duplicate:
    delete temporary PDF
    stop
↓
create client record
↓
evaluate marketing-email requirements
↓
send marketing email OR manual-review email
↓
update statuses/error details
↓
delete temporary PDF
↓
return processing result
```

---

## 7. PDF Processing

### 7.1 Supported Input

ה־MVP תומך ב:

- House Bill of Lading (HBL) בלבד.
- PDF בלבד.
- PDF דיגיטלי עם text layer.
- Consignee אחד בכל מסמך.
- קובץ אחד בכל upload.

לא נתמך:

- OCR.
- Scanned PDFs.
- Multiple Consignees.
- Multiple-file upload.

### 7.2 Temporary Storage

לאחר קבלת הקובץ, ה־Backend ישמור אותו ב־S3 bucket פרטי.

מפתח object מומלץ:

```text
processing/{uuid}.pdf
```

אין להשתמש בשם הקובץ המקורי כמזהה.

### 7.3 PDF.js

ה־Backend יוריד/יקרא את ה־PDF ויחלץ ממנו את text layer באמצעות PDF.js.

התוצאה תהיה טקסט גולמי הכולל את עמודי המסמך.

### 7.4 Failure

אם PDF.js אינו מצליח לחלץ טקסט שימושי:

- לא לנחש מידע.
- אם ניתן ליצור רשומת לקוח מהמידע שכבר חולץ, לשמור אותה בהתאם לכללי ה־PRD.
- אחרת לשמור/לייצג את המקרה בהתאם ליכולת הנתונים הזמינים.
- לשלוח Manual Review email עם ה־PDF.
- לתעד Error Details.
- למחוק את ה־PDF מ־S3 לאחר ניסיון שליחת ההתראה.

---

## 8. AI Extraction

### 8.1 תפקיד ה־AI

OpenAI משמש **רק לחילוץ מובנה של מידע מהטקסט**.

המודל אינו אחראי ל:

- Duplicate Detection.
- החלטה אם לשלוח מייל.
- Status transitions.
- כתיבה ל־MongoDB.
- מחיקת לקוחות.
- השלמת מידע שאינו מופיע במסמך.

### 8.2 Model

ברירת המחדל:

```text
GPT-5.4 mini
```

דרך OpenAI Responses API.

### 8.3 Structured Output

התגובה חייבת להתאים ל־JSON Schema קשיח.

מבנה לוגי:

```json
{
  "companyName": "string | null",
  "address": "string | null",
  "phone": "string | null",
  "email": "string | null",
  "originPort": "string | null",
  "originCountry": "string | null",
  "destinationPort": "string | null",
  "incoterms": "string | null",
  "shipmentType": "FCL | LCL | null"
}
```

אין לאפשר arbitrary free-text output כבסיס לתהליך.

### 8.4 Prompt Rules

ה־system/developer instruction של extractor חייב לכלול:

- Extract only information explicitly present in the document.
- Do not infer missing values.
- Do not invent contact details.
- Return `null` when a value is unavailable.
- Shipment type may only be `FCL`, `LCL` or `null`.
- Extract Consignee information, not Shipper/Notify Party information.
- Origin refers to shipment origin/port/country, not Consignee country.
- Destination port refers to the shipment's port of discharge.
- Incoterms may only be extracted if the sale terms are explicitly stated in the document.

### 8.5 Validation

לאחר OpenAI response:

1. Validate JSON schema.
2. Convert empty strings to `null`.
3. Normalize whitespace.
4. Validate `shipmentType` enum structurally.
5. Do **not** invent replacements for missing values.

אם Structured Output אינו תקין או API call נכשל, התהליך עובר ל־Manual Review.

### 8.6 AI Configuration

Model name, prompt version ו־schema version יוגדרו בקונפיגורציה ולא יהיו מפוזרים בקוד.

מומלץ לשמור logs טכניים של failure type, אך לא לשמור את כל תוכן ה־PDF בלוגים.

---

## 9. Business Rules

הלוגיקה הבאה היא deterministic code ב־Backend.

### 9.1 Required Client Field

`Company Name` הוא השדה היחיד שהוגדר כחובה לעיבוד אוטומטי מלא של רשומת הלקוח.

אם הוא חסר:

```text
Processing Status = Failed
```

שאר הנתונים שחולצו יישמרו ככל שניתן.

נשלח Manual Review email.

### 9.2 Optional Fields

`Address` ו־`Phone` אינם תנאי לשליחת מייל.

אם הם חסרים אך שאר התנאים מתקיימים:

```text
Processing Status = Success
```

בתצוגת UI יוצג `NOT Available`.

מומלץ שב־Database הערך יהיה `null`, ולא המחרוזת `NOT Available`.  
`NOT Available` הוא presentation value בלבד.

### 9.3 Duplicate Detection

כללי הכפילות:

#### כאשר Email קיים

```text
same normalized Company Name
AND
same normalized Email
→ duplicate
```

Address או Phone שונים אינם משנים את ההחלטה.

אם Company Name זהה אך Email שונה:

```text
new contact/client record
```

#### כאשר Email חסר

```text
same normalized Company Name
→ duplicate
```

#### כאשר זוהתה כפילות

- לא ליצור רשומה חדשה.
- לא לעדכן את הרשומה הקיימת.
- לא לשנות Date Added.
- לא לעדכן את פרטי המשלוח; נשמרים פרטי ה־HBL הראשון בלבד.
- לא לשלוח מייל.
- לא ליצור הודעת UI מיוחדת.
- למחוק את ה־PDF הזמני.
- לסיים את התהליך.

### 9.4 Normalization לצורך Duplicate Detection

כדי למנוע הבדלים טכניים שאינם עסקיים, יש להשתמש בשדות normalized פנימיים.

לדוגמה:

```text
companyNameNormalized
emailNormalized
```

Normalization מומלץ:

```text
trim
collapse repeated whitespace
lowercase
Unicode normalization
```

ל־Email:

```text
trim
lowercase
```

אין לבצע fuzzy matching או AI-based duplicate matching ב־MVP.

---

## 10. Email Decision Engine

### 10.1 Marketing Email Requirements

מייל שיווקי נשלח רק אם קיימים:

- Company Name
- Email
- Origin Port
- Origin Country
- Destination Port
- Incoterms
- FCL/LCL

Address ו־Phone אינם נדרשים.

### 10.2 Successful Marketing Send

כאשר כל התנאים קיימים:

1. Backend בונה את התבנית בעברית.
2. משתנים מוזנים מהנתונים שחולצו.
3. SES שולח את ההודעה מהתיבה/identity הייעודית.
4. אם השליחה הצליחה:

```text
Processing Status = Success
Email Status = Sent
```

אין לשמור email sent date.

### 10.3 Missing Email

אם Company Name קיים אך Email חסר:

- הלקוח נשמר.
- `Email Status = Missing Email`.
- נשלח Admin/Manual Review email באנגלית.
- ה־PDF מצורף.
- אין מייל שיווקי ללקוח.

### 10.4 Missing Marketing Context

אם Email ו־Company Name קיימים אבל חסר אחד או יותר מ:

- Origin Port
- Origin Country
- Destination Port
- Incoterms
- FCL/LCL

אז:

```text
Email Status = Requires Manual Review
```

אין לשלוח מייל שיווקי.

מייל ההתראה למנהל יכלול:

- PDF.
- סיבת ה־Manual Review.
- מידע שכן חולץ.
- נוסח/טיוטת המייל השיווקי שהמערכת תכננה לשלוח, עם סימון ברור של המידע החסר.

### 10.5 SES Failure

אם SES נכשל:

```text
Email Status = Failed
```

- הלקוח נשאר ב־Database.
- אין retry אוטומטי.
- נשלח Manual Review email למנהל ככל שניתן.
- ה־PDF מצורף.
- Error Details נשמרים בצורה ידידותית למשתמש.

יש להימנע מלשמור credentials, raw stack traces או פרטים פנימיים רגישים בתוך `errorDetails`.

### 10.6 Manual Edit

עריכת לקוח לעולם אינה שולחת Marketing Email.

אם Email היה חסר והמשתמש מוסיף אותו ידנית:

```text
Email Status = Email Added Manually
```

אם המשתמש משלים Company Name שחסר:

```text
Processing Status = Success
```

Email Status אינו הופך ל־Sent אלא אם מייל אכן נשלח בעבר.

---

## 11. MongoDB Data Model

### 11.1 Collection

```text
clients
```

### 11.2 Client Document

מבנה מומלץ:

```json
{
  "_id": "ObjectId",
  "companyName": "string | null",
  "companyNameNormalized": "string | null",
  "address": "string | null",
  "phone": "string | null",
  "email": "string | null",
  "emailNormalized": "string | null",
  "originPort": "string | null",
  "originCountry": "string | null",
  "destinationPort": "string | null",
  "incoterms": "string | null",
  "shipmentType": "FCL | LCL | null",
  "dateAdded": "Date",
  "processingStatus": "Success | Failed",
  "emailStatus": "Sent | Missing Email | Email Added Manually | Requires Manual Review | Failed",
  "errorDetails": "string | null"
}
```

### 11.3 מידע שלא נשמר ב־Client

בהתאם ל־PRD אין לשמור:

- PDF.
- Email sent date.
- Last Updated.
- היסטוריית משלוחים; נשמרים רק פרטי המשלוח מה־HBL הראשון של הלקוח.

### 11.4 Indexes

מומלץ:

```text
{ companyNameNormalized: 1, emailNormalized: 1 }
{ companyNameNormalized: 1 }
{ dateAdded: -1 }
{ processingStatus: 1 }
{ emailStatus: 1 }
```

בנוסף ניתן להשתמש ב־compound indexes לפי query patterns בפועל:

```text
{ processingStatus: 1, dateAdded: -1 }
{ emailStatus: 1, dateAdded: -1 }
```

### 11.5 Duplicate Safety

בדיקת duplicate ברמת service בלבד עלולה לסבול מ־race condition.

לכן מומלץ להשתמש גם ב־database constraint עבור רשומות עם Email באמצעות unique partial index על:

```text
companyNameNormalized + emailNormalized
```

כאשר `emailNormalized` קיים.

עבור רשומות ללא Email, מאחר שהכלל העסקי הוא Company Name בלבד אך אותה חברה יכולה במקביל להכיל contacts עם Email, אין ליצור unique index גלובלי רק על Company Name. הבדיקה תבוצע טרנזקציונית/אטומית ככל האפשר בשכבת ה־service.

ב־MVP עם משתמש יחיד והעלאה בודדת הסיכון נמוך, אך הקוד צריך לטפל ב־duplicate-key conflict כאירוע duplicate ולא כ־500.

---

## 12. REST API

Prefix:

```text
/api
```

Versioning מומלץ:

```text
/api/v1
```

### 12.1 Clients

#### List

```http
GET /api/v1/clients
```

Parameters:

```text
search
processingStatus
emailStatus
sortBy
sortOrder
page
limit
```

Response:

```json
{
  "items": [],
  "page": 1,
  "limit": 25,
  "hasNextPage": true
}
```

אין צורך ב־Total Clients ולכן אין חובה לבצע count query בכל request.

#### Details

```http
GET /api/v1/clients/:id
```

#### Edit

```http
PATCH /api/v1/clients/:id
Content-Type: application/json
```

Editable fields:

```text
companyName
address
phone
email
```

פרטי המשלוח אינם ניתנים לעריכה; ה־Backend ידחה אותם ב־PATCH.

ה־Backend יעדכן normalized fields ואת הסטטוסים הנגזרים בהתאם לכללי ה־PRD.

#### Delete

```http
DELETE /api/v1/clients/:id
```

Hard delete.

### 12.2 Document Processing

```http
POST /api/v1/documents/process
Content-Type: multipart/form-data
```

Field:

```text
file
```

ה־Backend יקבל קובץ אחד בלבד.

Response אינו צריך לחשוף extraction internals.

דוגמה:

```json
{
  "processed": true,
  "result": "created"
}
```

או:

```json
{
  "processed": true,
  "result": "duplicate"
}
```

או:

```json
{
  "processed": true,
  "result": "manual_review",
  "clientId": "..."
}
```

ה־UI אינו חייב להציג את ההבחנה העסקית לאחר upload, אך המידע שימושי ל־client logic ול־observability.

### 12.3 Health

```http
GET /health
```

ישמש את App Runner ל־health checks.

ה־endpoint לא צריך לבדוק OpenAI/SES בכל request; health check בסיסי צריך לוודא שהאפליקציה רצה. ניתן להוסיף readiness פנימי לפי הצורך.

---

## 13. Search, Filters and Pagination

Search יתבצע ב־Backend מול MongoDB.

ה־Frontend לא יוריד את כל הלקוחות לצורך filtering.

### Search Fields

- Company Name
- Email
- Phone

### Filters

- Processing Status
- Email Status

Manual Review views ימומשו באמצעות אותם filters, לדוגמה:

```text
processingStatus=Failed
emailStatus=Failed
emailStatus=Requires Manual Review
emailStatus=Missing Email
```

### Pagination

```text
25 records per page
```

ל־MVP ניתן להשתמש ב־`skip/limit` משום שהמערכת צפויה להתחיל בנפח קטן.

אם בעתיד המאגר יגדל משמעותית, ניתן לעבור ל־cursor-based pagination ללא שינוי במודל העסקי.

---

## 14. Amazon S3

### 14.1 Bucket

Bucket פרטי ייעודי, לדוגמה לוגית:

```text
ordan-future-clients-processing
```

שם בפועל חייב להיות globally unique.

### 14.2 Access

- Block Public Access = enabled.
- גישה רק ל־Backend IAM role.
- אין URLs ציבוריים.
- Encryption at rest מופעלת.
- תקשורת HTTPS בלבד.

### 14.3 Lifecycle

ה־Backend מוחק PDF במפורש בסיום.

בנוסף יש להגדיר Lifecycle rule כמנגנון safety-net למחיקת processing objects ישנים.

ה־Lifecycle אינו תחליף למחיקה המיידית; הוא מיועד למצבים כמו crash באמצע processing.

### 14.4 Failure Cleanup

מחיקת object תתבצע ב־`finally` ככל האפשר.

Pseudo-code:

```text
upload to S3
try:
    process
    send required emails
finally:
    delete S3 object
```

אם delete נכשל, יש לתעד operational error. ה־Lifecycle ינקה את הקובץ מאוחר יותר.

---

## 15. Amazon SES

### 15.1 Identities

יש להגדיר sender/domain מאומת עבור התיבה הייעודית של המערכת.

### 15.2 Email Types

שני סוגי הודעות:

```text
MarketingEmail
ManualReviewEmail
```

### 15.3 Marketing Email

- עברית.
- HTML + plain-text fallback מומלצים.
- Template קבוע.
- משתנים דינמיים.
- נוסח סופי עדיין TBD.

### 15.4 Manual Review Email

- אנגלית.
- נשלח לכתובת מנהל המערכת שמוגדרת ב־environment configuration.
- כולל reason.
- כולל extracted fields.
- כולל PDF attachment כאשר נדרש.
- במקרי missing marketing context כולל planned marketing email draft.

### 15.5 No Automatic Retry

לפי ה־PRD אין לבצע application-level retry של Marketing Email שנכשל.

יש להבחין בין retry פנימי של HTTP/SDK transport לבין retry עסקי שמנסה לשלוח שוב הודעה ללקוח. השני אסור ב־MVP.

---

## 16. Cloud Infrastructure

### 16.1 Frontend — Vercel

Next.js deployed ל־Vercel.

Environment variables בצד השרת/Build יכילו רק ערכים הנדרשים ל־Frontend כגון:

```text
NEXT_PUBLIC_API_BASE_URL
```

אין לחשוף OpenAI/AWS/MongoDB secrets כ־`NEXT_PUBLIC_*`.

### 16.2 Backend — AWS App Runner

NestJS ירוץ בתוך Docker container.

App Runner יקבל:

- CPU/Memory configuration.
- Environment configuration.
- IAM instance role.
- Health check.
- HTTPS endpoint.

### 16.3 AWS Region

יש לבחור Region יחיד הקרוב גאוגרפית למשתמש ולשירותים הנדרשים, כל עוד SES/App Runner/S3 זמינים בו בהתאם לצורך.

S3 ו־SES מומלץ שיהיו באותו Region של ה־Backend כאשר אפשר, כדי לצמצם latency ומורכבות.

### 16.4 MongoDB Atlas Region

Atlas cluster ימוקם ב־region קרוב ל־Backend ככל האפשר.

### 16.5 Network Model

ה־MVP אינו דורש VPC מורכב או Kubernetes.

ה־Backend מתקשר החוצה דרך TLS אל:

```text
MongoDB Atlas
OpenAI API
Amazon S3
Amazon SES
```

---

## 17. Authentication and Access Security

### 17.1 PRD Decision

אין Login, Roles או Permissions ב־MVP.

לכן אין להוסיף Cognito כחלק מה־application flow הנוכחי.

### 17.2 Important Security Decision

היעדר Login אינו צריך להתפרש כ־"API ציבורי פתוח ללא הגנה".

המערכת מכילה מידע עסקי ויכולה לשלוח מיילים אוטומטית. לכן יש להגן על סביבת ה־MVP ברמת תשתית/גישה ככל שה־deployment מאפשר, בלי ליצור מערכת משתמשים במוצר.

אפשרויות סבירות כוללות:

- הגבלת גישה ברמת hosting/network כאשר אפשר.
- שימוש ב־non-public deployment environment.
- WAF/rate limiting.
- CORS allowlist ל־Frontend production origin.
- שמירת כל secrets בצד השרת בלבד.

אין להוסיף מסך Login בניגוד ל־PRD.

### 17.3 Future Authentication

כאשר יידרשו מספר משתמשים:

```text
Amazon Cognito
```

ישמש Authentication provider.

ה־Backend יתוכנן כך שניתן יהיה בעתיד להוסיף Guard ל־NestJS endpoints בלי לשנות את domain services.

---

## 18. Application Security

### 18.1 Transport

כל תקשורת production חייבת להיות HTTPS/TLS.

### 18.2 Secrets

Secrets נדרשים:

```text
MONGODB_URI
OPENAI_API_KEY
AWS credentials / IAM role configuration
SES sender identity
ADMIN_REVIEW_EMAIL
S3 bucket name
```

ב־AWS יש להעדיף IAM role על static AWS access keys.

Secrets לא ייכנסו ל־Git repository.

### 18.3 File Validation

Backend יוודא:

- קובץ יחיד.
- PDF MIME/format.
- parsing failure מטופל בצורה בטוחה.

למרות שלא הוגדרה מגבלת גודל מוצרית, יש צורך ב־technical safety limit ברמת infrastructure כדי למנוע memory exhaustion או abuse. הערך המדויק הוא configuration ולא דרישת מוצר, ויש לבחור אותו גבוה מספיק כדי לא להפריע למסמכי HBL תקינים.

### 18.4 Input Safety

- MongoDB queries לא יורכבו ישירות מ־raw request objects.
- Sort fields יהיו allowlisted.
- Status filters יהיו enums.
- ObjectId validation לפני query.
- אין להציג raw exception messages למשתמש.

### 18.5 AI Safety Boundary

תוכן PDF הוא untrusted input.

גם אם מופיעות במסמך הוראות טקסטואליות, המודל צריך להתייחס אליהן כאל תוכן מסמך ולא כאל instructions.

Prompt extraction יורה למודל לבצע extraction בלבד.

Structured Outputs + server-side validation הם boundary חובה.

### 18.6 Logging

אין לכתוב ללוגים:

- PDF text מלא.
- API keys.
- AWS credentials.
- MongoDB URI.
- גוף מלא של מיילים כאשר אינו נדרש.
- PII מעבר למה שנדרש לצורך debugging.

---

## 19. Error Handling

### 19.1 Error Categories

מומלץ להבחין פנימית בין:

```text
UPLOAD_ERROR
PDF_PARSE_ERROR
AI_API_ERROR
AI_SCHEMA_ERROR
MISSING_COMPANY_NAME
MISSING_EMAIL
MISSING_ORIGIN_PORT
MISSING_ORIGIN_COUNTRY
MISSING_DESTINATION_PORT
MISSING_INCOTERMS
MISSING_SHIPMENT_TYPE
EMAIL_SEND_ERROR
DATABASE_ERROR
STORAGE_ERROR
```

לא כל category הופך ל־Processing Status = Failed; ה־status נקבע לפי כללי ה־PRD.

### 19.2 Error Details

`errorDetails` מיועד למשתמש.

הוא צריך להיות קצר וברור, למשל:

```text
Company name could not be extracted from the document.
```

או:

```text
Marketing email was not sent because the origin port was not found.
```

אין לשמור stack trace ב־Client document.

### 19.3 Operational Errors

שגיאות תשתיתיות יירשמו ב־backend logs עם correlation/request ID.

---

## 20. Observability

למרות שאין Dashboard תפעולי ב־MVP, נדרש logging בסיסי.

מומלץ להשתמש ב־structured JSON logs.

אירועים חשובים:

```text
document_received
pdf_text_extracted
ai_extraction_completed
duplicate_detected
client_created
marketing_email_sent
manual_review_sent
email_send_failed
processing_failed
temporary_file_deleted
```

אין לשמור את תוכן המסמך עצמו באירועים.

App Runner/CloudWatch יכולים לשמש לאיסוף logs בצד AWS.

ה־KPI של 90% עיבוד מוצלח צריך להיות ניתן למדידה מתוך operational events גם אם אין UI שמציג אותו ב־MVP.

---

## 21. Processing Success Definition

כדי למדוד את יעד ה־90%, יש להגדיר אירוע processing outcome.

מומלץ להבחין טכנית בין:

```text
AUTO_SUCCESS
DUPLICATE_SKIPPED
MANUAL_REVIEW
TECHNICAL_FAILURE
```

ערכים אלה אינם חייבים להישמר ברשומת Client ואינם חלק מה־UI.

`AUTO_SUCCESS` פירושו שהמסמך עבר את התהליך האוטומטי הנדרש ללא התערבות ידנית.

`DUPLICATE_SKIPPED` הוא עיבוד תקין אך אינו יוצר לקוח.

הגדרה זו מאפשרת למדוד את KPI בלי להוסיף שדות מוצר שלא נדרשו.

---

## 22. Configuration

הגדרות שאינן hard-coded:

```text
OPENAI_MODEL
OPENAI_EXTRACTION_PROMPT_VERSION
MONGODB_URI
MONGODB_DATABASE
AWS_REGION
S3_BUCKET
SES_FROM_ADDRESS
ADMIN_REVIEW_EMAIL
FRONTEND_ORIGIN
API_PORT
LOG_LEVEL
```

Marketing email template content יכול להיות קובץ template/versioned source code ב־MVP.

כאשר הנוסח הסופי יימסר, אין צורך לבנות CMS או Template Editor.

---

## 23. Environments

מומלץ להפריד לפחות בין:

```text
development
production
```

כל environment יקבל:

- MongoDB database/cluster configuration נפרד ככל האפשר.
- S3 prefix/bucket נפרד.
- SES configuration מתאימה.
- OpenAI key/configuration נפרדת או scoped.
- Frontend/backend URLs נפרדים.

אין להשתמש בנתוני production לצורך פיתוח אם אין צורך.

---

## 24. Deployment Model

### Frontend

```text
Git repository
→ Vercel build
→ Next.js production deployment
```

### Backend

```text
Git repository
→ Docker build
→ container image
→ AWS App Runner
```

אין צורך ב־Kubernetes, ECS cluster או EC2 ב־MVP.

---

## 25. Data Lifecycle

### Client Data

נשמר ב־MongoDB עד למחיקה ידנית.

מחיקת לקוח:

```text
DELETE → confirmation in UI → hard delete in MongoDB
```

אין recycle bin.

### PDF

```text
upload
→ temporary S3
→ process
→ use for manual-review attachment if required
→ delete
```

S3 Lifecycle הוא safety-net בלבד.

### Shipment Context

```text
originPort
originCountry
destinationPort
incoterms
shipmentType
```

נשמר ברשומת Client בעת יצירתה ואינו מתעדכן מ־HBL נוספים של אותו לקוח (כפילות).

### Email Metadata

נשמר רק `emailStatus`.

לא נשמר:

- Sent date.
- Open status.
- Reply status.
- Message history.

---

## 26. Future Extension Points

הארכיטקטורה צריכה לאפשר הרחבה עתידית בלי לממש אותה ב־MVP.

### Incoming Email Processing

בעתיד ניתן להוסיף Email Ingestion Adapter:

```text
Incoming mailbox
→ subject filter
→ attachment extraction
→ existing ProcessingService
```

חשוב: ה־ProcessingService אינו צריך לדעת אם ה־PDF הגיע מ־Upload או ממייל.

המקור מספק PDF, וה־pipeline נשאר זהה.

### Multiple Attachments

בעתיד ingestion layer יוכל לקרוא מספר attachments ולהפעיל את אותו processing pipeline עבור כל אחד.

### OCR

אם יתווספו scanned PDFs, ניתן להוסיף adapter:

```text
DocumentTextExtractor
├── PdfJsTextExtractor
└── OCRTextExtractor (future)
```

כך שאר המערכת לא תשתנה.

### Authentication

NestJS Guards יאפשרו הוספת Cognito בעתיד.

---

## 27. Interfaces פנימיים מומלצים

כדי לשמור על הפרדה בין רכיבים, מומלץ להגדיר interfaces לוגיים.

### DocumentTextExtractor

```text
extract(pdf): ExtractedText
```

Implementation:

```text
PdfJsTextExtractor
```

### ShipmentDataExtractor

```text
extract(text): ExtractedShipmentData
```

Implementation:

```text
OpenAIShipmentDataExtractor
```

### EmailSender

```text
sendMarketingEmail(...)
sendManualReviewEmail(...)
```

Implementation:

```text
SesEmailSender
```

### TemporaryFileStorage

```text
put(...)
get(...)
delete(...)
```

Implementation:

```text
S3TemporaryFileStorage
```

הפרדה זו מאפשרת testing והחלפת ספק עתידית בלי לשנות את הלוגיקה העסקית.

---

## 28. Testing Boundaries Required by Architecture

המסמך אינו מגדיר תוכנית עבודה, אך הארכיטקטורה דורשת שהרכיבים יהיו testable.

ה־business rules צריכים להיות ניתנים לבדיקה ללא OpenAI/S3/SES אמיתיים.

יש להזריק dependencies דרך NestJS DI.

התרחישים הקריטיים מבחינת architecture הם:

- New client + complete marketing data.
- Duplicate with same Company Name + Email.
- Same Company Name + different Email.
- Missing Email.
- Missing Company Name.
- Missing Address/Phone.
- Missing Origin Port / Origin Country / Destination Port / Incoterms / FCL/LCL.
- Duplicate that does not overwrite existing shipment details.
- SES failure.
- AI extraction failure.
- PDF parse failure.
- Manual edit that adds Email.
- Manual edit that fixes Company Name.
- Delete client.

---

## 29. החלטות טכניות מרכזיות

### ADR-01 — Modular Monolith

**החלטה:** Backend אחד ב־NestJS.

**סיבה:** היקף ה־MVP קטן, workflow אחד מרכזי ומשתמש יחיד. Microservices יוסיפו מורכבות ללא ערך.

### ADR-02 — MongoDB Atlas

**החלטה:** Client records ב־MongoDB Atlas.

**סיבה:** תואם ל־Stack שנבחר, מתאים למבנה מסמך גמיש ולשדות nullable, שירות מנוהל ובשל.

### ADR-03 — PDF.js לפני AI

**החלטה:** לחלץ text layer מקומית לפני OpenAI.

**סיבה:** ה־PRD מגדיר PDF דיגיטלי ולא OCR; כך מצמצמים עלות ומורכבות.

### ADR-04 — AI אינו Business Logic Engine

**החלטה:** OpenAI מחלץ JSON בלבד.

**סיבה:** Duplicate Detection, statuses ושליחת מייל חייבים להיות deterministic וניתנים לבדיקה.

### ADR-05 — Temporary S3

**החלטה:** S3 משמש רק בזמן processing.

**סיבה:** ה־PRD אינו דורש שמירת PDF לאחר הצלחה, אך במקרי Manual Review נדרש הקובץ המקורי לצירוף במייל.

### ADR-06 — REST

**החלטה:** REST/JSON ולא GraphQL.

**סיבה:** מספר קטן של resources ופעולות; REST פשוט יותר לפיתוח, debugging ותחזוקה.

### ADR-07 — No Product Login in MVP

**החלטה:** אין Authentication UI או user model.

**סיבה:** דרישת PRD מפורשת. עם זאת, נדרשת הגנת deployment בסיסית כדי לא לחשוף מערכת שמסוגלת לשלוח מיילים לציבור.

### ADR-08 — No Queue in MVP

**החלטה:** processing סינכרוני במסגרת בקשת upload.

**סיבה:** קובץ אחד בכל פעם, משתמש יחיד ואין SLA קשיח. זהו הפתרון הפשוט ביותר.

**הערה:** אם בפועל processing יתחיל להתקרב למגבלות request/runtime או אם יתווסף ingestion אוטומטי/מקבילי, יש להעביר את pipeline ל־asynchronous job queue מבלי לשנות את domain services.

### ADR-09 — Null in DB, NOT Available in UI

**החלטה:** מידע חסר נשמר כ־`null`; `NOT Available` הוא ערך תצוגה.

**סיבה:** מונע ערבוב בין נתון אמיתי לבין placeholder ומקל על queries.

### ADR-10 — No Marketing Retry

**החלטה:** אין retry עסקי אוטומטי לאחר כשל שליחת מייל.

**סיבה:** דרישת PRD מפורשת ומניעת פניות כפולות.

---

## 30. ארכיטקטורת ה־MVP הסופית

```text
                          ┌─────────────────────────┐
                          │      Desktop User       │
                          └────────────┬────────────┘
                                       │
                                       ▼
                          ┌─────────────────────────┐
                          │  Next.js on Vercel      │
                          │                         │
                          │  Clients                │
                          │  Upload PDF             │
                          │  Client Details         │
                          └────────────┬────────────┘
                                       │ HTTPS REST
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ NestJS / Node.js 24 / AWS App Runner   │
                  │                                         │
                  │ Documents → Processing Orchestrator     │
                  │                  │                      │
                  │       ┌──────────┼──────────┐           │
                  │       ▼          ▼          ▼           │
                  │    PDF.js     OpenAI     Business Rules │
                  │                             │           │
                  │                   Duplicate Detection   │
                  │                             │           │
                  │                 Email Decision Engine   │
                  └───────┬─────────────┬────────────┬──────┘
                          │             │            │
                          ▼             ▼            ▼
                  MongoDB Atlas     Amazon SES    Amazon S3
                                                 Temporary
```

הארכיטקטורה שומרת על הפרדה ברורה:

- **Frontend** — UI בלבד.
- **NestJS Backend** — מקור האמת ללוגיקה העסקית.
- **PDF.js** — חילוץ text layer.
- **OpenAI** — חילוץ מידע מובנה בלבד.
- **MongoDB Atlas** — Client data וסטטוסים.
- **Amazon SES** — שליחת Marketing ו־Manual Review emails.
- **Amazon S3** — PDF זמני בלבד.
- **Vercel** — Frontend.
- **AWS App Runner** — Backend.

מבנה זה נותן ל־MVP ארכיטקטורה פשוטה ומעשית, תוך שמירת נקודות הרחבה ברורות ל־Email ingestion, OCR, Authentication ועיבוד אסינכרוני בעתיד — בלי להכניס את המורכבות הזו לגרסה הנוכחית.
