# DESIGN — Ordan Cargo Future Clients

מסמך זה מגדיר את עיצוב האפליקציה על בסיס שלושת חומרי הייחוס שנוצרו. ה־Wireframes הם מקור האמת למבנה ולפריסה, ה־Mockups למראה הסופי, וה־Style Guide לשפה החזותית. המוצר מיועד ל־Desktop Web והממשק באנגלית.

## תמונות ייחוס

### Wireframes
![Wireframes](wireframes.png)

### Mockups
![Mockups](mockups.png)

### Guide Style
![Guide Style](style-guide.png)

---

# 1. Screens

## 1.1 Clients

### מטרה
מסך הבית. המשתמש צופה ברשימת הלקוחות שנאספו, מחפש ומסנן לקוחות, בודק Processing Status ו־Email Status ופותח לקוח לצפייה מפורטת.

### מה יש במסך
- שם המוצר **Ordan Cargo Future Clients** וניווט קבוע.
- אפשרויות ניווט: **Clients** ו־**Upload PDF**.
- כותרת **Clients**.
- כפתור **Upload PDF**.
- Search.
- Filters עבור **Processing Status** ו־**Email Status**.
- טבלת לקוחות המציגה לפי ה־PRD: Company Name, Email, Phone, Date Added, Processing Status ו־Email Status.
- Status badges.
- פעולת **View** לפתיחת לקוח.
- Pagination; ברירת המחדל היא 25 לקוחות בעמוד.
- Refresh בהתאם ל־PRD.
- מידע חסר מוצג כ־`NOT Available`.

> בתמונות העיצוב מופיעים לעיתים פרטי המחשה נוספים בטבלה; במימוש, רשימת השדות והפעולות של ה־PRD היא מקור האמת.

### מה קורה במסך
Search עובד לפי Company Name, Email ו־Phone. המשתמש יכול לסנן לפי שני סוגי הסטטוסים ולמיין, כולל לפי Date Added. לחיצה על לקוח או View פותחת **Client Details**. לחיצה על Upload PDF עוברת למסך ההעלאה.

---

## 1.2 Upload PDF

### מטרה
לאפשר העלאה של House Bill of Lading (HBL) כ־PDF והפעלת העיבוד האוטומטי.

### מה יש במסך
- הניווט הקבוע.
- כותרת **Upload PDF**.
- אזור Drag & Drop גדול.
- Upload icon.
- טקסט **Drag and drop PDF file here**.
- כפתור **Choose PDF File**.
- טקסט שמבהיר שרק PDF נתמך.
- Processing indicator בזמן עיבוד.
- הודעת הצלחה לאחר סיום עיבוד.
- אזור ההעלאה נשאר זמין להעלאה נוספת.

### מה קורה במסך
בחירת PDF או גרירתו מתחילה את העיבוד אוטומטית ללא אישור נוסף. בזמן העיבוד מוצג feedback ברור. בסיום נשארים במסך Upload PDF ומוצגת הודעת הצלחה על עיבוד הקובץ בלבד. בכשל טכני של ההעלאה מוצגים Error ו־**Try Again**. קובץ שאינו PDF נחסם.

---

## 1.3 Client Details

### מטרה
להציג את כל המידע על לקוח, להבין את מצב העיבוד והמייל, ולאפשר עריכה או מחיקה.

### מה יש במסך
- הניווט הקבוע.
- כותרת **Client Details**.
- **Back to Clients**.
- פרטי הלקוח בסדר: Company Name, Address, Phone, Email, Origin Port, Origin Country, Destination Port, Incoterms, Shipment Type, Date Added, Processing Status, Email Status.
- פרטי המשלוח (Origin Port עד Shipment Type) מוצגים כקבוצה נפרדת לקריאה בלבד.
- **Error Details** רק כאשר קיימת שגיאה או סיבה לטיפול ידני.
- Status badges.
- פעולות Edit ו־Delete בהתאם ל־PRD.

### מה קורה במסך
Back to Clients מחזיר לרשימה. Edit מאפשר לערוך Company Name, Address, Phone ו־Email, עם Save ו־Cancel; פרטי המשלוח אינם ניתנים לעריכה. Save שומר את הערכים שהוזנו ואינו מפעיל Marketing Email. Delete פותח חלון אישור.

---

## 1.4 Delete Client Confirmation

### מטרה
למנוע מחיקה מקרית לפני פעולה סופית.

### מה יש במסך
זהו Modal מעל Client Details ולא יעד ניווט נפרד:
- כותרת **Delete Client**.
- הטקסט **Are you sure you want to delete this client?**
- הבהרה שהפעולה אינה ניתנת לביטול.
- **Cancel**.
- **Delete** אדום.
- Close.

### מה קורה במסך
Cancel או Close סוגרים את ה־Modal ללא שינוי. Delete מאשר מחיקה סופית. אין Undo או Restore.

---

## 1.5 ניווט בין המסכים

```text
Clients
├── Upload PDF
│   └── לאחר העיבוד נשארים ב־Upload PDF
└── Client Details
    ├── Edit → Save / Cancel
    ├── Delete → Delete Confirmation
    └── Back to Clients
```

**Clients** הוא מסך הבית. הניווט הקבוע מאפשר מעבר בין Clients ל־Upload PDF. Client Details נפתח מתוך רשימת הלקוחות.

---

# 2. Guide Style

## 2.1 שפה ואווירה

השפה היא של מערכת SaaS עסקית, מודרנית, נקייה ומקצועית: בסיס לבן ובהיר, Navy כהה למבנה ולניווט ו־Teal/Cyan לפעולות ולמיתוג. יש הרבה whitespace, היררכיה ברורה, Cards בהירים ו־Status badges קלים לסריקה.

