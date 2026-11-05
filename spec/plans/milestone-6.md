# תוכנית — Milestone 6: Production Deployment

מקורות: `MILESTONES.md` (Milestone 6), PRD 4.1 ו-5, ARCHITECTURE סעיפים 3.2, 7.5, 15, 16, 18–21, ADR-19, ADR-20, ADR-24, ADR-30 ו-ADR-32, `CLAUDE.md`, הקוד הקיים, ותיעוד Vercel (נבדק בנובמבר 2026).

## 1. נקודת המוצא

**תנאי לתחילת הבנייה:** Milestone 5 מסומן ✅ ונדחף ל-GitHub. כרגע הוא עדיין 🟡, והקוד שלו עדיין לא ב-Git. לכן אי אפשר להתחיל את הבנייה לפני האישור והדחיפה שלו.

ה-Push של Milestone 5 לא פורס דבר, כי Vercel עדיין לא מחובר ל-Repository. לכן הוא לא ממתין ל-Production (`MILESTONES.md`, כלל 7), והסדר של ARCHITECTURE 21 נשמר: ה-Migrations רצים לפני הפריסה הראשונה.

**כבר קיים, מ-Milestone 5:**
- `backend/vercel.json`, נעילת Node.js ל-`24.x`, Pool של 2 חיבורים ו-`PORT` ב-Production.
- טעינה מפורשת של ה-worker של PDF.js.
- `npm run db:migrate:prod`, והוראות פריסה ב-README.

**אין שינוי ב-schema:** קיים Migration אחד, `001_initial.sql`, והוא זה שרץ על Production.

**אין פיצ'רים חדשים, אין שינוי במסכים ואין משתני סביבה חדשים.** שינוי הקוד היחיד הצפוי הוא תיקון תקלות שיתגלו בפריסה (סעיף 6).

## 2. החלטות המשתמש

**תוכניות:** הוחלט להשתמש בשלב זה בתוכניות החינמיות, Vercel Hobby ו-Supabase Free. שדרוג לא דורש שינוי בקוד. המשמעויות (ARCHITECTURE 3.2 ו-15.4):
- **Vercel Hobby** מיועדת לשימוש אישי לא מסחרי בלבד. שימוש של החברה בפועל ידרוש מעבר ל-Pro.
- **Logs** נשמרים שעה אחת בלבד, ולכן את פריט הלוגים ב-Smoke test בודקים מיד אחרי ההעלאה.
- **Supabase Free:** `ordan-prod` מושהה אחרי שבוע עם מעט פעילות, ומפעילים אותו מחדש ב-**Resume project**. אין גיבוי אוטומטי.

**קובצי HBL ל-Smoke test:** קבצים מהתיקייה `samples/`: HBL מלא אחד, ו-HBL אחד שחסר בו שדה חובה. אם אף קובץ שם לא חסר שדה חובה, Claude עוצר ומבקש מהמשתמש קובץ מתאים. אלה נתוני לקוחות אמיתיים: הם יישמרו ב-`ordan-prod` ותוכנם יישלח ל-OpenAI, כמו ב-Development.

**נותר לאישור המשתמש לפני ה-Smoke test:** מדיניות שמירת הנתונים של OpenAI פתוחה ב-PRD 5, ו-ARCHITECTURE 3.2 דורש לבדוק אותה לפני שימוש בנתונים אמיתיים. ידוע כרגע (ADR-30): התשובות לא נשמרות אצל הספק (`store: false`), אבל לוגי ניטור שימוש לרעה נשמרים עד 30 יום.

## 3. שינויים בקבצים

- **README:** Vercel קורא היום לסוג הערך הסודי **Secret**, ולא Sensitive. מעדכנים את הניסוח. כל שינוי נוסף רק אם התגלה בפריסה משהו שונה מהכתוב.
- **`ARCHITECTURE.md`:** ADR חדש רק אם התקבלה בפריסה החלטה טכנית משמעותית.
- **`.env.example`:** לא משתנה.

