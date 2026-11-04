# תוכנית — Milestone 3: Client Details, Edit & Delete

**מטרה:** המשתמש פותח לקוח מהרשימה, רואה את כל פרטיו, עורך ושומר אותם (כולל פרטי המשלוח), רואה את הסטטוס מתעדכן, ויכול למחוק לקוח אחרי אישור.

**מקורות:** PRD 3 (Flows 3–4), 4.5, 4.6, 4.7. ARCHITECTURE 5.3, 9.1, 9.2, 9.3, 9.4, 11.5, 12.1, 16.5, 17.2, 24. DESIGN 1.3, 1.4, 2.4, 2.7, 2.8, 2.14.

## מה לא נדרש ב-Milestone הזה
- **אין Migration.** כל העמודות וה-Indexes כבר קיימים ב-`001_initial.sql`.
- **אין משתני סביבה חדשים**, ואין חשבונות חיצוניים להקים.
- **אין גישה ל-Production.** הכול נבדק מול Development (MILESTONES כלל 7).
- **אין העלאת PDF, OpenAI או SES.** הם שייכים ל-Milestone 4.
- לא נוסף שדה Last Updated, ו-`date_added` לא משתנה בעריכה (PRD 4.6).

---

## החלטות שהתוכנית מקבלת

### 1. בדיקת כפילות בעריכה רצה רק כשהשם או המייל השתנו
**הבעיה:** הכללים מאפשרים מצב קיים של שתי רשומות שנראות כפילות. למשל, רשומה A עם שם בלבד, ואחריה נוצרה רשומה B עם אותו שם ועם מייל (כלל "שם + מייל" לא מזהה אותן ככפילות). אם נבדוק כפילות בכל שמירה, אי אפשר יהיה לתקן אפילו את הטלפון של A.

**ההחלטה:** ה-PRD מדבר על "עריכה **שיוצרת** כפילות" (4.6), ועריכה שלא נוגעת בשם או במייל לא יכולה ליצור כפילות. לכן הבדיקה רצה רק כש-`company_name_normalized` או `email_normalized` השתנו. כללי הבדיקה עצמם נשארים בדיוק לפי ARCHITECTURE 9.3. לפי כללי הסתירות ב-`CLAUDE.md`, ה-PRD מנצח בנושא התנהגות.

### 2. מיקום `DuplicateDetectionService`: בתיקיית `clients`, לא `processing`
ARCHITECTURE 6.2 ממקם אותו ב-`processing/`. אבל ב-Milestone 3 הוא משמש את `ClientsModule`, וב-Milestone 4 `ProcessingModule` יזדקק ל-`ClientsModule` כדי ליצור לקוח. השארתו ב-`processing/` יוצרת תלות מעגלית בין המודולים. לכן הוא יישב ב-`clients/duplicate-detection.service.ts`, ו-`ClientsModule` ייצא אותו. ההחלטה תתועד כ-**ADR-25** בסוף ARCHITECTURE.md, בלי לשנות את שאר המסמך.

### 3. שדה ריק נשמר כ-`null`; כל השאר נשמר בדיוק כפי שהוזן
ערך ריק או שמכיל רווחים בלבד הופך ל-`null` (ARCHITECTURE 9.2), אחרת הסטטוס וה-`NOT Available` לא יעבדו. ערך שיש בו תוכן נשמר כמו שהוא, בלי trim ובלי שינוי אותיות (PRD 4.6). רק העמודות המנורמלות עוברות נרמול.

### 4. מצבים שה-spec לא מפרט טקסט עבורם
הם הכרחיים כדי שהמסך לא יישבר, ולא מוסיפים יכולת חדשה:
| מצב | מה מוצג |
|---|---|
| לקוח לא קיים או כתובת לא תקינה (למשל אחרי מחיקה וחזרה אחורה) | Alert: `Client not found.` וכפתור **Back to Clients** |
| כשל טעינה | Alert: `Something went wrong. Please try again.` וכפתור **Try Again**, כמו במסך Clients |
| כשל ב-Save (לא כפילות) | אותו טקסט ב-Alert מעל הטופס. הטופס נשאר במצב עריכה עם הערכים שהוזנו |
| כשל ב-Delete | אותו טקסט ב-Alert בתוך ה-Modal. ה-Modal נשאר פתוח |
| לקוח שנמחק בינתיים בזמן Save או Delete | מסך `Client not found.` |
| ה-session פג (401) | מעבר ל-`/sign-in` עם `callbackUrl`, כמו במסך Clients |

