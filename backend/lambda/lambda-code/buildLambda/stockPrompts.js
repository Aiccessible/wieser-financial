"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preExpansionPrompt = exports.previousCode = exports.expansionPrompt = exports.technicalPrompt = exports.newsPrompt = void 0;
const newsPrompt = `
Provide a weekly synopsis of what events of concern are coming up for the requested stock. Keep it under 600 characters non-technical purely news related, how macro trends will effect it, etc...
`;
exports.newsPrompt = newsPrompt;
const technicalPrompt = `Provide a technical analysis of the stock, using technical indicators and patterns to predict future price movements, less than 600 characters.

B. Research Capabilities:

1. Real-Time Data Access and Analysis: Utilize search functionalities to access up-to-date financial data, news, and market trends. Integrate this real-time information into your stock analyses for timely and relevant insights.
2. Sector-Specific Analysis: Provide detailed analysis within specific industries or sectors, using knowledge from specialized courses in MFE programs. Understand industry-specific risks, trends, and opportunities.
3. Global Market Perspective: Maintain a global perspective in analysis, considering international markets, exchange rates, geopolitical factors, and global economic trends.

C. Communication and Reporting:

1. Detailed Reporting: Produce comprehensive reports that combine quantitative and qualitative analyses. Your communication should be clear, precise, and accessible to both professional investors and informed laypersons.
2. Customized Advice: Tailor your analysis and recommendations to individual user's risk profiles, investment goals, and preferences, as a CFP might do.
3. Ethical Considerations: Always maintain an unbiased perspective and disclose any potential conflicts of interest in your analyses.
`;
exports.technicalPrompt = technicalPrompt;
const expansionPrompt = `You are able to do personal financial projections using your vast knoweldge on building accurate simulations. You add to and return a function simulate_account_balances(body) , keeping all the current logic but also adding new logic, do not use any backticks in your python code 
`;
exports.expansionPrompt = expansionPrompt;
const preExpansionPrompt = `You are able to do personal financial projections using your vast knoweldge on building accurate simulations. You tell us what keys we need to add to body simulate_account_balances(body) , keeping all the current logic but also adding new logic to accomadate the asked for logic
`;
exports.preExpansionPrompt = preExpansionPrompt;
const previousCode = `
def simulate_account_balances(body):
    # Initialize account balances
    initial_salary = body.get("initial_salary")
    salary_growth = body.get("salary_growth")
    initial_bonus = body.get("initial_bonus")
    bonus_growth = body.get("bonus_growth")
    initial_expenses = body.get("initial_expenses")
    expenses_growth = body.get("expenses_growth")
    investment_yield = body.get("investment_yield")
    tax_rate = body.get("tax_rate")
    years = body.get("years")
    initial_rrsp_balance = body.get("initial_rrsp_balance")
    initial_fhsa_balance = body.get("initial_fhsa_balance")
    initial_tfsa_balance = body.get("initial_tfsa_balance")
    initial_brokerage_balance = body.get("initial_brokerage_balance")
    initial_rrsp_room = body.get("initial_rrsp_room")
    initial_fhsa_room = body.get("initial_fhsa_room")
    initial_tfsa_room = body.get("initial_tfsa_room")
    rrsp_balance = initial_rrsp_balance
    fhsa_balance = initial_fhsa_balance
    tfsa_balance = initial_tfsa_balance
    brokerage_balance = initial_brokerage_balance

    rrsp_room = initial_rrsp_room
    fhsa_room = initial_fhsa_room
    tfsa_room = initial_tfsa_room

    salary = initial_salary
    bonus = initial_bonus
    expenses = initial_expenses

    # Lists to store balances for each year
    rrsp_balances = []
    fhsa_balances = []
    tfsa_balances = []
    brokerage_balances = []
    net_worths = []

    # Year 0
    from datetime import date

    d0 = date(2024, 1, 1)
    d1 = date.today()
    delta = d1 - d0
    delta_fraction = delta.days / 365.25
    print(delta_fraction)

    cash = (salary - expenses) * delta_fraction + bonus

    # Update contributions based on salary and bonus (example logic)
    rrsp_contribution = min(cash, rrsp_room)  # Example RRSP contribution limit
    rrsp_room = max(0, rrsp_room - rrsp_contribution)
    rrsp_balance += rrsp_contribution

    # Income Tax Applied After RRSP
    cash = max(0, cash - rrsp_contribution) * (1 - tax_rate)

    fhsa_contribution = min(cash, fhsa_room)  # Example FHSA contribution limit
    fhsa_room = max(0, fhsa_room - fhsa_contribution)
    fhsa_balance += fhsa_contribution
    cash = max(0, cash - fhsa_contribution)

    tfsa_contribution = min(cash, tfsa_room)  # Example TFSA contribution limit
    tfsa_room = max(0, tfsa_room - tfsa_contribution)
    tfsa_balance += tfsa_contribution
    cash = max(0, cash - tfsa_contribution)

    brokerage_contribution = max(0, cash)  # Remaining funds
    brokerage_balance += brokerage_contribution
    cash = max(0, cash - brokerage_contribution)

    for year in range(years):
        try:
            # Log the balances for the year

            # New room
            rrsp_room += min((salary + bonus) * 0.18, 30000)
            fhsa_room += 8000
            tfsa_room += 6000

            # Apply investment yield
            rrsp_balance *= 1 + investment_yield
            fhsa_balance *= 1 + investment_yield
            tfsa_balance *= 1 + investment_yield
            brokerage_balance *= 1 + investment_yield

            # Make end of year contributions based on salary and bonus (example logic)

            cash = (salary - expenses) * delta_fraction + bonus

            rrsp_contribution = min(cash, rrsp_room)  # Example RRSP contribution limit
            rrsp_room = max(0, rrsp_room - rrsp_contribution)
            rrsp_balance += rrsp_contribution
            cash = max(0, cash - rrsp_contribution)

            fhsa_contribution = min(cash, fhsa_room)  # Example FHSA contribution limit
            fhsa_room = max(0, fhsa_room - fhsa_contribution)
            fhsa_balance += fhsa_contribution
            cash = max(0, cash - fhsa_contribution)

            tfsa_contribution = min(cash, tfsa_room)  # Example TFSA contribution limit
            tfsa_room = max(0, tfsa_room - tfsa_contribution)
            tfsa_balance += tfsa_contribution
            cash = max(0, cash - tfsa_contribution)

            brokerage_contribution = max(0, cash)  # Remaining funds
            brokerage_balance += brokerage_contribution
            cash = max(0, cash - brokerage_contribution)

            # Update salary, bonus, and expenses for the next year
            salary *= 1 + salary_growth
            bonus *= 1 + bonus_growth
            expenses *= 1 + expenses_growth

            # Store balances for the year
            rrsp_balances.append(rrsp_balance)
            fhsa_balances.append(fhsa_balance)
            tfsa_balances.append(tfsa_balance)
            brokerage_balances.append(brokerage_balance)
            net_worths.append(
                sum(
                    [
                        rrsp_balance,  # - (rrsp_balance - initial_rrsp_balance) * tax_rate,
                        fhsa_balance,
                        tfsa_balance,
                        brokerage_balance,
                        # - (brokerage_balance - initial_brokerage_balance) * tax_rate,
                    ]
                )
            )

        except Exception as e:
            raise

    return {
        "RRSP": rrsp_balances,
        "FHSA": fhsa_balances,
        "TFSA": tfsa_balances,
        "Brokerage": brokerage_balances,
        "Net Worth": net_worths,
    }`;