## 4. סדר הפריסה

Claude עוצר בכל שלב שדורש פעולה של המשתמש, מדריך אותו צעד אחר צעד וממתין לאישור. Claude לא מזין מפתחות ולא רואה אותם.

| # | שלב | מי מבצע | עצירה לאישור |
|---|---|---|---|
| א | תיקון ה-README (סעיף 3) | Claude | — |
| ב | בדיקה ש-`ordan-prod` פעיל, ואיתור ה-Region שלו | המשתמש | כן |
| ג | הרצת Migrations על Production | Claude מפעיל, המשתמש מדביק | **כן, אישור מפורש** |
| ד | יצירת OpenAI key ל-Production | המשתמש | כן |
| ה | Project ב-Vercel ל-Backend | המשתמש | כן |
| ו | Project ב-Vercel ל-Frontend | המשתמש | כן |
| ז | Google OAuth Production | המשתמש | כן |
| ח | Smoke test (סעיף 5) | שניהם | כן |
| ט | Push לבדיקת הפריסה האוטומטית | Claude | **כן, אישור מפורש** |

### ג. Migrations על Production
Claude מפעיל את `npm run db:migrate:prod` בטרמינל של המשתמש. המשתמש מעתיק את ה-Session pooler connection string של `ordan-prod` מ-Supabase, מדביק אותו בשדה הנסתר, בודק את מזהה ה-Project שמוצג ומקליד `yes`.

Claude קורא את הפלט ובודק אותו מול `001_initial.sql`:
- הטבלאות `clients`, `users` ו-`schema_migrations`, עם RLS פעיל בכולן.
- ה-Indexes `clients_company_email_unique`, `clients_company_idx`, `clients_email_idx`, `clients_date_added_idx` ו-`clients_status_date_added_idx`.

הרצה שנייה של הפקודה לא נדרשת.

### ה. Vercel, Project ל-Backend
1. Create New → Project, וייבוא ה-Repository. Root Directory: `backend`. שם מוצע: `ordan-crm-backend`.
2. משתני סביבה, ל-**Production בלבד** (מבטלים את הסימון של Preview ו-Development). הערכים הסודיים נשמרים כ-**Secret**:

| משתנה | ערך | סוג |
|---|---|---|
| `DATABASE_URL` | Session pooler של `ordan-prod` | Secret |
| `BACKEND_API_KEY` | מפתח אקראי חדש, שונה מזה של Development | Secret |
| `OPENAI_API_KEY` | המפתח משלב ד' | Secret |
| `MAX_UPLOAD_BYTES` | `4194304` | רגיל |
| `OPENAI_TIMEOUT_MS` | `60000` | רגיל |
| `LOG_LEVEL` | `info` | רגיל |

לא מגדירים את `DATABASE_DEV_PROJECT_REF` ואת `API_PORT`. `OPENAI_MODEL` ו-`OPENAI_EXTRACTION_PROMPT_VERSION` נשארים עם ברירת המחדל שבקוד.

**המפתח צריך להיות זהה בשני ה-Projects, ו-Vercel לא מציג ערך Secret אחרי השמירה.** לכן המשתמש מייצר אותו בחלון טרמינל משלו, מחוץ ל-Claude, בפקודה שב-README, ומשאיר את החלון פתוח עד סוף שלב ו'. המפתח לא נשמר בקובץ. אם הוא אבד, מייצרים חדש ומעדכנים את שני ה-Projects.

3. Deploy.
4. Region: Settings → Functions → Function Regions, ובחירת ה-Region הקרוב ביותר ל-`ordan-prod` (בלעדיו נשארת ברירת המחדל `iad1`). ב-Hobby אפשר לבחור Region אחד. אחר כך **Redeploy**.
5. Claude בודק את `/health`.

