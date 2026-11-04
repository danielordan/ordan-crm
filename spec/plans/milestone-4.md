# תוכנית — Milestone 4: PDF Upload & Extraction

מקורות: `MILESTONES.md` (Milestone 4), PRD 4.3–4.5, 4.7–4.9, ARCHITECTURE סעיפים 5.3–5.4, 6.3, 7–10, 12.2, 16.4, 16.6–16.7, 17–19, 23–24, ADR-25, ADR-27 ו-ADR-29, DESIGN 1.2, 2.8–2.9, והקוד הקיים.

## 1. נקודת המוצא

**כבר קיים ונעשה בו שימוש חוזר:**
- `ClientStatusService`, `DuplicateDetectionService`, ו-`ClientsModule` שמייצא אותם יחד עם `ClientsRepository`.
- `normalizeCompanyName`, `normalizeEmail`, `phoneToDigits` (`common/text/normalize.ts`).
- `proxyToBackend`, שמעביר גם `multipart/form-data` כמו שהוא, כולל ה-boundary.
- רכיבי `Alert`, `Button`, `Card`, ו-`AllExceptionsFilter`.
- `SessionExpiredError` והמעבר ל-`/sign-in` במקרה של 401, כמו ב-`ClientDetailsView`.

**קיים כשלד ריק וימולא:** `DocumentsModule`, `ProcessingModule`, `ExtractionModule`, והדף `/upload`.

**יוסר:** `NotificationsModule` הריק, כולל הייבוא שלו ב-`app.module.ts`, כי אין שליחת מיילים בגרסה זו (ADR-29).

**Database Migration:** לא נדרש. הטבלה והאינדקסים הקיימים מכסים הכול, כולל ה-Unique index לכפילויות.

## 2. מה נדרש מהמשתמש לפני הבנייה ובמהלכה

הבנייה עוצרת כאן, ו-Claude מדריך צעד אחר צעד. Claude לא מזין מפתחות ולא קורא את `.env`.

1. **קובצי HBL לדוגמה (TBD ב-MILESTONES).** אין כרגע אף PDF בפרויקט. המשתמש שם אותם בתיקייה `samples/` בשורש. התיקייה מתווספת ל-`.gitignore`, כי אלה נתוני לקוחות אמיתיים שלא נכנסים ל-Git. רצוי לכלול: HBL מלא, HBL שחסר בו שדה, ו-HBL מסוג "TO ORDER", אם יש.
2. **מדיניות שמירת הנתונים של OpenAI (TBD ב-PRD ו-ARCHITECTURE 3.2).** הבדיקה מראה שנתוני API לא משמשים לאימון מודלים כברירת מחדל, אבל לוגים לניטור שימוש לרעה, שעשויים לכלול את תוכן הבקשה, נשמרים עד 30 יום. הקוד ישלח `store: false`, אבל זה לא מבטל את הלוגים האלה. המשתמש מאשר זאת לפני שליחת HBL אמיתי.
3. **OpenAI:** יצירת API key לפיתוח, כולל הגדרת תשלום בחשבון אם נדרשת, והוספתו ל-`OPENAI_API_KEY` ב-`backend/.env`. `OPENAI_MODEL` ו-`OPENAI_EXTRACTION_PROMPT_VERSION` יכולים להישאר ריקים, וייכנסו ערכי ברירת מחדל.

**זמינות המודל (TBD ב-MILESTONES):** נבדק בתיעוד של OpenAI. `gpt-5.4-mini` זמין ב-Responses API ותומך ב-Structured Outputs, בלי הודעה על הפסקה. בדיקה סופית: קריאה אמיתית עם המפתח של המשתמש.

## 3. ספריות חדשות (ב-`backend`)

| ספרייה | שימוש |
|---|---|
| `pdfjs-dist` | חילוץ טקסט, בנתיב `legacy/build/pdf.mjs` ל-Node |
| `openai` | Responses API ו-Structured Outputs |
| `@types/multer` | טיפוסים, כ-dev dependency. Multer עצמו כבר מגיע עם `@nestjs/platform-express` |

ב-Frontend אין ספריות חדשות.

## 4. Backend

### 4.1 Configuration
- `common/config/env.schema.ts`:
  - **הופך לחובה:** `OPENAI_API_KEY`.
  - **ברירות מחדל:** `OPENAI_MODEL=gpt-5.4-mini`, `OPENAI_EXTRACTION_PROMPT_VERSION=v1`.
  - המשמעות: ה-Backend לא עולה בלי ההגדרות, בהתאם ל-ARCHITECTURE 20.1.
