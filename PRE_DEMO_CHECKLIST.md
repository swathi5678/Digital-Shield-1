# Pre-Demo Checklist

## ✅ Before You Run the Demo

### Install Dependencies
```bash
cd server
npm install
cd ../client
npm install
```

### Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Backend should be running on `http://localhost:3001`
Frontend should be running on `http://localhost:5173` (or next available port)

---

## ✅ Demo Flow (5 Minutes)

### 1. Login (30 seconds)
- Use demo credentials (created automatically):
  - Email: `analyst@demo.com`
  - Password: `Shield@2025`
- You'll land on Dashboard

### 2. Navigate to AIE (30 seconds)
- Click **"Authorization Intelligence Engine"** in left sidebar
- You'll see two tabs: **"SoD Detection (NEW)"** and **"Traditional Findings"**
- Make sure **"SoD Detection"** tab is selected (it's the default)

### 3. Download Sample CSVs (1 minute)
- Click blue **"Download Sample CSVs"** button
- Two files will download:
  - `AGR_USERS_sample.csv`
  - `AGR_1251_sample.csv`
- These are realistic data with intentional conflicts

### 4. Upload and Detect (2 minutes)
- Drag-drop `AGR_USERS_sample.csv` to first upload box
- Drag-drop `AGR_1251_sample.csv` to second upload box
- Click **"Run SoD Detection"** (green button)
- Wait for processing (should be instant)
- Results panel appears below with:
  - 📊 Statistics (10 users, 8 roles, 20 tcodes, **7 violations**)
  - 🔴 Severity breakdown cards (Critical, High, Medium counts)
  - 📋 Violations table showing all conflicts
- Click any violation row to see details on the right

### 5. Show Key Details (1.5 minutes)
**Click on a "CRITICAL" severity violation:**
- Highlights the SoD rule that was violated
- Shows which users are affected
- Displays exact remediation suggestion
- Shows the violation type (Direct Assignment / Role-based / Multi-role)

**Point out to interviewer:**
> "See this CRITICAL violation? This customer's Finance_BP role has BOTH 'FB60' (invoice entry) AND 'F110' (payment processing). That violates SOX controls. Our multi-role detection also found that user John_Smith gets these tcodes through DIFFERENT roles, which traditional tools miss."

---

## ✅ Sample Data Included

The sample CSVs have realistic conflicts:

**Finance conflicts:**
- ZFINANCE_BP: FB60 + F110 ❌
- ZFINANCE_ANALYST: FB70 + F110 ❌
- ZFINANCE_MGMT: FK01 + F110 ❌

**Procurement conflicts:**
- ZMATERIALS_MANAGER: ME21N + MIRO ❌
- ZPROCURE_GOODS: MIGO + MIRO ❌

**Sales conflicts:**
- ZSALES_EXEC: VA01 + VF01 ❌

Total: **7 violations detected** (mostly critical/high)

---

## ✅ What the Interviewer Will Notice

### Positive Signals ✅
- "That was fast - instant analysis from CSV"
- "Found violations we'd have to manually search for"
- "The multi-role detection is clever - we didn't think about that"
- "Each violation has an exact fix suggestion"
- "This would have saved us $XXK during our migration"

### Questions They Might Ask
**Q: Can this work with real SAP data?**
A: "Absolutely - any AGR_USERS and AGR_1251 export from ECC or S/4HANA. The sample is just for demo purposes."

**Q: How long does analysis take?**
A: "Sub-second for typical enterprise data (thousands of users). It's all rule-based matching, not ML guessing."

**Q: What about live SAP connectivity?**
A: "Not in v1.0. This is intentional - eliminates implementation barriers. Customers can start immediately. Live connectivity is v2.0."

**Q: Can they customize the rules?**
A: "Yes - the 8 rules included are standard SOX/SAP best practices, but enterprises can add custom rules. That's v2.0 as well."

---

## ✅ If Something Goes Wrong

### Module won't load
- Clear browser cache: `Ctrl+Shift+Delete`
- Make sure backend is running on port 3001
- Check console for errors: `F12` > Console tab

### Upload fails
- Make sure files are CSV format (not Excel)
- Check file sizes aren't huge (>100MB each)
- Check browser console for error details

### No violations found
- You might be using data without conflicts
- Download the sample CSVs again (they have conflicts built in)

---

## ✅ Post-Demo Talking Points

### For Your Interviewer
1. **Speed to market**: "This is v1.0 in 14 hours of development. No live SAP needed."
2. **Clear value**: "Find violations competitors miss. Customers see immediate ROI."
3. **Scalability**: "From 5 customers to enterprise: same engine, repeatable revenue."
4. **Compliance angle**: "Every customer needs SoD remediation before go-live. Annual recurring."

### For the 5 Prospect Customers
> "We built a tool that finds segregation of duties violations from your SAP data in seconds. No system integration, no consulting - just upload your AGR exports and see what violations exist before your migration. Would you try it on your system?"

---

## ✅ Files You Need to Show

**User Documentation:**
- `SOD_DETECTION_GUIDE.md` - Share this with customers

**Technical Documentation:**
- `IMPLEMENTATION_SUMMARY.md` - Technical overview for your interviewer

**Source Code (if asked):**
- Backend: `server/src/services/sod.service.ts`
- Frontend: `client/src/components/modules/SoDUploadComponent.tsx`
- Routes: `server/src/routes/aie.routes.ts`

---

## ✅ Success Criteria for Product-Market Fit

During demo with 5 customers, you need:
- ✅ 3+ say "We didn't know we had these violations"
- ✅ 4+ want to try with real data after seeing samples
- ✅ 2+ ask about buying / pricing
- ✅ 1+ becomes reference account

**If you hit those numbers = Product-Market Fit Signal = Interviewer will be impressed**

---

**You're all set! Go show them what you built.** 🚀