---

## Backend

### קבצים חדשים
| קובץ | תוכן |
|---|---|
| `backend/src/clients/client-status.service.ts` | `ClientStatusService` |
| `backend/src/clients/duplicate-detection.service.ts` | `DuplicateDetectionService` |
| `backend/src/clients/dto/update-client.dto.ts` | Schema של גוף ה-PATCH |
| `backend/src/clients/client-status.service.spec.ts` | Unit tests |
| `backend/src/clients/duplicate-detection.service.spec.ts` | Unit tests, עם repository מדומה |
| `backend/src/clients/dto/update-client.dto.spec.ts` | Unit tests |
| `backend/test/client-details.e2e-spec.ts` | Integration tests ל-GET, PATCH ו-DELETE |

### קבצים שמשתנים
`client.types.ts`, `client.mapper.ts`, `clients.repository.ts`, `clients.service.ts`, `clients.controller.ts`, `clients.module.ts`, `seed/seed-data.ts`.

### `ClientStatusService` (ARCHITECTURE 9.1, 17.2)
- `compute(fields)` מחזיר `{ processingStatus, errorDetails }`. בלי גישה ל-Database.
- שדות חובה, לפי הסדר הזה: Company Name, Email, Origin Port, Origin Country, Destination Port, Incoterms, Shipment Type.
- `null` או טקסט ריק נחשבים חסרים. Address ו-Phone לא נבדקים.
- נוסח השגיאה: `Missing required fields: Email, Incoterms.`
- `seed-data.ts` יעבור להשתמש בשירות במקום רשימת ה-`REQUIRED` הכפולה שלו, כדי שלכלל ולנוסח יהיה מקור אחד. התוצאה של ה-Seed לא משתנה.

### `DuplicateDetectionService` (ARCHITECTURE 9.3, 9.4)
- `findDuplicate({ companyName, email }, excludeId?)` מנרמל עם הפונקציות הקיימות ב-`common/text/normalize.ts`, ומחזיר את מזהה הרשומה הכפולה או `null`.
- הכלל נבחר לפי מה שקיים:

| קיים | תנאי ב-SQL |
|---|---|
| שם + מייל | `company_name_normalized = $1 AND email_normalized = $2` |
| שם בלבד | `company_name_normalized = $1` |
| מייל בלבד | `email_normalized = $1` |
| אף אחד | אין query. מוחזר `null` |

- `excludeId`, כשקיים, מוסיף `AND id <> $n`.
- ה-SQL עצמו נמצא ב-`ClientsRepository.findDuplicateId`, והחתימה מוכנה לשימוש ב-Milestone 4 (העלאה, בלי `excludeId`).

### Types ו-Mapper
- `ClientRow`: כל עמודות התצוגה של `clients`.
- `Client` (API, camelCase): `id`, 9 השדות הניתנים לעריכה, `dateAdded` (ISO), `processingStatus`, `errorDetails`. העמודות המנורמלות לא נחשפות.
- `toClient(row)` ב-`client.mapper.ts`.

### Repository (Queries עם פרמטרים בלבד)
- `findById(id)`: מחזיר `ClientRow` או `null`.
- `update(id, values)`: `UPDATE ... RETURNING`, כולל `company_name_normalized`, `email_normalized`, `phone_digits`, `processing_status` ו-`error_details`. מחזיר `null` כשאין רשומה.
- `delete(id)`: מחזיר אם נמחקה רשומה.
- `findDuplicateId(...)`: כמתואר למעלה, עם `LIMIT 1`.

### DTO של PATCH (ARCHITECTURE 12.1)
- 9 שדות, כולם אופציונליים. אובייקט `strict`: שדה לא מוכר מחזיר 400. גוף ריק מחזיר 400.
- שדות הטקסט: `string` או `null`, בלי ולידציית פורמט. ריק או רווחים בלבד הופך ל-`null`. תו null (`\0`) מחזיר 400, כי Postgres לא יכול לשמור אותו, ואחרת היה נוצר 500.
- `shipmentType`: רק `FCL`, `LCL` או `null`.