- `test/setup-env.ts`: ערך דמה קבוע ל-`OPENAI_API_KEY`. הבדיקות לא נוגעות ב-OpenAI האמיתי.
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
- PDF.js לא מקבל `Buffer`, ולכן הוא מקבל `new Uint8Array(buffer)`.
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

### 4.4 Processing Module
**`processing/processing.service.ts`**: התיאום לפי ARCHITECTURE 6.3, בסדר הזה:

```text
document_received
extract text → pdf_text_extracted
AI extraction → ai_extraction_completed
  on failure: extraction_failed → EXTRACTION_FAILED → { result: "extraction_failed" }
normalize
duplicate check
  duplicate: duplicate_detected → DUPLICATE_SKIPPED → { result: "duplicate" }
compute status (ClientStatusService)
create record → client_created
  unique violation (23505): treated as duplicate (ARCHITECTURE 11.5)
Success: AUTO_SUCCESS → { result: "created", processingStatus, clientId }
Failed:  MANUAL_REVIEW → { result: "created", processingStatus, clientId }
unexpected error (e.g. database): TECHNICAL_FAILURE → rethrow → 500
```

**לוגים:** אירועים עם קטגוריה, `clientId` ו-outcome בלבד. בלי טקסט המסמך, בלי ערכים שחולצו, בלי שם הקובץ ובלי Secrets.

**שינויים ב-`clients/`:**
- `ClientsRepository.create(...)`: INSERT עם `RETURNING`.
- `ClientUpdate` משמש גם ליצירה, ומשתנה שמו ל-`ClientWrite`.
- בניית השדות הנגזרים ובדיקת `isUniqueViolation` עוברות לפונקציות משותפות, כדי שלא ייכתבו פעמיים. התנהגות העריכה לא משתנה.

**תלויות בין Modules:** `Documents → Processing → Clients, Extraction`. הכיוון נשאר אחד, כמו ב-ADR-25.

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
| `created` + `Failed` | Warning | `File processed. Manual review required.` |
| `extraction_failed` | Error | `File could not be processed. Please review the file manually.` |
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
- `OpenAIShipmentDataExtractor` עם לקוח מדומה: מיפוי timeout, שגיאת API, סירוב, ו-`maxRetries: 0`.
- `PdfJsTextExtractor` עם קובצי PDF סינתטיים קטנים ב-`test/fixtures`, בלי נתונים אמיתיים: עם טקסט, בלי טקסט, ופגום. **סיכון:** Jest עלול שלא לטעון מודול ESM. זה נבדק ראשון בבנייה, ואם צריך, הבדיקה מריצה את החילוץ בתהליך Node נפרד.
- `env.schema`: המשתנים החדשים.

**Backend, E2E** (`test/documents.e2e-spec.ts`): מול schema זמני ב-Supabase Development, עם mock ל-OpenAI דרך `overrideProvider`. מכסה את כל התרחישים הרלוונטיים ב-ARCHITECTURE 24:
- לקוח חדש מלא: `Success`.
- חסר שדה חובה אחד או יותר: `Failed`, כל השדות מפורטים.
- חסרים רק Address או Phone: `Success`.
- כפילות לפי שלושת הכללים, בלי רשומה חדשה. הרשומה הקיימת, כולל `dateAdded` ופרטי המשלוח, לא משתנה.
- אותו שם עם מייל אחר: רשומה חדשה.
- בלי שם ובלי מייל: רשומה חדשה, גם בהעלאה חוזרת.
- `TO ORDER`: `companyName` הוא `null`.
- כשל PDF, כשל AI ו-timeout: אין רשומה, ותשובה `extraction_failed`.
- 401 בלי מפתח, 400 לקובץ שאינו PDF, 413 לקובץ גדול, 500 בתקלה לא צפויה, בלי חשיפת פרטים.
- לוגים: אין בהם טקסט המסמך או ערכים שחולצו (בדיקה ישירה על הקריאות ל-Logger).

**Frontend** (`vitest`):
- `lib/upload.test.ts`: כל שורה בטבלת ההודעות, כולל ולידציה.
- `UploadView.test.tsx`: בחירת קובץ, גרירה, Processing ואזור מושבת, Try Again, החלפת הודעה, 401.
- `app/api/documents/process/route.test.ts`: העברה ל-Backend, ו-`maxDuration` של 130.

