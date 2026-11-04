# תוכנית — Milestone 4: PDF Upload, Extraction & Manual Review Alerts

מקורות: `MILESTONES.md` (Milestone 4), PRD 4.3–4.5, 4.7–4.9, ARCHITECTURE סעיפים 5.3–5.4, 6.3, 7–10, 12.2, 14, 16.4, 16.6–16.7, 17–19, 23–24, ADR-25 ו-ADR-27, DESIGN 1.2, 2.8–2.9, והקוד הקיים.

## 1. נקודת המוצא

**כבר קיים ונעשה בו שימוש חוזר:**
- `ClientStatusService`, `DuplicateDetectionService`, ו-`ClientsModule` שמייצא אותם יחד עם `ClientsRepository`.
- `normalizeCompanyName`, `normalizeEmail`, `phoneToDigits` (`common/text/normalize.ts`).
- `proxyToBackend`, שמעביר גם `multipart/form-data` כמו שהוא, כולל ה-boundary.
- רכיבי `Alert`, `Button`, `Card`, ו-`AllExceptionsFilter`.
- `SessionExpiredError` והמעבר ל-`/sign-in` במקרה של 401, כמו ב-`ClientDetailsView`.

**קיים כשלד ריק וימולא:** `DocumentsModule`, `ProcessingModule`, `ExtractionModule`, `NotificationsModule`, והדף `/upload`.

**Database Migration:** לא נדרש. הטבלה והאינדקסים הקיימים מכסים הכול, כולל ה-Unique index לכפילויות.

## 2. מה נדרש מהמשתמש לפני הבנייה ובמהלכה

הבנייה עוצרת כאן, ו-Claude מדריך צעד אחר צעד. Claude לא מזין מפתחות ולא קורא את `.env`.

1. **קובצי HBL לדוגמה (TBD ב-MILESTONES).** אין כרגע אף PDF בפרויקט. המשתמש שם אותם בתיקייה `samples/` בשורש. התיקייה מתווספת ל-`.gitignore`, כי אלה נתוני לקוחות אמיתיים שלא נכנסים ל-Git. רצוי לכלול: HBL מלא, HBL שחסר בו שדה, ו-HBL מסוג "TO ORDER", אם יש.
2. **כתובת התיבה הייעודית (`SES_FROM_ADDRESS`) וכתובת ההתראות (`ADMIN_REVIEW_EMAIL`).** שתי הכתובות נכנסות ל-`.env`.
   - אזהרה: שליחה דרך SES מכתובת `@gmail.com` עלולה להגיע לספאם או להיחסם, כי המייל לא נשלח משרתי Google. עדיף תיבה בדומיין של החברה. אם תיבחר כתובת Gmail, בודקים בפועל שההתראה מגיעה.
3. **מדיניות שמירת הנתונים של OpenAI (TBD ב-PRD ו-ARCHITECTURE 3.2).** הבדיקה מראה שנתוני API לא משמשים לאימון מודלים כברירת מחדל, אבל לוגים לניטור שימוש לרעה, שעשויים לכלול את תוכן הבקשה, נשמרים עד 30 יום. הקוד ישלח `store: false`, אבל זה לא מבטל את הלוגים האלה. המשתמש מאשר זאת לפני שליחת HBL אמיתי.
4. **OpenAI:** יצירת API key לפיתוח, כולל הגדרת תשלום בחשבון אם נדרשת.
5. **AWS:**
   - יצירת חשבון, בחירת Region (באותו אזור של Supabase Development או קרוב אליו, ARCHITECTURE 15.3).
   - אימות שתי הכתובות ב-SES. SES נשאר ב-Sandbox.
   - יצירת IAM user עם הרשאת `ses:SendRawEmail` בלבד.
6. **הוספה ל-`backend/.env`:** `OPENAI_API_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_FROM_ADDRESS`, `ADMIN_REVIEW_EMAIL`. שני מפתחות ה-AWS הם שורות חדשות שלא קיימות בקובץ. `OPENAI_MODEL` ו-`OPENAI_EXTRACTION_PROMPT_VERSION` יכולים להישאר ריקים, וייכנסו ערכי ברירת מחדל.