### Service
- `getById(id)`: 404 כשאין רשומה.
- `update(id, patch)`:
  1. טוען את הרשומה (404 אם אינה קיימת).
  2. ממזג את השינויים עם הערכים הקיימים.
  3. אם השם או המייל המנורמלים השתנו: בדיקת כפילות עם `excludeId = id`. כפילות מחזירה 409.
  4. מחשב סטטוס ו-`errorDetails`, ומעדכן את כל העמודות.
  5. שגיאת Postgres `23505` (מרוץ בין שתי שמירות) הופכת ל-409 ולא ל-500 (ARCHITECTURE 11.5).
  6. `update` שמחזיר `null`, כי הרשומה נמחקה בינתיים, מחזיר 404.
- `delete(id)`: 404 כשאין רשומה.

### Controller
| Route | תשובה |
|---|---|
| `GET /api/v1/clients/:id` | 200 עם `Client` |
| `PATCH /api/v1/clients/:id` | 200 עם ה-`Client` המעודכן |
| `DELETE /api/v1/clients/:id` | 204 בלי גוף |

- `:id` עובר `ParseUUIDPipe`, ולכן ערך לא תקין מחזיר 400 לפני כל query.
- 409 מוחזר כ-`ConflictException({ error: 'DUPLICATE_CLIENT', message })`. ה-Exception filter הקיים כבר שומר קודים כאלה.
- ה-API Key Guard וה-Rate limit חלים אוטומטית.

### Module
`ClientsModule` מוסיף את שני השירותים כ-providers, ומייצא אותם ואת `ClientsRepository` לקראת Milestone 4.

---

## Frontend

לפני כתיבת הקוד: לקרוא ב-`node_modules/next/dist/docs/` את המדריכים ל-Dynamic Route Handlers ול-`params`, כפי ש-`frontend/AGENTS.md` מחייב.

### קבצים חדשים
| קובץ | תוכן |
|---|---|
| `frontend/src/app/api/clients/[id]/route.ts` | Proxy ל-GET, PATCH ו-DELETE |
| `frontend/src/lib/clients-api.ts` | קריאות הדפדפן ל-API ו-`SessionExpiredError` |
| `frontend/src/lib/client-details.ts` | ה-type `Client`, הגדרת השדות לתצוגה, והמרה בין `Client` לערכי הטופס |
| `frontend/src/components/clients/ClientDetailsView.tsx` | ניהול המסך: טעינה, צפייה, עריכה, מחיקה ושגיאות |
| `frontend/src/components/clients/ClientFieldsCard.tsx` | Card של שדות, עם מצב תצוגה ומצב עריכה |
| `frontend/src/components/clients/DeleteClientModal.tsx` | חלון האישור |
| `frontend/src/components/clients/ClientDetailsView.test.tsx` | בדיקות רכיב |
| `frontend/src/app/api/clients/[id]/route.test.ts` | בדיקות ל-Route |

### קבצים שמשתנים
- `frontend/src/app/(app)/clients/[id]/page.tsx`: מעביר את ה-`id` ל-`ClientDetailsView`.
- `frontend/src/lib/format.ts` ו-`format.test.ts`: מוסיף `formatDetailsDate`.
- `frontend/src/components/clients/ClientsView.tsx`: מייבא את `SessionExpiredError` מ-`clients-api.ts`, בלי שינוי התנהגות.
- `frontend/src/lib/backend-proxy.test.ts`: בדיקה שתשובת 204 עוברת בלי גוף.

### Route Handler
`/api/clients/[id]` בודק שה-`id` הוא בפורמט UUID. אם לא, הוא מחזיר 400 בלי לפנות ל-Backend. הבדיקה מונעת הרכבת נתיב אחר ב-Backend מתוך הכתובת (למשל `..`). אחרי הבדיקה הוא משתמש ב-`proxyToBackend` הקיים.

### `formatDetailsDate`
הפורמט: `Jul 20, 2026 14:32`, לפי Asia/Jerusalem, בשעון 24 שעות. חובה `hourCycle: 'h23'`, כדי שחצות יוצג כ-`00:xx` ולא כ-`24:xx`. הבדיקות מכסות גם את החצות וגם מעבר תאריך בין UTC לישראל.