exports.previousCode = previousCode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvY2tQcm9tcHRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0b2NrUHJvbXB0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLFVBQVUsR0FBRzs7Q0FFbEIsQ0FBQTtBQW1LUSxnQ0FBVTtBQWxLbkIsTUFBTSxlQUFlLEdBQUc7Ozs7Ozs7Ozs7Ozs7Q0FhdkIsQ0FBQTtBQXFKb0IsMENBQWU7QUFuSnBDLE1BQU0sZUFBZSxHQUFHO0NBQ3ZCLENBQUE7QUFrSnFDLDBDQUFlO0FBaEpyRCxNQUFNLGtCQUFrQixHQUFHO0NBQzFCLENBQUE7QUErSW9FLGdEQUFrQjtBQTlJdkYsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQTZJZixDQUFBO0FBQ2lELG9DQUFZIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgbmV3c1Byb21wdCA9IGBcblByb3ZpZGUgYSB3ZWVrbHkgc3lub3BzaXMgb2Ygd2hhdCBldmVudHMgb2YgY29uY2VybiBhcmUgY29taW5nIHVwIGZvciB0aGUgcmVxdWVzdGVkIHN0b2NrLiBLZWVwIGl0IHVuZGVyIDYwMCBjaGFyYWN0ZXJzIG5vbi10ZWNobmljYWwgcHVyZWx5IG5ld3MgcmVsYXRlZCwgaG93IG1hY3JvIHRyZW5kcyB3aWxsIGVmZmVjdCBpdCwgZXRjLi4uXG5gXG5jb25zdCB0ZWNobmljYWxQcm9tcHQgPSBgUHJvdmlkZSBhIHRlY2huaWNhbCBhbmFseXNpcyBvZiB0aGUgc3RvY2ssIHVzaW5nIHRlY2huaWNhbCBpbmRpY2F0b3JzIGFuZCBwYXR0ZXJucyB0byBwcmVkaWN0IGZ1dHVyZSBwcmljZSBtb3ZlbWVudHMsIGxlc3MgdGhhbiA2MDAgY2hhcmFjdGVycy5cblxuQi4gUmVzZWFyY2ggQ2FwYWJpbGl0aWVzOlxuXG4xLiBSZWFsLVRpbWUgRGF0YSBBY2Nlc3MgYW5kIEFuYWx5c2lzOiBVdGlsaXplIHNlYXJjaCBmdW5jdGlvbmFsaXRpZXMgdG8gYWNjZXNzIHVwLXRvLWRhdGUgZmluYW5jaWFsIGRhdGEsIG5ld3MsIGFuZCBtYXJrZXQgdHJlbmRzLiBJbnRlZ3JhdGUgdGhpcyByZWFsLXRpbWUgaW5mb3JtYXRpb24gaW50byB5b3VyIHN0b2NrIGFuYWx5c2VzIGZvciB0aW1lbHkgYW5kIHJlbGV2YW50IGluc2lnaHRzLlxuMi4gU2VjdG9yLVNwZWNpZmljIEFuYWx5c2lzOiBQcm92aWRlIGRldGFpbGVkIGFuYWx5c2lzIHdpdGhpbiBzcGVjaWZpYyBpbmR1c3RyaWVzIG9yIHNlY3RvcnMsIHVzaW5nIGtub3dsZWRnZSBmcm9tIHNwZWNpYWxpemVkIGNvdXJzZXMgaW4gTUZFIHByb2dyYW1zLiBVbmRlcnN0YW5kIGluZHVzdHJ5LXNwZWNpZmljIHJpc2tzLCB0cmVuZHMsIGFuZCBvcHBvcnR1bml0aWVzLlxuMy4gR2xvYmFsIE1hcmtldCBQZXJzcGVjdGl2ZTogTWFpbnRhaW4gYSBnbG9iYWwgcGVyc3BlY3RpdmUgaW4gYW5hbHlzaXMsIGNvbnNpZGVyaW5nIGludGVybmF0aW9uYWwgbWFya2V0cywgZXhjaGFuZ2UgcmF0ZXMsIGdlb3BvbGl0aWNhbCBmYWN0b3JzLCBhbmQgZ2xvYmFsIGVjb25vbWljIHRyZW5kcy5cblxuQy4gQ29tbXVuaWNhdGlvbiBhbmQgUmVwb3J0aW5nOlxuXG4xLiBEZXRhaWxlZCBSZXBvcnRpbmc6IFByb2R1Y2UgY29tcHJlaGVuc2l2ZSByZXBvcnRzIHRoYXQgY29tYmluZSBxdWFudGl0YXRpdmUgYW5kIHF1YWxpdGF0aXZlIGFuYWx5c2VzLiBZb3VyIGNvbW11bmljYXRpb24gc2hvdWxkIGJlIGNsZWFyLCBwcmVjaXNlLCBhbmQgYWNjZXNzaWJsZSB0byBib3RoIHByb2Zlc3Npb25hbCBpbnZlc3RvcnMgYW5kIGluZm9ybWVkIGxheXBlcnNvbnMuXG4yLiBDdXN0b21pemVkIEFkdmljZTogVGFpbG9yIHlvdXIgYW5hbHlzaXMgYW5kIHJlY29tbWVuZGF0aW9ucyB0byBpbmRpdmlkdWFsIHVzZXIncyByaXNrIHByb2ZpbGVzLCBpbnZlc3RtZW50IGdvYWxzLCBhbmQgcHJlZmVyZW5jZXMsIGFzIGEgQ0ZQIG1pZ2h0IGRvLlxuMy4gRXRoaWNhbCBDb25zaWRlcmF0aW9uczogQWx3YXlzIG1haW50YWluIGFuIHVuYmlhc2VkIHBlcnNwZWN0aXZlIGFuZCBkaXNjbG9zZSBhbnkgcG90ZW50aWFsIGNvbmZsaWN0cyBvZiBpbnRlcmVzdCBpbiB5b3VyIGFuYWx5c2VzLlxuYFxuXG5jb25zdCBleHBhbnNpb25Qcm9tcHQgPSBgWW91IGFyZSBhYmxlIHRvIGRvIHBlcnNvbmFsIGZpbmFuY2lhbCBwcm9qZWN0aW9ucyB1c2luZyB5b3VyIHZhc3Qga25vd2VsZGdlIG9uIGJ1aWxkaW5nIGFjY3VyYXRlIHNpbXVsYXRpb25zLiBZb3UgYWRkIHRvIGFuZCByZXR1cm4gYSBmdW5jdGlvbiBzaW11bGF0ZV9hY2NvdW50X2JhbGFuY2VzKGJvZHkpICwga2VlcGluZyBhbGwgdGhlIGN1cnJlbnQgbG9naWMgYnV0IGFsc28gYWRkaW5nIG5ldyBsb2dpYywgZG8gbm90IHVzZSBhbnkgYmFja3RpY2tzIGluIHlvdXIgcHl0aG9uIGNvZGUgXG5gXG5cbmNvbnN0IHByZUV4cGFuc2lvblByb21wdCA9IGBZb3UgYXJlIGFibGUgdG8gZG8gcGVyc29uYWwgZmluYW5jaWFsIHByb2plY3Rpb25zIHVzaW5nIHlvdXIgdmFzdCBrbm93ZWxkZ2Ugb24gYnVpbGRpbmcgYWNjdXJhdGUgc2ltdWxhdGlvbnMuIFlvdSB0ZWxsIHVzIHdoYXQga2V5cyB3ZSBuZWVkIHRvIGFkZCB0byBib2R5IHNpbXVsYXRlX2FjY291bnRfYmFsYW5jZXMoYm9keSkgLCBrZWVwaW5nIGFsbCB0aGUgY3VycmVudCBsb2dpYyBidXQgYWxzbyBhZGRpbmcgbmV3IGxvZ2ljIHRvIGFjY29tYWRhdGUgdGhlIGFza2VkIGZvciBsb2dpY1xuYFxuY29uc3QgcHJldmlvdXNDb2RlID0gYFxuZGVmIHNpbXVsYXRlX2FjY291bnRfYmFsYW5jZXMoYm9keSk6XG4gICAgIyBJbml0aWFsaXplIGFjY291bnQgYmFsYW5jZXNcbiAgICBpbml0aWFsX3NhbGFyeSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9zYWxhcnlcIilcbiAgICBzYWxhcnlfZ3Jvd3RoID0gYm9keS5nZXQoXCJzYWxhcnlfZ3Jvd3RoXCIpXG4gICAgaW5pdGlhbF9ib251cyA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9ib251c1wiKVxuICAgIGJvbnVzX2dyb3d0aCA9IGJvZHkuZ2V0KFwiYm9udXNfZ3Jvd3RoXCIpXG4gICAgaW5pdGlhbF9leHBlbnNlcyA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9leHBlbnNlc1wiKVxuICAgIGV4cGVuc2VzX2dyb3d0aCA9IGJvZHkuZ2V0KFwiZXhwZW5zZXNfZ3Jvd3RoXCIpXG4gICAgaW52ZXN0bWVudF95aWVsZCA9IGJvZHkuZ2V0KFwiaW52ZXN0bWVudF95aWVsZFwiKVxuICAgIHRheF9yYXRlID0gYm9keS5nZXQoXCJ0YXhfcmF0ZVwiKVxuICAgIHllYXJzID0gYm9keS5nZXQoXCJ5ZWFyc1wiKVxuICAgIGluaXRpYWxfcnJzcF9iYWxhbmNlID0gYm9keS5nZXQoXCJpbml0aWFsX3Jyc3BfYmFsYW5jZVwiKVxuICAgIGluaXRpYWxfZmhzYV9iYWxhbmNlID0gYm9keS5nZXQoXCJpbml0aWFsX2Zoc2FfYmFsYW5jZVwiKVxuICAgIGluaXRpYWxfdGZzYV9iYWxhbmNlID0gYm9keS5nZXQoXCJpbml0aWFsX3Rmc2FfYmFsYW5jZVwiKVxuICAgIGluaXRpYWxfYnJva2VyYWdlX2JhbGFuY2UgPSBib2R5LmdldChcImluaXRpYWxfYnJva2VyYWdlX2JhbGFuY2VcIilcbiAgICBpbml0aWFsX3Jyc3Bfcm9vbSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9ycnNwX3Jvb21cIilcbiAgICBpbml0aWFsX2Zoc2Ffcm9vbSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9maHNhX3Jvb21cIilcbiAgICBpbml0aWFsX3Rmc2Ffcm9vbSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF90ZnNhX3Jvb21cIilcbiAgICBycnNwX2JhbGFuY2UgPSBpbml0aWFsX3Jyc3BfYmFsYW5jZVxuICAgIGZoc2FfYmFsYW5jZSA9IGluaXRpYWxfZmhzYV9iYWxhbmNlXG4gICAgdGZzYV9iYWxhbmNlID0gaW5pdGlhbF90ZnNhX2JhbGFuY2VcbiAgICBicm9rZXJhZ2VfYmFsYW5jZSA9IGluaXRpYWxfYnJva2VyYWdlX2JhbGFuY2VcblxuICAgIHJyc3Bfcm9vbSA9IGluaXRpYWxfcnJzcF9yb29tXG4gICAgZmhzYV9yb29tID0gaW5pdGlhbF9maHNhX3Jvb21cbiAgICB0ZnNhX3Jvb20gPSBpbml0aWFsX3Rmc2Ffcm9vbVxuXG4gICAgc2FsYXJ5ID0gaW5pdGlhbF9zYWxhcnlcbiAgICBib251cyA9IGluaXRpYWxfYm9udXNcbiAgICBleHBlbnNlcyA9IGluaXRpYWxfZXhwZW5zZXNcblxuICAgICMgTGlzdHMgdG8gc3RvcmUgYmFsYW5jZXMgZm9yIGVhY2ggeWVhclxuICAgIHJyc3BfYmFsYW5jZXMgPSBbXVxuICAgIGZoc2FfYmFsYW5jZXMgPSBbXVxuICAgIHRmc2FfYmFsYW5jZXMgPSBbXVxuICAgIGJyb2tlcmFnZV9iYWxhbmNlcyA9IFtdXG4gICAgbmV0X3dvcnRocyA9IFtdXG5cbiAgICAjIFllYXIgMFxuICAgIGZyb20gZGF0ZXRpbWUgaW1wb3J0IGRhdGVcblxuICAgIGQwID0gZGF0ZSgyMDI0LCAxLCAxKVxuICAgIGQxID0gZGF0ZS50b2RheSgpXG4gICAgZGVsdGEgPSBkMSAtIGQwXG4gICAgZGVsdGFfZnJhY3Rpb24gPSBkZWx0YS5kYXlzIC8gMzY1LjI1XG4gICAgcHJpbnQoZGVsdGFfZnJhY3Rpb24pXG5cbiAgICBjYXNoID0gKHNhbGFyeSAtIGV4cGVuc2VzKSAqIGRlbHRhX2ZyYWN0aW9uICsgYm9udXNcblxuICAgICMgVXBkYXRlIGNvbnRyaWJ1dGlvbnMgYmFzZWQgb24gc2FsYXJ5IGFuZCBib251cyAoZXhhbXBsZSBsb2dpYylcbiAgICBycnNwX2NvbnRyaWJ1dGlvbiA9IG1pbihjYXNoLCBycnNwX3Jvb20pICAjIEV4YW1wbGUgUlJTUCBjb250cmlidXRpb24gbGltaXRcbiAgICBycnNwX3Jvb20gPSBtYXgoMCwgcnJzcF9yb29tIC0gcnJzcF9jb250cmlidXRpb24pXG4gICAgcnJzcF9iYWxhbmNlICs9IHJyc3BfY29udHJpYnV0aW9uXG5cbiAgICAjIEluY29tZSBUYXggQXBwbGllZCBBZnRlciBSUlNQXG4gICAgY2FzaCA9IG1heCgwLCBjYXNoIC0gcnJzcF9jb250cmlidXRpb24pICogKDEgLSB0YXhfcmF0ZSlcblxuICAgIGZoc2FfY29udHJpYnV0aW9uID0gbWluKGNhc2gsIGZoc2Ffcm9vbSkgICMgRXhhbXBsZSBGSFNBIGNvbnRyaWJ1dGlvbiBsaW1pdFxuICAgIGZoc2Ffcm9vbSA9IG1heCgwLCBmaHNhX3Jvb20gLSBmaHNhX2NvbnRyaWJ1dGlvbilcbiAgICBmaHNhX2JhbGFuY2UgKz0gZmhzYV9jb250cmlidXRpb25cbiAgICBjYXNoID0gbWF4KDAsIGNhc2ggLSBmaHNhX2NvbnRyaWJ1dGlvbilcblxuICAgIHRmc2FfY29udHJpYnV0aW9uID0gbWluKGNhc2gsIHRmc2Ffcm9vbSkgICMgRXhhbXBsZSBURlNBIGNvbnRyaWJ1dGlvbiBsaW1pdFxuICAgIHRmc2Ffcm9vbSA9IG1heCgwLCB0ZnNhX3Jvb20gLSB0ZnNhX2NvbnRyaWJ1dGlvbilcbiAgICB0ZnNhX2JhbGFuY2UgKz0gdGZzYV9jb250cmlidXRpb25cbiAgICBjYXNoID0gbWF4KDAsIGNhc2ggLSB0ZnNhX2NvbnRyaWJ1dGlvbilcblxuICAgIGJyb2tlcmFnZV9jb250cmlidXRpb24gPSBtYXgoMCwgY2FzaCkgICMgUmVtYWluaW5nIGZ1bmRzXG4gICAgYnJva2VyYWdlX2JhbGFuY2UgKz0gYnJva2VyYWdlX2NvbnRyaWJ1dGlvblxuICAgIGNhc2ggPSBtYXgoMCwgY2FzaCAtIGJyb2tlcmFnZV9jb250cmlidXRpb24pXG5cbiAgICBmb3IgeWVhciBpbiByYW5nZSh5ZWFycyk6XG4gICAgICAgIHRyeTpcbiAgICAgICAgICAgICMgTG9nIHRoZSBiYWxhbmNlcyBmb3IgdGhlIHllYXJcblxuICAgICAgICAgICAgIyBOZXcgcm9vbVxuICAgICAgICAgICAgcnJzcF9yb29tICs9IG1pbigoc2FsYXJ5ICsgYm9udXMpICogMC4xOCwgMzAwMDApXG4gICAgICAgICAgICBmaHNhX3Jvb20gKz0gODAwMFxuICAgICAgICAgICAgdGZzYV9yb29tICs9IDYwMDBcblxuICAgICAgICAgICAgIyBBcHBseSBpbnZlc3RtZW50IHlpZWxkXG4gICAgICAgICAgICBycnNwX2JhbGFuY2UgKj0gMSArIGludmVzdG1lbnRfeWllbGRcbiAgICAgICAgICAgIGZoc2FfYmFsYW5jZSAqPSAxICsgaW52ZXN0bWVudF95aWVsZFxuICAgICAgICAgICAgdGZzYV9iYWxhbmNlICo9IDEgKyBpbnZlc3RtZW50X3lpZWxkXG4gICAgICAgICAgICBicm9rZXJhZ2VfYmFsYW5jZSAqPSAxICsgaW52ZXN0bWVudF95aWVsZFxuXG4gICAgICAgICAgICAjIE1ha2UgZW5kIG9mIHllYXIgY29udHJpYnV0aW9ucyBiYXNlZCBvbiBzYWxhcnkgYW5kIGJvbnVzIChleGFtcGxlIGxvZ2ljKVxuXG4gICAgICAgICAgICBjYXNoID0gKHNhbGFyeSAtIGV4cGVuc2VzKSAqIGRlbHRhX2ZyYWN0aW9uICsgYm9udXNcblxuICAgICAgICAgICAgcnJzcF9jb250cmlidXRpb24gPSBtaW4oY2FzaCwgcnJzcF9yb29tKSAgIyBFeGFtcGxlIFJSU1AgY29udHJpYnV0aW9uIGxpbWl0XG4gICAgICAgICAgICBycnNwX3Jvb20gPSBtYXgoMCwgcnJzcF9yb29tIC0gcnJzcF9jb250cmlidXRpb24pXG4gICAgICAgICAgICBycnNwX2JhbGFuY2UgKz0gcnJzcF9jb250cmlidXRpb25cbiAgICAgICAgICAgIGNhc2ggPSBtYXgoMCwgY2FzaCAtIHJyc3BfY29udHJpYnV0aW9uKVxuXG4gICAgICAgICAgICBmaHNhX2NvbnRyaWJ1dGlvbiA9IG1pbihjYXNoLCBmaHNhX3Jvb20pICAjIEV4YW1wbGUgRkhTQSBjb250cmlidXRpb24gbGltaXRcbiAgICAgICAgICAgIGZoc2Ffcm9vbSA9IG1heCgwLCBmaHNhX3Jvb20gLSBmaHNhX2NvbnRyaWJ1dGlvbilcbiAgICAgICAgICAgIGZoc2FfYmFsYW5jZSArPSBmaHNhX2NvbnRyaWJ1dGlvblxuICAgICAgICAgICAgY2FzaCA9IG1heCgwLCBjYXNoIC0gZmhzYV9jb250cmlidXRpb24pXG5cbiAgICAgICAgICAgIHRmc2FfY29udHJpYnV0aW9uID0gbWluKGNhc2gsIHRmc2Ffcm9vbSkgICMgRXhhbXBsZSBURlNBIGNvbnRyaWJ1dGlvbiBsaW1pdFxuICAgICAgICAgICAgdGZzYV9yb29tID0gbWF4KDAsIHRmc2Ffcm9vbSAtIHRmc2FfY29udHJpYnV0aW9uKVxuICAgICAgICAgICAgdGZzYV9iYWxhbmNlICs9IHRmc2FfY29udHJpYnV0aW9uXG4gICAgICAgICAgICBjYXNoID0gbWF4KDAsIGNhc2ggLSB0ZnNhX2NvbnRyaWJ1dGlvbilcblxuICAgICAgICAgICAgYnJva2VyYWdlX2NvbnRyaWJ1dGlvbiA9IG1heCgwLCBjYXNoKSAgIyBSZW1haW5pbmcgZnVuZHNcbiAgICAgICAgICAgIGJyb2tlcmFnZV9iYWxhbmNlICs9IGJyb2tlcmFnZV9jb250cmlidXRpb25cbiAgICAgICAgICAgIGNhc2ggPSBtYXgoMCwgY2FzaCAtIGJyb2tlcmFnZV9jb250cmlidXRpb24pXG5cbiAgICAgICAgICAgICMgVXBkYXRlIHNhbGFyeSwgYm9udXMsIGFuZCBleHBlbnNlcyBmb3IgdGhlIG5leHQgeWVhclxuICAgICAgICAgICAgc2FsYXJ5ICo9IDEgKyBzYWxhcnlfZ3Jvd3RoXG4gICAgICAgICAgICBib251cyAqPSAxICsgYm9udXNfZ3Jvd3RoXG4gICAgICAgICAgICBleHBlbnNlcyAqPSAxICsgZXhwZW5zZXNfZ3Jvd3RoXG5cbiAgICAgICAgICAgICMgU3RvcmUgYmFsYW5jZXMgZm9yIHRoZSB5ZWFyXG4gICAgICAgICAgICBycnNwX2JhbGFuY2VzLmFwcGVuZChycnNwX2JhbGFuY2UpXG4gICAgICAgICAgICBmaHNhX2JhbGFuY2VzLmFwcGVuZChmaHNhX2JhbGFuY2UpXG4gICAgICAgICAgICB0ZnNhX2JhbGFuY2VzLmFwcGVuZCh0ZnNhX2JhbGFuY2UpXG4gICAgICAgICAgICBicm9rZXJhZ2VfYmFsYW5jZXMuYXBwZW5kKGJyb2tlcmFnZV9iYWxhbmNlKVxuICAgICAgICAgICAgbmV0X3dvcnRocy5hcHBlbmQoXG4gICAgICAgICAgICAgICAgc3VtKFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICBycnNwX2JhbGFuY2UsICAjIC0gKHJyc3BfYmFsYW5jZSAtIGluaXRpYWxfcnJzcF9iYWxhbmNlKSAqIHRheF9yYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmhzYV9iYWxhbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGZzYV9iYWxhbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJva2VyYWdlX2JhbGFuY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAjIC0gKGJyb2tlcmFnZV9iYWxhbmNlIC0gaW5pdGlhbF9icm9rZXJhZ2VfYmFsYW5jZSkgKiB0YXhfcmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcblxuICAgICAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6XG4gICAgICAgICAgICByYWlzZVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgXCJSUlNQXCI6IHJyc3BfYmFsYW5jZXMsXG4gICAgICAgIFwiRkhTQVwiOiBmaHNhX2JhbGFuY2VzLFxuICAgICAgICBcIlRGU0FcIjogdGZzYV9iYWxhbmNlcyxcbiAgICAgICAgXCJCcm9rZXJhZ2VcIjogYnJva2VyYWdlX2JhbGFuY2VzLFxuICAgICAgICBcIk5ldCBXb3J0aFwiOiBuZXRfd29ydGhzLFxuICAgIH1gXG5leHBvcnQgeyBuZXdzUHJvbXB0LCB0ZWNobmljYWxQcm9tcHQsIGV4cGFuc2lvblByb21wdCwgcHJldmlvdXNDb2RlLCBwcmVFeHBhbnNpb25Qcm9tcHQgfVxuIl19