### ו. Vercel, Project ל-Frontend
1. ייבוא אותו Repository. Root Directory: `frontend`. שם מוצע: `ordan-crm-frontend`.
2. משתני סביבה, ל-**Production בלבד**, כולם כ-Secret מלבד הכתובת:
   - `BACKEND_API_URL`: הכתובת הקבועה של ה-Backend (`https://...vercel.app`), בלי `/` בסוף. לא כתובת של פריסה בודדת, כי היא משתנה בכל פריסה.
   - `BACKEND_API_KEY`: אותו ערך כמו ב-Backend.
   - `AUTH_SECRET`: ערך אקראי חדש, שונה מזה של Development.
   - `AUTH_GOOGLE_ID` ו-`AUTH_GOOGLE_SECRET`: נוספים בשלב ז'.
3. Deploy ראשון, כדי לקבל את הכתובת הקבועה. הכניסה עם Google עדיין לא תעבוד בשלב הזה, וזה צפוי.
4. אותו Region כמו ב-Backend, ואז Redeploy בשלב ז'.

`AUTH_URL` ו-`AUTH_TRUST_HOST` לא נדרשים: Auth.js מזהה את Vercel אוטומטית (נבדק בקוד של הספרייה).

### ז. Google OAuth Production
1. באותו Google Cloud Project: OAuth Client חדש מסוג Web application. מסך ההסכמה כבר במצב "In production".
2. Authorized JavaScript origin: `https://<frontend>.vercel.app`.
3. Redirect URI: `https://<frontend>.vercel.app/api/auth/callback/google`.
4. העתקת ה-Client ID וה-Secret ל-Project של ה-Frontend ב-Vercel.
5. **Redeploy** של ה-Frontend, כדי שהערכים ייכנסו לתוקף.

### ט. Push לבדיקת הפריסה האוטומטית
ה-DoD דורש ש-Push ל-`main` יפעיל פריסה בשני ה-Projects, ועד כאן הפריסות הופעלו מהייבוא ומ-Redeploy. ה-Push הזה כולל את תיקון ה-README ואת סימוני ההתקדמות.

- `README.md` נמצא מחוץ ל-`frontend` ול-`backend`. לפי התיעוד של Vercel, שינוי כזה נחשב שינוי כללי ופורס את שני ה-Projects. אם Vercel בכל זאת מדלג, בודקים את ההגדרה Skip deployment ב-Settings → Build and Deployment.
- ה-Push מתבצע באישור נפרד, כחלק מהבנייה, ולכן הוא לא מסמן ✅.
- הקובץ `.claude/launch.json` לא נכנס ל-Git בלי שאלה.

## 5. Smoke test

**Claude בודק בעצמו, מבחוץ:**
- `GET /health` ב-Backend מחזיר 200, ב-HTTPS.
- `GET /api/v1/clients` בלי מפתח ועם מפתח שגוי מחזיר 401.
- `/clients` ב-Frontend בלי כניסה מפנה ל-`/sign-in`, ו-`/api/clients` מחזיר 401.
- `http://` מפנה ל-`https://`.

**המשתמש בודק בהדרכה, אחרי כניסה עם Google:**
1. כניסה עם Google, ובדיקה שנוצרה רשומה ב-`users` ב-`ordan-prod` (Table Editor ב-Supabase). זו גם ההוכחה לחיבור עם אימות תעודה.
2. העלאת HBL מלא: `Client added successfully.`, והלקוח מופיע ב-Clients עם `Success`. זו גם ההוכחה ש-PDF.js עובד ב-Vercel.
3. העלאת אותו קובץ שוב: הודעת כפילות.
4. העלאת HBL חסר: הודעת Manual Review, רשימת השדות החסרים ו-**Edit Client**.
5. Clients: חיפוש, סינון, מיון ו-Refresh.
6. Client Details: עריכה ושמירה, ובדיקה שהסטטוס מתעדכן.
7. Delete של רשומת בדיקה.
8. הלקוחות החדשים מופיעים ב-`ordan-prod` ולא ב-`ordan-dev`, ובמפתח ה-OpenAI של Production רשום שימוש. זו ההוכחה שה-Backend מחובר ל-Production בלבד.
9. Runtime Logs ב-Vercel, מיד אחרי ההעלאות: מופיעים `processing_outcome` ו-`client_created`, בלי טקסט PDF ובלי Secrets.
10. `/dev/components` מחזיר 404.
11. ב-Vercel: כל משתני הסביבה מסומנים ל-Production בלבד, בשני ה-Projects.