**זמינות המודל (TBD ב-MILESTONES):** נבדק בתיעוד של OpenAI. `gpt-5.4-mini` זמין ב-Responses API ותומך ב-Structured Outputs, בלי הודעה על הפסקה. בדיקה סופית: קריאה אמיתית עם המפתח של המשתמש.

## 3. ספריות חדשות (ב-`backend`)

| ספרייה | שימוש |
|---|---|
| `pdfjs-dist` | חילוץ טקסט, בנתיב `legacy/build/pdf.mjs` ל-Node |
| `openai` | Responses API ו-Structured Outputs |
| `@aws-sdk/client-ses` | `SendRawEmailCommand`, שמתאים בדיוק להרשאה `ses:SendRawEmail` |
| `nodemailer` | בניית הודעת MIME עם קובץ מצורף בלבד (`MailComposer`). השליחה עצמה נעשית ב-SES. בניית MIME ידנית מסוכנת כאן, כי הערכים מגיעים ממסמך לא מהימן |
| `@types/multer`, `@types/nodemailer` | טיפוסים, כ-dev dependencies. Multer עצמו כבר מגיע עם `@nestjs/platform-express` |

ב-Frontend אין ספריות חדשות.

## 4. Backend

### 4.1 Configuration
- `common/config/env.schema.ts`:
  - **הופכים לחובה:** `OPENAI_API_KEY`, `AWS_REGION`, `SES_FROM_ADDRESS`, `ADMIN_REVIEW_EMAIL`.
  - **מתווספים כחובה:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
  - **ברירות מחדל:** `OPENAI_MODEL=gpt-5.4-mini`, `OPENAI_EXTRACTION_PROMPT_VERSION=v1`.
  - המשמעות: ה-Backend לא עולה בלי ההגדרות, בהתאם ל-ARCHITECTURE 20.1.
- `.env.example`: הוספת שני מפתחות ה-AWS, בלי ערכים.
- `test/setup-env.ts`: ערכי דמה קבועים לכל המשתנים החדשים. הבדיקות לא נוגעות בשירותים האמיתיים.
- `env.schema.spec.ts`: עדכון לפי הכללים החדשים.

### 4.2 Documents Module
**`documents/documents.controller.ts`**: `POST /documents/process`, מוגן ב-API Key Guard הקיים. משתמש ב-`FileInterceptor('file')`.

**`documents/documents.module.ts`**: `MulterModule.registerAsync`, שקורא את `MAX_UPLOAD_BYTES` מהקונפיגורציה.
- `limits: { fileSize, files: 1 }`, ובלי `dest` או `storage`, כך שהקובץ נשאר בזיכרון בלבד.
- חריגה מהגודל מחזירה 413, וקובץ נוסף מחזיר 400. זו התנהגות מובנית של Nest.

**`documents/validators/pdf-file.validator.ts`**: מחזיר 400 כשהקובץ חסר, כש-MIME שונה מ-`application/pdf`, או כשהקובץ לא מתחיל ב-`%PDF-`.

### 4.3 Extraction Module
הקבצים לפי ARCHITECTURE 6.2, והמחלקות לפי סעיף 23. המחלקה המופשטת משמשת כ-DI token, וכך הבדיקות מחליפות אותה ב-mock.

**`extraction/extraction.errors.ts`**: `ExtractionError` עם `category`: `PDF_PARSE_ERROR`, `AI_API_ERROR`, `AI_TIMEOUT` או `AI_SCHEMA_ERROR` (ARCHITECTURE 17.1).

