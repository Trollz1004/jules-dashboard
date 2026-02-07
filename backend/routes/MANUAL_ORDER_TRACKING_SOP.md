# OPUS Trust - Manual Order Tracking
## Standard Operating Procedure (SOP)

**Document Version:** 1.0
**Effective Date:** January 2026
**Last Updated:** January 17, 2026
**Owner:** Operations Team

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Daily Tracking Routine](#2-daily-tracking-routine)
3. [Spreadsheet Template & Setup](#3-spreadsheet-template--setup)
4. [Badge Number Assignment System](#4-badge-number-assignment-system)
5. [Customer Communication Templates](#5-customer-communication-templates)
6. [Troubleshooting & Edge Cases](#6-troubleshooting--edge-cases)
7. [Appendix](#7-appendix)

---

## 1. OVERVIEW

### Purpose
This SOP provides step-by-step procedures for manually tracking Founding Member orders until automated webhook processing is fully operational. This ensures no customer is missed and all badge assignments are properly recorded.

### Scope
- Applies to all Founding Member Tier purchases (FM001 - FM100)
- Covers Square Dashboard transactions
- Pricing: $14.99/month locked for life

### Key Information
| Item | Value |
|------|-------|
| Product | OPUS Trust Founding Membership |
| Price | $14.99/month (locked for life) |
| Badge Range | FM001 - FM100 |
| Total Available | 100 spots |
| Payment Processor | Square |

---

## 2. DAILY TRACKING ROUTINE

### 2.1 Morning Routine (Recommended: 9:00 AM)

#### Step 1: Log into Square Dashboard
1. Navigate to: https://squareup.com/dashboard
2. Sign in with authorized credentials
3. Verify you are viewing the correct business account

#### Step 2: Navigate to Transactions
1. Click **"Transactions"** in the left sidebar
2. Or navigate to: **Sales > Transactions**
3. Set date filter to **"Last 24 hours"** or **"Yesterday"**

#### Step 3: Filter for Founding Member Purchases
1. Use search/filter to find transactions containing:
   - "Founding Member"
   - "OPUS Trust"
   - Amount: $14.99
2. Note: First payment may include setup fees - verify product name

#### Step 4: Export Transaction Data
1. Click **"Export"** button (top right of transactions list)
2. Select format: **CSV**
3. Date range: Previous day or since last export
4. Save file with naming convention: `OPUS_Transactions_YYYY-MM-DD.csv`
5. Store in designated folder: `/Operations/Daily_Exports/`

#### Step 5: Update Master Tracking Spreadsheet
1. Open the Master Tracking Spreadsheet (see Section 3)
2. For each NEW transaction:
   - Add new row with all required fields
   - Assign next available badge number
   - Set initial status to "PENDING_WELCOME"
3. Save spreadsheet with timestamp

#### Step 6: Send Customer Communications
1. Review all entries with status "PENDING_WELCOME"
2. Send Welcome Email (Template A - see Section 5.1)
3. Update status to "WELCOME_SENT"
4. After badge assignment confirmation, send Badge Notification (Template B)
5. Update status to "BADGE_ASSIGNED"

#### Step 7: Daily Summary
1. Note total new sign-ups for the day
2. Update remaining spots counter
3. Flag any issues for follow-up

---

### 2.2 Evening Check (Recommended: 5:00 PM)

1. Quick review of any afternoon transactions
2. Repeat Steps 2-6 for any missed orders
3. Verify all statuses are updated
4. Prepare summary if needed for team

---

### 2.3 Weekly Reconciliation (Recommended: Monday Morning)

1. Export full week of transactions
2. Cross-reference with Master Spreadsheet
3. Verify badge number sequence has no gaps
4. Check for any duplicate entries
5. Confirm all customers received communications
6. Update weekly metrics report

---

## 3. SPREADSHEET TEMPLATE & SETUP

### 3.1 Master Tracking Spreadsheet Structure

Create a spreadsheet with the following columns:

| Column | Header | Format | Description |
|--------|--------|--------|-------------|
| A | Date | YYYY-MM-DD | Transaction date |
| B | Time | HH:MM | Transaction time |
| C | Name | Text | Customer full name |
| D | Email | Text | Customer email address |
| E | Amount | Currency | Transaction amount ($14.99) |
| F | Badge# | FM### | Assigned badge number |
| G | Status | Dropdown | Current processing status |
| H | Square ID | Text | Square transaction ID |
| I | Notes | Text | Additional notes |
| J | Welcome Sent | Date | Date welcome email sent |
| K | Badge Sent | Date | Date badge notification sent |

### 3.2 Status Values (Column G)

Create a dropdown with these values:

| Status | Meaning |
|--------|---------|
| NEW | Just imported, not processed |
| PENDING_WELCOME | Ready to send welcome email |
| WELCOME_SENT | Welcome email delivered |
| PENDING_BADGE | Ready to assign/notify badge |
| BADGE_ASSIGNED | Badge assigned and customer notified |
| ACTIVE | Fully onboarded member |
| ISSUE | Problem requiring attention |
| REFUNDED | Customer requested refund |
| CANCELLED | Subscription cancelled |

### 3.3 Spreadsheet Setup Instructions

#### Option A: Google Sheets
1. Create new Google Sheet named: `OPUS_Trust_Founding_Members_Master`
2. Share with team members (Editor access)
3. Enable version history
4. Create the columns as specified above

#### Option B: Excel Online
1. Create new Excel file in SharePoint/OneDrive
2. Name: `OPUS_Trust_Founding_Members_Master.xlsx`
3. Share with team
4. Enable AutoSave

### 3.4 Sample Data Row

```
| Date       | Time  | Name         | Email              | Amount | Badge# | Status        | Square ID      | Notes              | Welcome Sent | Badge Sent |
|------------|-------|--------------|-------------------|--------|--------|---------------|----------------|--------------------|--------------|------------|
| 2026-01-17 | 10:23 | John Smith   | john@email.com    | $14.99 | FM001  | BADGE_ASSIGNED| sq_abc123xyz   | First founder!     | 2026-01-17   | 2026-01-17 |
| 2026-01-17 | 14:45 | Jane Doe     | jane@email.com    | $14.99 | FM002  | WELCOME_SENT  | sq_def456uvw   |                    | 2026-01-17   |            |
```

### 3.5 Conditional Formatting Recommendations

Apply these color codes for Status column:
- **NEW** - Yellow background
- **PENDING_*** - Orange background
- **WELCOME_SENT** - Light blue background
- **BADGE_ASSIGNED** - Light green background
- **ACTIVE** - Green background
- **ISSUE** - Red background
- **REFUNDED/CANCELLED** - Gray background

---

## 4. BADGE NUMBER ASSIGNMENT SYSTEM

### 4.1 Badge Number Format

```
FM### where ### = 001 to 100

Examples:
- FM001 (First founding member)
- FM025 (Twenty-fifth founding member)
- FM100 (Last founding member spot)
```

### 4.2 Sequential Assignment Rules

**CRITICAL: Badge numbers are assigned in order of PAYMENT CONFIRMATION, not sign-up intent.**

#### Assignment Process:
1. When a new paid transaction is confirmed in Square:
   - Check the Master Spreadsheet for the highest assigned badge number
   - Assign the next sequential number
   - There should be NO gaps in the sequence

2. Example sequence:
   ```
   Current highest assigned: FM047
   New customer pays: Assign FM048
   Next customer pays: Assign FM049
   ```

#### Rules:
- Never skip numbers
- Never reassign a number (even if customer cancels)
- Never reserve numbers in advance
- First paid = first badge number

### 4.3 Tracking Remaining Spots

#### Quick Calculation:
```
Remaining Spots = 100 - [Highest Assigned Badge Number]

Example:
Highest assigned: FM023
Remaining: 100 - 23 = 77 spots available
```

#### Dashboard View (Add to Spreadsheet):

Create a summary section at the top of your spreadsheet:

| Metric | Formula | Current Value |
|--------|---------|---------------|
| Total Spots | 100 | 100 |
| Assigned | =COUNTA(F:F)-1 | (auto-calculated) |
| Remaining | =100-COUNTA(F:F)+1 | (auto-calculated) |
| Last Assigned | =MAX(F:F) | (shows latest badge) |

**Google Sheets Formula Examples:**
```
Cell B2 (Assigned): =COUNTA(F2:F)-1
Cell B3 (Remaining): =100-(COUNTA(F2:F)-1)
Cell B4 (Last Badge): =IF(COUNTA(F2:F)=0,"None",INDEX(F2:F,COUNTA(F2:F)))
```

### 4.4 Edge Cases

#### Scenario: Customer Refunds/Cancels
- Do NOT reassign their badge number
- Mark their row status as "REFUNDED" or "CANCELLED"
- Their badge number is permanently retired
- Note: This is a business decision - founding member numbers are permanent

#### Scenario: Duplicate Transaction
- Verify with Square if charge went through once or twice
- If duplicate charge: Process refund for duplicate
- Keep only one badge assignment

#### Scenario: Payment Failed After Assignment
- If badge was communicated before payment confirmed: Contact customer
- Mark as "ISSUE" until resolved
- Do not reassign number until confirmed failed

---

## 5. CUSTOMER COMMUNICATION TEMPLATES

### 5.1 Welcome Message (Template A)

**Use:** Immediately after payment confirmation, before badge assignment

**Subject Line:** Welcome to OPUS Trust - You're In!

```
Hi [FIRST_NAME],

Welcome to OPUS Trust!

Your founding membership is now active. You've secured one of only 100
founding member spots at $14.99/month - locked in for life.

Here's what happens next:

1. Your exclusive Founding Member badge (FM###) will be assigned within
   24 hours and you'll receive a separate email with your badge number.

2. You'll get early access to the platform before our public launch.

3. Your $14.99/month rate is now locked in permanently - even when the
   price increases to $19.99/month for new members.

What makes OPUS Trust different:
- Every profile is human-verified (real video verification)
- Zero tolerance for bots or catfish
- A community of real people seeking genuine connections

If you have any questions, simply reply to this email.

Welcome to the founding team!

The OPUS Trust Team

---
Transaction Details:
Date: [DATE]
Amount: $14.99
Membership: Founding Member (Lifetime Rate Lock)
```

### 5.2 Badge Assignment Notification (Template B)

**Use:** After badge number is assigned in system

**Subject Line:** Your Founding Member Badge: FM[###]

```
Hi [FIRST_NAME],

Your exclusive Founding Member badge has been assigned!

============================================
     YOUR BADGE NUMBER: FM[###]
============================================

You are founding member #[NUMBER] of 100.

This badge will be permanently displayed on your profile, showing that
you were among the original founders of OPUS Trust. It can never be
taken away or reassigned.

What your badge means:
- You're part of the original 100 founders
- Your $14.99/month rate is locked forever
- You helped build this community from day one
- Other members will see you trusted the platform early

Badge numbers are assigned in order of sign-up, so FM[###] means you
were the [NUMBER][ORDINAL] person to join as a founder.

Next Steps:
- Watch your inbox for platform access details
- We're putting finishing touches on the app
- You'll be among the first to create your verified profile

Questions? Reply to this email anytime.

Thank you for believing in what we're building.

The OPUS Trust Team
```

### 5.3 Quick Reference - Email Variables

| Variable | Replace With | Example |
|----------|--------------|---------|
| [FIRST_NAME] | Customer's first name | John |
| [DATE] | Transaction date | January 17, 2026 |
| FM[###] | Full badge number | FM023 |
| [NUMBER] | Numeric badge number | 23 |
| [ORDINAL] | Ordinal suffix | rd (for 23rd) |

**Ordinal Suffixes:**
- 1, 21, 31... = st (1st, 21st)
- 2, 22, 32... = nd (2nd, 22nd)
- 3, 23, 33... = rd (3rd, 23rd)
- Everything else = th (4th, 5th, 11th, 12th, 13th, etc.)

---

## 6. TROUBLESHOOTING & EDGE CASES

### 6.1 Common Issues

| Issue | Solution |
|-------|----------|
| Can't find transaction in Square | Check date range; verify correct account; check "All Payments" view |
| Customer says they paid but no record | Ask for confirmation email; check spam filter; verify email/name spelling |
| Duplicate customer entries | Merge records; keep earliest badge number; note in comments |
| Customer wants different badge number | Explain sequential assignment policy; badge numbers cannot be changed |
| Transaction shows but email bounced | Contact via alternate method; update email; resend communications |
| Square export missing data | Try different date range; check export settings; contact Square support |

### 6.2 Escalation Path

1. **Level 1:** Operations team handles standard processing
2. **Level 2:** Team lead for policy questions
3. **Level 3:** Management for refunds over $50 or PR-sensitive issues

### 6.3 Data Backup Protocol

- Export spreadsheet daily (end of day)
- Keep backups for minimum 30 days
- Store in designated backup folder: `/Operations/Backups/`
- Naming: `OPUS_Master_Backup_YYYY-MM-DD.csv`

---

## 7. APPENDIX

### 7.1 Quick Daily Checklist

```
[ ] Log into Square Dashboard
[ ] Set date filter to last 24 hours
[ ] Export new transactions to CSV
[ ] Open Master Tracking Spreadsheet
[ ] Add new entries with all fields
[ ] Assign sequential badge numbers
[ ] Send welcome emails (Template A)
[ ] Update status to WELCOME_SENT
[ ] Send badge notifications (Template B)
[ ] Update status to BADGE_ASSIGNED
[ ] Update remaining spots counter
[ ] Save and backup spreadsheet
[ ] Note any issues for follow-up
```

### 7.2 Key URLs

| Resource | URL |
|----------|-----|
| Square Dashboard | https://squareup.com/dashboard |
| Square Transactions | https://squareup.com/dashboard/sales/transactions |
| Master Spreadsheet | [INSERT YOUR SPREADSHEET URL] |
| Backup Folder | [INSERT YOUR BACKUP FOLDER PATH] |

### 7.3 Contact Information

| Role | Name | Contact |
|------|------|---------|
| Operations Lead | [NAME] | [EMAIL] |
| Technical Support | [NAME] | [EMAIL] |
| Customer Service | [NAME] | [EMAIL] |

### 7.4 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | Operations | Initial SOP creation |

---

## QUICK START SUMMARY

**If you only have 5 minutes, do this:**

1. Log into Square, export last 24 hours of transactions
2. For each new $14.99 transaction:
   - Add to spreadsheet
   - Assign next badge number (FM001, FM002, etc.)
   - Send welcome email
   - Send badge notification
   - Mark as BADGE_ASSIGNED
3. Update remaining spots count
4. Save spreadsheet

**Remember:**
- 100 total spots (FM001 - FM100)
- Badge numbers are permanent and sequential
- Never skip or reassign numbers
- Every customer gets both emails

---

*This SOP will be deprecated when automated webhook processing via Square is fully operational.*

**Document Status:** ACTIVE
**Next Review Date:** February 2026