### מבנה המסך (DESIGN 1.3)
```text
Client Details                                    (H1)
[← Back to Clients]                  [Edit] [Delete]   ← במצב עריכה: [Save] [Cancel]
(Alert: כפילות או שגיאה, במצב עריכה בלבד)
┌ Card: Company Name · Address · Phone · Email ───┐
┌ Card "Shipment Details": Origin Port · Origin Country ·
│   Destination Port · Incoterms · Shipment Type ──┐
┌ Card: Date Added (עם שעה) · Processing Status (Badge) ┐
┌ Panel אדום בהיר "Error Details" (רק כש-Failed) ──┐
```
- שורות השדות כמו ב-Mockups: תווית משמאל, ערך מימין וקו הפרדה עדין, בתוך `<dl>`.
- ערך חסר מוצג כ-`NOT Available` בצבע משני. ערך ארוך נשבר לשורות ולא חורג מה-Card.
- **Edit** הוא Secondary. **Delete** הוא `destructive-outline`. **Save** הוא Primary. **Cancel** הוא Secondary. כולם כבר קיימים ב-`Button`.
- Error Details משתמש ב-`Alert` הקיים, מסוג `error`, עם הכותרת `Error Details`.
- לא מוצגים Email Status ותוויות סטטוס אחרות מהתמונות (DESIGN 1.6).

### מצב עריכה
- Card פרטי הלקוח ו-Card פרטי המשלוח הופכים ל-`Input` עם `<label>`. שדה חסר מוצג ריק, לא כ-`NOT Available`.
- Shipment Type הוא `Select` עם `FCL`, `LCL` ו-`NOT Available` (שנשלח כ-`null`).
- Card מצב הרשומה ו-Error Details נשארים לקריאה בלבד עד השמירה.
- **Save:** שולח את כל 9 השדות. בזמן השמירה הכפתורים מושבתים, כדי למנוע שמירה כפולה. Enter בשדה מפעיל Save.
- **הצלחה:** חוזר למצב צפייה עם הנתונים שה-Backend החזיר, כולל הסטטוס המחושב.
- **409:** Alert אדום מעל הטופס עם `A client with this company name and email already exists.` הטופס נשאר פתוח עם הערכים שהוזנו.
- **Cancel:** מחזיר את הערכים המקוריים וסוגר את מצב העריכה, בלי קריאה ל-Backend.

### Delete Modal (DESIGN 1.4)
- מבוסס על `Modal` הקיים: אייקון פח אדום בעיגול אדום בהיר, והכותרת **Delete Client**.
- הטקסט **Are you sure you want to delete this client?**, ומתחתיו בצבע משני **This action cannot be undone.**
- **Cancel**, **Delete** (אדום מלא) ו-Close (X).
- Cancel, Close, Escape ולחיצה על הרקע סוגרים בלי שינוי. בזמן המחיקה הם מושבתים.
- אחרי מחיקה: `router.replace('/clients')`, כדי שכפתור Back בדפדפן לא יחזיר לרשומה שנמחקה.

---

## תיעוד
- **ARCHITECTURE.md:** הוספת ADR-25 (החלטה 2 למעלה) ו-ADR-26 (בדיקת כפילות בעריכה רק כשהשם או המייל השתנו, החלטה 1). שאר המסמך לא משתנה.
- **MILESTONES.md:** סימון 🟡 בסיום הבנייה.
- **README / CLAUDE.md:** אין שינוי בפקודות ההרצה.

---

## בדיקות

### Unit (Backend)
- **`ClientStatusService`:** הכול מלא נותן `Success` ו-`null`. כל שדה חובה חסר בנפרד. כמה שדות חסרים מפורטים לפי הסדר. Address ו-Phone חסרים עדיין נותנים `Success`. טקסט ריק נחשב חסר.
- **`DuplicateDetectionService`:** בחירת הכלל לכל אחד מארבעת המצבים. אם אין שם ואין מייל, אין פנייה ל-repository. הנרמול (אותיות גדולות, רווחים). העברת `excludeId`.
- **DTO:** ריק ורווחים הופכים ל-`null`. ערך עם רווחים בקצוות נשמר כפי שהוא. שדה לא מוכר, גוף ריק, `shipmentType` לא חוקי ותו null מחזירים שגיאה.