**`extraction/pdf-text.service.ts`**: `DocumentTextExtractor`, `PdfJsTextExtractor`.
- `pdfjs-dist` הוא ESM בלבד וה-Backend הוא CommonJS, ולכן הטעינה ב-`await import(...)`. ההגדרה `module: nodenext` שומרת על הקריאה הזו.
- **חובה להעביר ל-PDF.js עותק של ה-buffer** (`new Uint8Array(buffer)`). PDF.js לא מקבל `Buffer`, ועלול לרוקן את הזיכרון שקיבל, ואז ה-PDF המצורף למייל היה נפגם. בדיקה ייעודית מוודאת שה-buffer המקורי נשאר שלם.
- הגדרות: `isEvalSupported: false` (הקובץ אינו מהימן), `verbosity: 0`, ו-`destroy()` ב-`finally`.
- קריאת כל העמודים, ושבירת שורה לפי `hasEOL`.
- פחות מ-20 תווים שאינם רווח נחשבים "אין טקסט שימושי". גם קובץ פגום או מוגן בסיסמה הופך ל-`PDF_PARSE_ERROR`.
- אם סדר הטקסט בקובצי הדוגמה יפגע בחילוץ: מיון הפריטים לפי מיקום בעמוד. רק אם זה יידרש בפועל.

**`extraction/extraction.schema.ts`**: Zod schema של 9 השדות (ARCHITECTURE 8.3). כולם חובה ו-nullable, כנדרש ב-strict Structured Outputs, ו-`shipmentType` הוא `FCL`, `LCL` או `null`.

**`extraction/ai-extraction.service.ts`**: `ShipmentDataExtractor`, `OpenAIShipmentDataExtractor`.
- `responses.parse` עם `zodTextFormat`, והמודל מהקונפיגורציה.
- ה-Prompt כולל את כל כללי ARCHITECTURE 8.4 כהוראות, וטקסט המסמך נשלח בנפרד ומסומן כנתונים בלבד.
- `store: false`.
- **`maxRetries: 0`.** ברירת המחדל של ה-SDK היא ניסיונות חוזרים, וזה היה חורג מ-60 השניות שה-PRD קובע.
- מגבלת זמן קשיחה: `AbortSignal.timeout(OPENAI_TIMEOUT_MS)`. ביטול כזה הופך ל-`AI_TIMEOUT`.
- תשובה שנקטעה, סירוב של המודל, או פלט שלא עובר את ה-Schema הופכים ל-`AI_SCHEMA_ERROR`. כל שגיאה אחרת הופכת ל-`AI_API_ERROR`.

**`extraction/extraction-normalizer.service.ts`** (ARCHITECTURE 8.5):
- הסרת תווי NUL ותווי בקרה. PostgreSQL לא יכול לשמור NUL, וזה היה הופך לשגיאת 500.
- כיווץ רווחים והמרת מחרוזת ריקה ל-`null`.
- `companyName` שמתחיל ב-`TO ORDER` או `TO THE ORDER OF`, בלי תלות באותיות גדולות, הופך ל-`null`. בנק מזוהה רק לפי כלל ה-Prompt, כי אין דרך דטרמיניסטית לזהות אותו.
- אין בדיקת פורמט למייל או לטלפון (ADR-27).

### 4.4 Notifications Module
**`notifications/manual-review.template.ts`**: פונקציה טהורה שבונה נושא קבוע וגוף **טקסט רגיל** באנגלית.
- הגוף כולל: סיבת ההתראה (השדות החסרים או סיבת הכשל), כל 9 השדות (`NOT Available` כשחסר), וציון אם נוצרה רשומה.
- טקסט רגיל מונע הזרקת HTML מתוכן המסמך. בנושא אין ערכים מהמסמך.

**`notifications/notification.service.ts`**: `NotificationSender`, `SesNotificationSender`.
- `sendManualReview(...)` מחזיר `true` או `false` ואינו זורק שגיאה.
- **`maxAttempts: 1` ב-`SESClient`.** ברירת המחדל של AWS SDK היא ניסיונות חוזרים, וה-PRD אוסר עליהם.
- `requestTimeout` של 15 שניות, כדי שסך הבקשה יישאר מתחת ל-120 שניות.
- ה-PDF מצורף בשם קבוע, `hbl.pdf`, בלי שימוש בשם הקובץ שהגיע מהמשתמש.

### 4.5 Processing Module
**`processing/processing.service.ts`**: התיאום לפי ARCHITECTURE 6.3, בסדר הזה:

```text
document_received
extract text → pdf_text_extracted
AI extraction → ai_extraction_completed
  on failure: extraction_failed → alert (reason + PDF) → EXTRACTION_FAILED
              → { result: "extraction_failed", notificationSent }
normalize
duplicate check
  duplicate: duplicate_detected → DUPLICATE_SKIPPED → { result: "duplicate" } (no alert)
compute status (ClientStatusService)
create record → client_created
  unique violation (23505): treated as duplicate (ARCHITECTURE 11.5)
Success: AUTO_SUCCESS → { result: "created", processingStatus, clientId }
Failed:  ONE alert → MANUAL_REVIEW → { result: "created", processingStatus, clientId, notificationSent }
unexpected error (e.g. database): TECHNICAL_FAILURE → rethrow → 500
```

**לוגים:** אירועים עם קטגוריה, `clientId` ו-outcome בלבד. בלי טקסט המסמך, בלי ערכים שחולצו, בלי שם הקובץ ובלי Secrets. כשל שליחה נרשם כ-`notification_send_failed`, והצלחה כ-`manual_review_sent`.

**שינויים ב-`clients/`:**
- `ClientsRepository.create(...)`: INSERT עם `RETURNING`.
- `ClientUpdate` משמש גם ליצירה, ומשתנה שמו ל-`ClientWrite`.
- בניית השדות הנגזרים ובדיקת `isUniqueViolation` עוברות לפונקציות משותפות, כדי שלא ייכתבו פעמיים. התנהגות העריכה לא משתנה.

**תלויות בין Modules:** `Documents → Processing → Clients, Extraction, Notifications`. הכיוון נשאר אחד, כמו ב-ADR-25.

## 5. Frontend

**`app/api/documents/process/route.ts`**: `POST` דרך `proxyToBackend`, עם `runtime = 'nodejs'` ו-`maxDuration = 130`.

**`lib/upload.ts`**: פונקציות שאפשר לבדוק בנפרד.
- `validatePdfFile(file)`: MIME `application/pdf` **וגם** סיומת `.pdf`, וגודל עד 4,194,304 בתים.
- `uploadDocument(file)`: שולח `FormData` עם השדה `file`.
- `outcomeFromResponse(...)`: בוחר הודעה וסגנון.

| תשובה | סגנון | טקסט |
|---|---|---|
| `created` + `Success` | Success | `Client added successfully.` |
| `duplicate` | Info | `Client already exists. No changes were made.` |
| `created` + `Failed`, או `extraction_failed`, עם `notificationSent: true` | Warning | `File processed. Manual review required — details were sent by email.` |
| כמו הקודם, עם `notificationSent: false` | Error | `Manual review required, but the notification email could not be sent. Please review the file manually.` |
| 400, או בדיקת סוג בדפדפן | Error | `Only PDF files are supported.` |
| 413, או בדיקת גודל בדפדפן | Error | `File is too large. Maximum size is 4 MB.` |
| 401 | — | מעבר ל-`/sign-in`, כמו בשאר המסכים |
| כל השאר, או כשל תקשורת | Error | `Something went wrong. Please try again.` + **Try Again** |

**`components/upload/UploadView.tsx`** (Client Component), שמוצג מ-`(app)/upload/page.tsx`, לפי DESIGN 1.2 וה-Wireframes:
- Card עם border מקווקו, אייקון Upload, `Drag and drop PDF file here`, `or`, הכפתור **Choose PDF File** (Secondary, עם אייקון קובץ), והטקסט `Only PDF files are supported. Maximum size: 4 MB.`
- מצבים: `idle`, `dragging`, `processing`. בזמן עיבוד: spinner, הטקסט `Processing...`, והאזור מושבת.
- העיבוד מתחיל מיד אחרי בחירת הקובץ.
- הודעת התוצאה ב-`Alert` מתחת לאזור. העלאה חדשה מחליפה אותה, בלי שם הקובץ ובלי **Upload Another PDF**.
- **Try Again** שולח שוב את אותו קובץ, שנשמר בזיכרון של הדפדפן.
- איפוס ערך ה-input אחרי כל בחירה. בלי זה, בחירה חוזרת של אותו קובץ לא מפעילה עיבוד.
- קובץ שמשוחרר מחוץ לאזור ההעלאה לא פותח את ה-PDF בדפדפן ולא מוציא את המשתמש מהמסך.
- אם נגררים כמה קבצים: מעובד הראשון בלבד. ה-PRD קובע קובץ אחד בכל עיבוד ולא מגדיר הודעה למקרה הזה, ולכן לא מומצאת הודעה חדשה.