## 2.2 Color Palette

| שימוש | HEX |
|---|---|
| Primary / Teal | `#00C8C8` |
| Primary Dark / Navy | `#0F1B3D` |
| Primary Light | `#E6FBFB` |
| Accent | `#B2EBF2` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Info | `#3B82F6` |
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Border | `#E5E7EB` |
| Text Primary | `#0F172A` |
| Text Secondary | `#64748B` |

Navy משמש לניווט וטקסט חזק; Teal לפעולה הראשית; צבעי Success/Warning/Error/Info מיועדים בעיקר לסטטוסים ול־feedback. Delete מובחן באדום.

## 2.3 Typography

הגופן המרכזי: **Inter**.

| סגנון | גודל | משקל |
|---|---:|---|
| H1 | 32px | Bold |
| H2 | 24px | Semibold |
| H3 | 18px | Semibold |
| Subtitle | 16px | Medium |
| Body Large | 16px | Regular |
| Body | 14px | Regular |
| Body Small | 12px | Regular |

טקסט ראשי משתמש ב־`#0F172A`; טקסט משני ו־placeholders ב־`#64748B`.

## 2.4 Buttons

**Primary:** רקע Teal, טקסט לבן, פינות מעוגלות ואפשרות ל־outline icon.  
**Secondary:** רקע לבן/בהיר, border עדין וטקסט Navy/Teal.  
**Destructive:** אדום עם טקסט לבן ורק לפעולות הרסניות.  
יש לשמור מצבי Default, Hover, Pressed ו־Disabled באותה משפחת צבעים.

## 2.5 Inputs, Search ו־Filters

רקע לבן, border דק `#E5E7EB`, פינות מעוגלות וגובה עקבי. Search כולל אייקון זכוכית מגדלת; Dropdown כולל chevron. Placeholder בגוון Secondary. Focus מקבל הדגשת Teal עדינה.

## 2.6 Tables

הטבלה משתמשת ב־Surface לבן, Header בהיר, קווי הפרדה עדינים, padding נוח וטקסט קומפקטי. Statuses מוצגים כ־badges, פעולות נשארות במיקום עקבי ו־Pagination מופיע מתחת לטבלה. אין לצבוע שורות שלמות בצבעים חזקים.

## 2.7 Status Badges

Badges הם pills קטנים:
- Success — ירוק.
- Sent / Info — כחול.
- Manual Review / Warning — Amber.
- Error / Failed — אדום.
- סטטוס ניטרלי — אפור בהיר.

הסטטוס תמיד מופיע גם כטקסט, ולא באמצעות צבע בלבד.

## 2.8 Cards, Panels והודעות

Cards ו־Panels משתמשים ברקע לבן, border עדין, פינות מעוגלות, padding נדיב וצל חלש. הודעות Success/Error משתמשות ברקע צבעוני בהיר מאוד, אייקון מתאים וטקסט ברור.

## 2.9 File Upload

אזור Upload הוא Card גדול עם border מקווקו, פינות מעוגלות, Upload icon, טקסט פעולה מרכזי, Choose PDF File והרבה whitespace. הפעולה צריכה להיות ברורה מיד עם הכניסה למסך.

## 2.10 Icons

Outline icons פשוטים ודקים, בסגנון Lucide: Clients/User, Upload, Search, Back, Edit, Delete, Check, Warning ו־Close. האייקונים עקביים בגודל ומשתמשים ב־Navy, Teal או צבע הסטטוס.

## 2.11 פינות, צורות וצללים

Cards ו־Panels משתמשים בעיקר ב־border radius של כ־`12px`. הצורות הגרפיות רכות ומעוגלות, עם אלמנטים מופשטים בגווני Cyan/Teal. הצללים עדינים, בקירוב:

```css
box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
```

## 2.12 Spacing

המערכת מבוססת על **8px grid** עם ערכים מרכזיים `8px`, `16px`, `24px`, `32px`.

- 8px בין רכיבים קטנים וקשורים.
- 16px בין controls סמוכים או label לתוכן.
- 24px בין קבוצות תוכן.
- 32px ומעלה בין אזורים מרכזיים.
- Cards מקבלים padding ו־whitespace נדיבים.

## 2.13 היררכיה חזותית

סדר החשיבות:
1. כותרת המסך.
2. הפעולה הראשית.
3. התוכן המרכזי — Table, Upload או Client Information.
4. Statuses.
5. פעולות משניות.
6. טקסטי הסבר ו־metadata.

אין להוסיף אלמנטים דקורטיביים שמפריעים לסריקת המידע.

## 2.14 עקרונות UX

- Clients נשאר מסך הבית.
- הניווט קצר ועקבי.
- Upload נגיש וברור.
- בזמן Processing תמיד מוצג feedback.
- Status מזוהה באמצעות טקסט וצבע.
- Delete תמיד דורש Confirmation.
- Error Details מוצג רק כאשר רלוונטי.
- מידע חסר מוצג כ־`NOT Available`.
- אין להוסיף Dashboard, מסכים או פעולות שאינם ב־PRD.
- העיצוב מיועד ל־Desktop Web.
- ממשק האפליקציה באנגלית.

## 2.15 סיכום

**Ordan Cargo Future Clients** משתמשת בשפה עסקית מודרנית: Navy כהה ליציבות ולניווט, Teal/Cyan למיתוג ולפעולות, משטחים לבנים, Inter, Outline Icons, פינות רכות וצללים עדינים. המידע והפעולות העסקיות — Clients, Processing Status, Email Status ו־PDF Upload — נשארים במרכז, ללא עומס חזותי.