### Integration (Backend, מול Supabase Development ב-schema זמני)
- **GET:** כל השדות, בלי העמודות המנורמלות. 400 ל-`:id` לא תקין. 404 ללקוח שלא קיים. 401 בלי מפתח.
- **PATCH, סטטוס:** השלמת שדות חובה ב-`Failed` נותנת `Success` ומרוקנת Error Details. מחיקת שדה חובה נותנת `Failed` עם פירוט. מחיקת Address ו-Phone לא משנה את הסטטוס.
- **PATCH, נתונים:** ערכים נשמרים בדיוק. העמודות המנורמלות ו-`phone_digits` מתעדכנות (חיפוש ברשימה מוצא את הערך החדש). `date_added` לא משתנה. `shipmentType` לא חוקי מחזיר 400.
- **PATCH, כפילות:** 409 על כל אחד משלושת הכללים, והרשומה נשארת ללא שינוי (נבדק ב-GET). אותו שם עם מייל שונה מותר. אין התנגשות של רשומה עם עצמה. בלי שם ובלי מייל אין בדיקה. עריכת טלפון ברשומה עם כפילות קיימת (החלטה 1) מצליחה.
- **DELETE:** 204, ו-GET אחריו מחזיר 404. מחיקה חוזרת מחזירה 404. `:id` לא תקין מחזיר 400.

### Frontend (Vitest)
- תצוגה: כל השדות לפי הסדר, `NOT Available`, תאריך עם שעה ו-Badge. Error Details רק ב-`Failed`.
- עריכה: Edit, שינוי, Save שולח את הגוף הנכון ומציג את התוצאה. Cancel מחזיר את המקור בלי קריאה לשרת. `NOT Available` ב-Shipment Type נשלח כ-`null`.
- שגיאות: 409 מציג את ההודעה ונשאר בעריכה. 500 מציג שגיאה כללית. 404 מציג `Client not found.` 401 מעביר ל-Sign In.
- מחיקה: Cancel ו-Close לא שולחים בקשה. Delete שולח `DELETE` ועובר ל-`/clients`. כשל מציג הודעה ב-Modal.

### בדיקה ידנית בסיום הבנייה
- הרצת `npm test`, `npm run lint` ו-`npm run format:check`.
- הרצת `npm run db:seed` על Development, ואז בדיקת המסך בדפדפן מול רשומות ה-Seed, כולל צילום מסך מול ה-Mockups.
- הכניסה לאתר דורשת חשבון Google, ו-Claude לא מזין פרטי כניסה. אם נדרשת בדיקה בדפדפן, Claude יבקש מהמשתמש להיכנס בחלון הדפדפן שבאפליקציה. אם זה לא יתאפשר, Claude יציין בדיוק מה נבדק רק בבדיקות אוטומטיות ומה נשאר לבדיקת המשתמש.
- סגירת ההרצה בסיום.

---

## התאמה ל-Definition of Done

| תנאי | איך מתקיים ונבדק |
|---|---|
| כל השדות לפי DESIGN, ו-Error Details רק ב-`Failed` | `ClientDetailsView`, בדיקות רכיב ובדיקה בדפדפן |
| Edit, Save ו-Cancel עובדים, והערכים נשמרים בדיוק | בדיקות רכיב ו-Integration |
| השלמת חובה ב-`Failed` נותנת `Success`, ו-Error Details מתרוקן (רשומת Seed) | Integration ובדיקה ידנית על רשומת Seed |
| מחיקת חובה ב-`Success` נותנת `Failed` עם פירוט | Integration |
| Address ו-Phone ריקים לא משפיעים | Unit ו-Integration |
| כפילות בעריכה נחסמת לפי שלושת הכללים, עם הודעה, ושום דבר לא נשמר | Integration ובדיקות רכיב |
| Delete דורש אישור. Cancel ו-Close לא משנים. Delete מוחק וחוזר ל-Clients | בדיקות רכיב ו-Integration |
| `:id` לא תקין מחזיר 400, ולקוח שלא קיים מחזיר 404 | Integration |
| Unit tests ו-Integration tests עוברים | `npm test` |
| המסך וה-Modal תואמים ל-DESIGN.md | בדיקה בדפדפן מול Mockups |

---

## סדר העבודה
1. Backend: `ClientStatusService` ו-`DuplicateDetectionService`, עם Unit tests. מעבר של ה-Seed לשירות הסטטוס.
2. Backend: Repository, Service, Controller ו-DTO, עם Integration tests.
3. Frontend: Route Handler, `clients-api`, `client-details` ו-`formatDetailsDate`, עם בדיקות.
4. Frontend: מסך צפייה, ואז מצב עריכה, ואז Delete Modal, עם בדיקות רכיב.
5. ADRs, בדיקות מלאות, בדיקה בדפדפן, השוואה ל-Definition of Done וסימון 🟡.