## 6. בדיקות

**Backend, Unit:**
- `pdf-file.validator`: חסר, MIME שגוי, magic bytes שגויים, תקין.
- `extraction-normalizer`: רווחים, ריק ל-`null`, NUL, `TO ORDER` ו-`TO THE ORDER OF`.
- `manual-review.template`: שדות חסרים, סיבת כשל, ציון יצירת רשומה.
- `OpenAIShipmentDataExtractor` עם לקוח מדומה: מיפוי timeout, שגיאת API, סירוב, ו-`maxRetries: 0`.
- `SesNotificationSender` עם לקוח מדומה: קריאה אחת בלבד, החזרת `false` בכשל, קובץ מצורף ב-MIME.
- `PdfJsTextExtractor` עם קובצי PDF סינתטיים קטנים ב-`test/fixtures`, בלי נתונים אמיתיים: עם טקסט, בלי טקסט, פגום, וה-buffer נשאר שלם. **סיכון:** Jest עלול שלא לטעון מודול ESM. זה נבדק ראשון בבנייה, ואם צריך, הבדיקה מריצה את החילוץ בתהליך Node נפרד.
- `env.schema`: המשתנים החדשים.

**Backend, E2E** (`test/documents.e2e-spec.ts`): מול schema זמני ב-Supabase Development, עם mocks ל-OpenAI ול-SES דרך `overrideProvider`. מכסה את כל התרחישים הרלוונטיים ב-ARCHITECTURE 24:
- לקוח חדש מלא: `Success`, בלי התראה.
- חסר שדה חובה אחד או יותר: `Failed`, כל השדות מפורטים, התראה אחת עם ה-PDF.
- חסרים רק Address או Phone: `Success`.
- כפילות לפי שלושת הכללים, בלי רשומה חדשה ובלי התראה. הרשומה הקיימת, כולל `dateAdded` ופרטי המשלוח, לא משתנה.
- אותו שם עם מייל אחר: רשומה חדשה.
- בלי שם ובלי מייל: רשומה חדשה, גם בהעלאה חוזרת.
- `TO ORDER`: `companyName` הוא `null`.
- כשל PDF, כשל AI ו-timeout: אין רשומה, התראה נשלחה.
- כשל בשליחה: `notificationSent: false`, קריאה אחת בלבד.
- 401 בלי מפתח, 400 לקובץ שאינו PDF, 413 לקובץ גדול, 500 בתקלה לא צפויה, בלי חשיפת פרטים.
- לוגים: אין בהם טקסט המסמך או ערכים שחולצו (בדיקה ישירה על הקריאות ל-Logger).

**Frontend** (`vitest`):
- `lib/upload.test.ts`: כל שורה בטבלת ההודעות, כולל ולידציה.
- `UploadView.test.tsx`: בחירת קובץ, גרירה, Processing ואזור מושבת, Try Again, החלפת הודעה, 401.
- `app/api/documents/process/route.test.ts`: העברה ל-Backend, ו-`maxDuration` של 130.

**בדיקה מול השירותים האמיתיים (נעשית ב-Claude בסוף הבנייה):**
- סקריפט זמני שלא נשמר בפרויקט מריץ את `ProcessingService` דרך האפליקציה עצמה, כך ש-Claude לא רואה את `.env`, ב-schema זמני שנמחק בסוף. כך אין רשומות בדיקה ברשימה של המשתמש.
- מריץ את קובצי ה-HBL מ-`samples/` מול OpenAI ו-SES אמיתיים, ומשווה את 9 השדות למסמך.
- מסך ההעלאה נבדק בדפדפן אם המשתמש מחובר בו. אחרת הוא נשאר לבדיקה של המשתמש ב"הרץ כדי שאבדוק".