בסיום המשתמש מחליט אילו רשומות בדיקה נשארות ב-Production. Claude לא מוחק שם נתונים בעצמו.

## 6. סיכונים שנבדקים בפריסה הראשונה

הפריסה הראשונה נכשלה בגלל `functions` ב-`vercel.json`, וההגדרה הוסרה (ADR-33).

| סיכון | הסימן | הטיפול |
|---|---|---|
| תעודת `ordan-prod` שונה מזו שב-Repository | שגיאת SSL כבר ב-`db:migrate:prod` | בדיקה מול התעודה שבלוח הבקרה, ועצירה לשאלה לפני שינוי |
| התקנה מתוך Root Directory במבנה workspaces (הספריות מותקנות בשורש) | שגיאת התקנה או `Cannot find module` | בדיקת ההגדרה "Include files outside the root directory", או `installCommand` ב-`vercel.json` |
| `NODE_ENV` אינו `production` בזמן ריצה, ואז ה-Backend מאזין ל-`API_PORT` | ה-Function לא עונה | בדיקה בלוגים, והתאמת הבחירה ב-`main.ts` |
| `/health` מחזיר 200 גם כשה-Database לא זמין | ה-Endpoint לא בודק שירותים חיצוניים (ARCHITECTURE 12.4) | לכן בדיקת ה-Database נעשית בכניסה עם Google ובמסך Clients |

כל תיקון קוד כזה נבדק מקומית מול Development, ואז נדחף ב-Push נוסף, באישור המשתמש.

## 7. בדיקות אוטומטיות
- אחרי כל תיקון קוד: `npm run lint`, `npm run format:check`, `npm test` ובניית שתי האפליקציות.
- תיקון שמשנה התנהגות מקבל בדיקה משלו.
- ה-e2e tests רצים מול Development בלבד. אין בדיקות אוטומטיות מול Production.

## 8. Definition of Done: איך נבדק כל סעיף

| סעיף | איך נבדק |
|---|---|
| ה-Migrations רצו על Production, וה-Indexes קיימים | הפלט של `db:migrate:prod`, שלב ג' |
| Push ל-`main` מפעיל פריסה בשני ה-Projects | שלב ט': שתי פריסות בסטטוס Ready ב-Vercel |
| HTTPS ו-`/health` מחזיר 200 | Claude, סעיף 5 |
| אימות תעודה ו-PDF.js | סעיף 5, פריטים 1–2 |
| פרטי Production רק ב-Vercel, ו-Preview בלי פרטים | סעיף 5, פריט 11, ו-`git grep` על ה-Repository, גם לפי מזהה ה-Project של `ordan-prod` |
| נדרשת כניסה עם Google, ו-401 בלי מפתח | Claude ומשתמש, סעיף 5 |
| Backend מחובר רק ל-Production | סעיף 5, פריט 8 |
| Smoke: HBL תקין עם `Success` | סעיף 5, פריט 2 |
| Smoke: Manual Review | סעיף 5, פריט 4 |
| Clients, Details, Edit ו-Delete | סעיף 5, פריטים 5–7 |
| Logs ללא תוכן PDF וללא Secrets | סעיף 5, פריט 9 |
| README מעודכן | סקירה, סעיף 3 |

## 9. בסיום
- סימון 🟡 ב-`MILESTONES.md`, אחרי שה-Smoke test וה-Push עברו.
- Milestone 6 רץ ב-Production, ולכן "הרץ כדי שאבדוק" הוא פתיחת כתובת ה-Production, ואין צורך בהרצה מקומית.
- אחרי אישור המשתמש ("דחוף שינויים לגיטהאב"): ✅ ו-Push אחרון.