**בדיקה מול OpenAI האמיתי (נעשית ב-Claude בסוף הבנייה):**
- סקריפט זמני שלא נשמר בפרויקט מריץ את `ProcessingService` דרך האפליקציה עצמה, כך ש-Claude לא רואה את `.env`, ב-schema זמני שנמחק בסוף. כך אין רשומות בדיקה ברשימה של המשתמש.
- מריץ את קובצי ה-HBL מ-`samples/` מול OpenAI, ומשווה את 9 השדות למסמך, כולל המייל.
- מסך ההעלאה נבדק בדפדפן אם המשתמש מחובר בו. אחרת הוא נשאר לבדיקה של המשתמש ב"הרץ כדי שאבדוק".

## 7. מסמכים

- **ADR חדש ב-ARCHITECTURE:** ADR-30: הגדרות OpenAI (`store: false`, בלי ניסיונות חוזרים) וסף הטקסט השימושי.
- **README:** הגדרת OpenAI בטבלת ההגדרות.
- **`.gitignore`:** הוספת `samples/`.
- **MILESTONES.md:** סימון 🟡 בסיום הבנייה.

## 8. התנהגויות שכדאי להכיר

- קובץ PDF עם טקסט שאינו HBL יוצר רשומה ריקה עם `Failed`. זו ההתנהגות שה-spec קובע: PRD 5.ב (אין בדיקה שה-PDF הוא HBL), ושורת "חסרים גם Company Name וגם Email".
- כשל Database אחרי החילוץ מחזיר `Something went wrong`, כי ה-spec קובע 500 לתקלה טכנית.
- בכשל חילוץ מלא לא נשאר תיעוד במערכת מעבר להודעה במסך, ולכן צריך לטפל בקובץ מיד (ADR-29).
- `backend/vercel.json` ובדיקת PDF.js בסביבת Vercel שייכים ל-Milestone 5.

## 9. סדר העבודה

1. בדיקת הדרישות בסעיף 2, והדרכת המשתמש בהקמת OpenAI.
2. התקנת ספריות ועדכון ה-Config. בדיקה ראשונה: טעינת PDF.js ב-Node וב-Jest.
3. Extraction, Processing ו-Documents, עם ה-Unit tests, והסרת `NotificationsModule` הריק.
4. E2E tests.
5. Route ב-Frontend ומסך Upload PDF, עם הבדיקות.
6. בדיקה מול OpenAI האמיתי על קובצי הדוגמה, וכוונון ה-Prompt אם צריך.
7. הרצת `npm test`, `npm run lint`, `npm run format:check`, השוואה לכל סעיף ב-Definition of Done, עדכון מסמכים וסימון 🟡. סגירת ההרצה. בלי commit.

## 10. התאמה ל-Definition of Done

| תנאי | איך נבדק |
|---|---|
| OpenAI הוגדר, והחיבור עובד | בדיקה מול OpenAI האמיתי |
| Migrations, אם נוספו | לא נדרש Migration |
| HBL תקין יוצר לקוח עם 9 שדות נכונים ו-`Success` | קובצי הדוגמה + E2E |
| שדה שחסר במסמך נשמר כ-`null` | E2E + Normalizer + קובצי הדוגמה |
| חסר שדה חובה: `Failed`, הודעת Manual Review | E2E + Frontend |
| Address או Phone חסרים לא מונעים `Success` | E2E |
| "TO ORDER" נשמר עם Company Name חסר | E2E + Normalizer |
| כפילות לפי שלושת הכללים | E2E |
| בלי שם ובלי מייל נוצרת רשומה גם בהעלאה חוזרת | E2E |
| PDF ללא טקסט, כשל AI, timeout: אין רשומה, ומוצגת הודעה | E2E + PDF סינתטי + Frontend |
| קובץ שאינו PDF, או גדול מ-4 MB, נחסם בשני הצדדים | Frontend + E2E |
| ה-PDF לא נשמר בשום מקום | בדיקת קוד: Multer בזיכרון, אין כתיבה לדיסק ואין עמודה ב-Database |
| לוגים עם אירועים ו-outcome, בלי תוכן ובלי Secrets | E2E + בדיקת הלוג בהרצה האמיתית |
| כל תרחישי ARCHITECTURE 24 מכוסים | E2E, יחד עם הבדיקות הקיימות של עריכה, מחיקה, API Key ו-Sign in |
| מסך Upload PDF תואם ל-DESIGN | השוואה ל-DESIGN 1.2, ל-Wireframes ול-Mockups |
