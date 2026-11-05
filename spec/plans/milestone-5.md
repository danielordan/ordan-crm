# תוכנית — Milestone 5: Deployment Readiness & Development Verification

מקורות: `MILESTONES.md` (Milestone 5), ARCHITECTURE סעיפים 15.2 ו-21, ADR-32, והקוד הקיים. הדחיפה והמעבר ל-Production עברו לבקשת המשתמש ל-Milestone 6 (`milestone-6.md`).

## 1. הכנת הקוד (כבר נבנה)
- `backend/vercel.json`, ונעילת Node.js ל-`24.x`.
- `PORT` ב-`main.ts`, רק ב-Production, ו-Pool של 2 חיבורים כש-`NODE_ENV` הוא `production`.
- טעינה מפורשת של ה-worker של PDF.js.
- `npm run db:migrate:prod`, עם unit tests. לא רץ על Production ב-Milestone זה.
- README, `CLAUDE.md` ו-ADR-32.

## 2. בדיקת סביבת Development
1. `npm run db:migrate`, מול Development בלבד.
2. `npm run lint`, `npm run format:check`, `npm test`, ובניית שתי האפליקציות.
3. `npm run dev`, ובדיקת `/health`, ה-401 בלי מפתח, ההפניה ל-`/sign-in` ומסך הכניסה.
4. המשתמש בודק בעצמו את הזרימות אחרי כניסה עם Google, כי Claude לא נכנס עם החשבון שלו.

## 3. גבולות
אין Commit, אין Push, אין פריסה ואין גישה ל-`ordan-prod`.