## 7. מסמכים

- **ADR חדשים ב-ARCHITECTURE:**
  - ADR-29: הגדרות OpenAI ו-SES (`store: false`, בלי ניסיונות חוזרים, `client-ses` ו-`nodemailer`).
  - ADR-30: סף הטקסט השימושי, והשם הקבוע של הקובץ המצורף.
- **README:** הגדרת OpenAI ו-AWS בטבלת ההגדרות.
- **`.gitignore`:** הוספת `samples/`.
- **MILESTONES.md:** סימון 🟡 בסיום הבנייה.

## 8. התנהגויות שכדאי להכיר

- קובץ PDF עם טקסט שאינו HBL יוצר רשומה ריקה עם `Failed` והתראה. זו ההתנהגות שה-spec קובע: PRD 5.ב (אין בדיקה שה-PDF הוא HBL), ושורת "חסרים גם Company Name וגם Email".
- כשל Database אחרי החילוץ מחזיר `Something went wrong`, בלי התראה. ה-spec קובע 500 לתקלה טכנית, והתראה רק לשני המקרים של PRD 4.8.
- `backend/vercel.json` ובדיקת PDF.js בסביבת Vercel שייכים ל-Milestone 5.

## 9. סדר העבודה

1. בדיקת הדרישות בסעיף 2, והדרכת המשתמש בהקמת השירותים.
2. התקנת ספריות, Config ו-`.env.example`. בדיקה ראשונה: טעינת PDF.js ב-Node וב-Jest.
3. Extraction, Notifications, Processing ו-Documents, עם ה-Unit tests.
4. E2E tests.
5. Route ב-Frontend ומסך Upload PDF, עם הבדיקות.
6. בדיקה מול OpenAI ו-SES אמיתיים על קובצי הדוגמה, וכוונון ה-Prompt אם צריך.
7. הרצת `npm test`, `npm run lint`, `npm run format:check`, השוואה לכל סעיף ב-Definition of Done, עדכון מסמכים וסימון 🟡. סגירת ההרצה. בלי commit.

## 10. התאמה ל-Definition of Done

| תנאי | איך נבדק |
|---|---|
| OpenAI ו-SES הוגדרו, והחיבור עובד | בדיקה מול השירותים האמיתיים |
| Migrations, אם נוספו | לא נדרש Migration |
| HBL תקין יוצר לקוח עם 9 שדות נכונים ו-`Success` | קובצי הדוגמה + E2E |
| שדה שחסר במסמך נשמר כ-`null` | E2E + Normalizer + קובצי הדוגמה |
| חסר שדה חובה: `Failed`, התראה אחת עם PDF, הודעת Manual Review | E2E + Frontend + מייל אמיתי |
| Address או Phone חסרים לא מונעים `Success` | E2E |
| "TO ORDER" נשמר עם Company Name חסר | E2E + Normalizer |
| כפילות לפי שלושת הכללים | E2E |
| בלי שם ובלי מייל נוצרת רשומה גם בהעלאה חוזרת | E2E |
| PDF ללא טקסט, כשל AI, timeout | E2E + PDF סינתטי + מייל אמיתי |
| כשל מדומה בשליחת ההתראה | E2E + `SesNotificationSender` + Frontend |
| קובץ שאינו PDF, או גדול מ-4 MB, נחסם בשני הצדדים | Frontend + E2E |
| ה-PDF לא נשמר בשום מקום | בדיקת קוד: Multer בזיכרון, אין כתיבה לדיסק ואין עמודה ב-Database |
| לוגים עם אירועים ו-outcome, בלי תוכן ובלי Secrets | E2E + בדיקת הלוג בהרצה האמיתית |
| כל תרחישי ARCHITECTURE 24 מכוסים | E2E, יחד עם הבדיקות הקיימות של עריכה, מחיקה, API Key ו-Sign in |
| מסך Upload PDF תואם ל-DESIGN | השוואה ל-DESIGN 1.2, ל-Wireframes ול-Mockups |
