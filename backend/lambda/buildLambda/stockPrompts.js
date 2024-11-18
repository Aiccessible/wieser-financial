"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previousCode = exports.expansionPrompt = exports.technicalPrompt = exports.newsPrompt = void 0;
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
const expansionPrompt = `You are able to do personal financial projections using your vast knoweldge on building accurate simulations. You add to and return a function simulate_account_balances(body) , keeping all the current logic but also adding new logic 
`;
exports.expansionPrompt = expansionPrompt;
const previousCode = `
from typing import Dict, List

def simulate_account_balances(body) -> Dict[str, List[float]]:
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvY2tQcm9tcHRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0b2NrUHJvbXB0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFNLFVBQVUsR0FBRzs7Q0FFbEIsQ0FBQTtBQW1LUSxnQ0FBVTtBQWxLbkIsTUFBTSxlQUFlLEdBQUc7Ozs7Ozs7Ozs7Ozs7Q0FhdkIsQ0FBQTtBQXFKb0IsMENBQWU7QUFuSnBDLE1BQU0sZUFBZSxHQUFHO0NBQ3ZCLENBQUE7QUFrSnFDLDBDQUFlO0FBaEpyRCxNQUFNLFlBQVksR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUErSWYsQ0FBQTtBQUNpRCxvQ0FBWSIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IG5ld3NQcm9tcHQgPSBgXG5Qcm92aWRlIGEgd2Vla2x5IHN5bm9wc2lzIG9mIHdoYXQgZXZlbnRzIG9mIGNvbmNlcm4gYXJlIGNvbWluZyB1cCBmb3IgdGhlIHJlcXVlc3RlZCBzdG9jay4gS2VlcCBpdCB1bmRlciA2MDAgY2hhcmFjdGVycyBub24tdGVjaG5pY2FsIHB1cmVseSBuZXdzIHJlbGF0ZWQsIGhvdyBtYWNybyB0cmVuZHMgd2lsbCBlZmZlY3QgaXQsIGV0Yy4uLlxuYFxuY29uc3QgdGVjaG5pY2FsUHJvbXB0ID0gYFByb3ZpZGUgYSB0ZWNobmljYWwgYW5hbHlzaXMgb2YgdGhlIHN0b2NrLCB1c2luZyB0ZWNobmljYWwgaW5kaWNhdG9ycyBhbmQgcGF0dGVybnMgdG8gcHJlZGljdCBmdXR1cmUgcHJpY2UgbW92ZW1lbnRzLCBsZXNzIHRoYW4gNjAwIGNoYXJhY3RlcnMuXG5cbkIuIFJlc2VhcmNoIENhcGFiaWxpdGllczpcblxuMS4gUmVhbC1UaW1lIERhdGEgQWNjZXNzIGFuZCBBbmFseXNpczogVXRpbGl6ZSBzZWFyY2ggZnVuY3Rpb25hbGl0aWVzIHRvIGFjY2VzcyB1cC10by1kYXRlIGZpbmFuY2lhbCBkYXRhLCBuZXdzLCBhbmQgbWFya2V0IHRyZW5kcy4gSW50ZWdyYXRlIHRoaXMgcmVhbC10aW1lIGluZm9ybWF0aW9uIGludG8geW91ciBzdG9jayBhbmFseXNlcyBmb3IgdGltZWx5IGFuZCByZWxldmFudCBpbnNpZ2h0cy5cbjIuIFNlY3Rvci1TcGVjaWZpYyBBbmFseXNpczogUHJvdmlkZSBkZXRhaWxlZCBhbmFseXNpcyB3aXRoaW4gc3BlY2lmaWMgaW5kdXN0cmllcyBvciBzZWN0b3JzLCB1c2luZyBrbm93bGVkZ2UgZnJvbSBzcGVjaWFsaXplZCBjb3Vyc2VzIGluIE1GRSBwcm9ncmFtcy4gVW5kZXJzdGFuZCBpbmR1c3RyeS1zcGVjaWZpYyByaXNrcywgdHJlbmRzLCBhbmQgb3Bwb3J0dW5pdGllcy5cbjMuIEdsb2JhbCBNYXJrZXQgUGVyc3BlY3RpdmU6IE1haW50YWluIGEgZ2xvYmFsIHBlcnNwZWN0aXZlIGluIGFuYWx5c2lzLCBjb25zaWRlcmluZyBpbnRlcm5hdGlvbmFsIG1hcmtldHMsIGV4Y2hhbmdlIHJhdGVzLCBnZW9wb2xpdGljYWwgZmFjdG9ycywgYW5kIGdsb2JhbCBlY29ub21pYyB0cmVuZHMuXG5cbkMuIENvbW11bmljYXRpb24gYW5kIFJlcG9ydGluZzpcblxuMS4gRGV0YWlsZWQgUmVwb3J0aW5nOiBQcm9kdWNlIGNvbXByZWhlbnNpdmUgcmVwb3J0cyB0aGF0IGNvbWJpbmUgcXVhbnRpdGF0aXZlIGFuZCBxdWFsaXRhdGl2ZSBhbmFseXNlcy4gWW91ciBjb21tdW5pY2F0aW9uIHNob3VsZCBiZSBjbGVhciwgcHJlY2lzZSwgYW5kIGFjY2Vzc2libGUgdG8gYm90aCBwcm9mZXNzaW9uYWwgaW52ZXN0b3JzIGFuZCBpbmZvcm1lZCBsYXlwZXJzb25zLlxuMi4gQ3VzdG9taXplZCBBZHZpY2U6IFRhaWxvciB5b3VyIGFuYWx5c2lzIGFuZCByZWNvbW1lbmRhdGlvbnMgdG8gaW5kaXZpZHVhbCB1c2VyJ3MgcmlzayBwcm9maWxlcywgaW52ZXN0bWVudCBnb2FscywgYW5kIHByZWZlcmVuY2VzLCBhcyBhIENGUCBtaWdodCBkby5cbjMuIEV0aGljYWwgQ29uc2lkZXJhdGlvbnM6IEFsd2F5cyBtYWludGFpbiBhbiB1bmJpYXNlZCBwZXJzcGVjdGl2ZSBhbmQgZGlzY2xvc2UgYW55IHBvdGVudGlhbCBjb25mbGljdHMgb2YgaW50ZXJlc3QgaW4geW91ciBhbmFseXNlcy5cbmBcblxuY29uc3QgZXhwYW5zaW9uUHJvbXB0ID0gYFlvdSBhcmUgYWJsZSB0byBkbyBwZXJzb25hbCBmaW5hbmNpYWwgcHJvamVjdGlvbnMgdXNpbmcgeW91ciB2YXN0IGtub3dlbGRnZSBvbiBidWlsZGluZyBhY2N1cmF0ZSBzaW11bGF0aW9ucy4gWW91IGFkZCB0byBhbmQgcmV0dXJuIGEgZnVuY3Rpb24gc2ltdWxhdGVfYWNjb3VudF9iYWxhbmNlcyhib2R5KSAsIGtlZXBpbmcgYWxsIHRoZSBjdXJyZW50IGxvZ2ljIGJ1dCBhbHNvIGFkZGluZyBuZXcgbG9naWMgXG5gXG5cbmNvbnN0IHByZXZpb3VzQ29kZSA9IGBcbmZyb20gdHlwaW5nIGltcG9ydCBEaWN0LCBMaXN0XG5cbmRlZiBzaW11bGF0ZV9hY2NvdW50X2JhbGFuY2VzKGJvZHkpIC0+IERpY3Rbc3RyLCBMaXN0W2Zsb2F0XV06XG4gICAgIyBJbml0aWFsaXplIGFjY291bnQgYmFsYW5jZXNcbiAgICBpbml0aWFsX3NhbGFyeSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9zYWxhcnlcIilcbiAgICBzYWxhcnlfZ3Jvd3RoID0gYm9keS5nZXQoXCJzYWxhcnlfZ3Jvd3RoXCIpXG4gICAgaW5pdGlhbF9ib251cyA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9ib251c1wiKVxuICAgIGJvbnVzX2dyb3d0aCA9IGJvZHkuZ2V0KFwiYm9udXNfZ3Jvd3RoXCIpXG4gICAgaW5pdGlhbF9leHBlbnNlcyA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9leHBlbnNlc1wiKVxuICAgIGV4cGVuc2VzX2dyb3d0aCA9IGJvZHkuZ2V0KFwiZXhwZW5zZXNfZ3Jvd3RoXCIpXG4gICAgaW52ZXN0bWVudF95aWVsZCA9IGJvZHkuZ2V0KFwiaW52ZXN0bWVudF95aWVsZFwiKVxuICAgIHRheF9yYXRlID0gYm9keS5nZXQoXCJ0YXhfcmF0ZVwiKVxuICAgIHllYXJzID0gYm9keS5nZXQoXCJ5ZWFyc1wiKVxuICAgIGluaXRpYWxfcnJzcF9iYWxhbmNlID0gYm9keS5nZXQoXCJpbml0aWFsX3Jyc3BfYmFsYW5jZVwiKVxuICAgIGluaXRpYWxfZmhzYV9iYWxhbmNlID0gYm9keS5nZXQoXCJpbml0aWFsX2Zoc2FfYmFsYW5jZVwiKVxuICAgIGluaXRpYWxfdGZzYV9iYWxhbmNlID0gYm9keS5nZXQoXCJpbml0aWFsX3Rmc2FfYmFsYW5jZVwiKVxuICAgIGluaXRpYWxfYnJva2VyYWdlX2JhbGFuY2UgPSBib2R5LmdldChcImluaXRpYWxfYnJva2VyYWdlX2JhbGFuY2VcIilcbiAgICBpbml0aWFsX3Jyc3Bfcm9vbSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9ycnNwX3Jvb21cIilcbiAgICBpbml0aWFsX2Zoc2Ffcm9vbSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF9maHNhX3Jvb21cIilcbiAgICBpbml0aWFsX3Rmc2Ffcm9vbSA9IGJvZHkuZ2V0KFwiaW5pdGlhbF90ZnNhX3Jvb21cIilcbiAgICBycnNwX2JhbGFuY2UgPSBpbml0aWFsX3Jyc3BfYmFsYW5jZVxuICAgIGZoc2FfYmFsYW5jZSA9IGluaXRpYWxfZmhzYV9iYWxhbmNlXG4gICAgdGZzYV9iYWxhbmNlID0gaW5pdGlhbF90ZnNhX2JhbGFuY2VcbiAgICBicm9rZXJhZ2VfYmFsYW5jZSA9IGluaXRpYWxfYnJva2VyYWdlX2JhbGFuY2VcblxuICAgIHJyc3Bfcm9vbSA9IGluaXRpYWxfcnJzcF9yb29tXG4gICAgZmhzYV9yb29tID0gaW5pdGlhbF9maHNhX3Jvb21cbiAgICB0ZnNhX3Jvb20gPSBpbml0aWFsX3Rmc2Ffcm9vbVxuXG4gICAgc2FsYXJ5ID0gaW5pdGlhbF9zYWxhcnlcbiAgICBib251cyA9IGluaXRpYWxfYm9udXNcbiAgICBleHBlbnNlcyA9IGluaXRpYWxfZXhwZW5zZXNcblxuICAgICMgTGlzdHMgdG8gc3RvcmUgYmFsYW5jZXMgZm9yIGVhY2ggeWVhclxuICAgIHJyc3BfYmFsYW5jZXMgPSBbXVxuICAgIGZoc2FfYmFsYW5jZXMgPSBbXVxuICAgIHRmc2FfYmFsYW5jZXMgPSBbXVxuICAgIGJyb2tlcmFnZV9iYWxhbmNlcyA9IFtdXG4gICAgbmV0X3dvcnRocyA9IFtdXG5cbiAgICAjIFllYXIgMFxuICAgIGZyb20gZGF0ZXRpbWUgaW1wb3J0IGRhdGVcblxuICAgIGQwID0gZGF0ZSgyMDI0LCAxLCAxKVxuICAgIGQxID0gZGF0ZS50b2RheSgpXG4gICAgZGVsdGEgPSBkMSAtIGQwXG4gICAgZGVsdGFfZnJhY3Rpb24gPSBkZWx0YS5kYXlzIC8gMzY1LjI1XG4gICAgcHJpbnQoZGVsdGFfZnJhY3Rpb24pXG5cbiAgICBjYXNoID0gKHNhbGFyeSAtIGV4cGVuc2VzKSAqIGRlbHRhX2ZyYWN0aW9uICsgYm9udXNcblxuICAgICMgVXBkYXRlIGNvbnRyaWJ1dGlvbnMgYmFzZWQgb24gc2FsYXJ5IGFuZCBib251cyAoZXhhbXBsZSBsb2dpYylcbiAgICBycnNwX2NvbnRyaWJ1dGlvbiA9IG1pbihjYXNoLCBycnNwX3Jvb20pICAjIEV4YW1wbGUgUlJTUCBjb250cmlidXRpb24gbGltaXRcbiAgICBycnNwX3Jvb20gPSBtYXgoMCwgcnJzcF9yb29tIC0gcnJzcF9jb250cmlidXRpb24pXG4gICAgcnJzcF9iYWxhbmNlICs9IHJyc3BfY29udHJpYnV0aW9uXG5cbiAgICAjIEluY29tZSBUYXggQXBwbGllZCBBZnRlciBSUlNQXG4gICAgY2FzaCA9IG1heCgwLCBjYXNoIC0gcnJzcF9jb250cmlidXRpb24pICogKDEgLSB0YXhfcmF0ZSlcblxuICAgIGZoc2FfY29udHJpYnV0aW9uID0gbWluKGNhc2gsIGZoc2Ffcm9vbSkgICMgRXhhbXBsZSBGSFNBIGNvbnRyaWJ1dGlvbiBsaW1pdFxuICAgIGZoc2Ffcm9vbSA9IG1heCgwLCBmaHNhX3Jvb20gLSBmaHNhX2NvbnRyaWJ1dGlvbilcbiAgICBmaHNhX2JhbGFuY2UgKz0gZmhzYV9jb250cmlidXRpb25cbiAgICBjYXNoID0gbWF4KDAsIGNhc2ggLSBmaHNhX2NvbnRyaWJ1dGlvbilcblxuICAgIHRmc2FfY29udHJpYnV0aW9uID0gbWluKGNhc2gsIHRmc2Ffcm9vbSkgICMgRXhhbXBsZSBURlNBIGNvbnRyaWJ1dGlvbiBsaW1pdFxuICAgIHRmc2Ffcm9vbSA9IG1heCgwLCB0ZnNhX3Jvb20gLSB0ZnNhX2NvbnRyaWJ1dGlvbilcbiAgICB0ZnNhX2JhbGFuY2UgKz0gdGZzYV9jb250cmlidXRpb25cbiAgICBjYXNoID0gbWF4KDAsIGNhc2ggLSB0ZnNhX2NvbnRyaWJ1dGlvbilcblxuICAgIGJyb2tlcmFnZV9jb250cmlidXRpb24gPSBtYXgoMCwgY2FzaCkgICMgUmVtYWluaW5nIGZ1bmRzXG4gICAgYnJva2VyYWdlX2JhbGFuY2UgKz0gYnJva2VyYWdlX2NvbnRyaWJ1dGlvblxuICAgIGNhc2ggPSBtYXgoMCwgY2FzaCAtIGJyb2tlcmFnZV9jb250cmlidXRpb24pXG5cbiAgICBmb3IgeWVhciBpbiByYW5nZSh5ZWFycyk6XG4gICAgICAgIHRyeTpcbiAgICAgICAgICAgICMgTG9nIHRoZSBiYWxhbmNlcyBmb3IgdGhlIHllYXJcblxuICAgICAgICAgICAgIyBOZXcgcm9vbVxuICAgICAgICAgICAgcnJzcF9yb29tICs9IG1pbigoc2FsYXJ5ICsgYm9udXMpICogMC4xOCwgMzAwMDApXG4gICAgICAgICAgICBmaHNhX3Jvb20gKz0gODAwMFxuICAgICAgICAgICAgdGZzYV9yb29tICs9IDYwMDBcblxuICAgICAgICAgICAgIyBBcHBseSBpbnZlc3RtZW50IHlpZWxkXG4gICAgICAgICAgICBycnNwX2JhbGFuY2UgKj0gMSArIGludmVzdG1lbnRfeWllbGRcbiAgICAgICAgICAgIGZoc2FfYmFsYW5jZSAqPSAxICsgaW52ZXN0bWVudF95aWVsZFxuICAgICAgICAgICAgdGZzYV9iYWxhbmNlICo9IDEgKyBpbnZlc3RtZW50X3lpZWxkXG4gICAgICAgICAgICBicm9rZXJhZ2VfYmFsYW5jZSAqPSAxICsgaW52ZXN0bWVudF95aWVsZFxuXG4gICAgICAgICAgICAjIE1ha2UgZW5kIG9mIHllYXIgY29udHJpYnV0aW9ucyBiYXNlZCBvbiBzYWxhcnkgYW5kIGJvbnVzIChleGFtcGxlIGxvZ2ljKVxuXG4gICAgICAgICAgICBjYXNoID0gKHNhbGFyeSAtIGV4cGVuc2VzKSAqIGRlbHRhX2ZyYWN0aW9uICsgYm9udXNcblxuICAgICAgICAgICAgcnJzcF9jb250cmlidXRpb24gPSBtaW4oY2FzaCwgcnJzcF9yb29tKSAgIyBFeGFtcGxlIFJSU1AgY29udHJpYnV0aW9uIGxpbWl0XG4gICAgICAgICAgICBycnNwX3Jvb20gPSBtYXgoMCwgcnJzcF9yb29tIC0gcnJzcF9jb250cmlidXRpb24pXG4gICAgICAgICAgICBycnNwX2JhbGFuY2UgKz0gcnJzcF9jb250cmlidXRpb25cbiAgICAgICAgICAgIGNhc2ggPSBtYXgoMCwgY2FzaCAtIHJyc3BfY29udHJpYnV0aW9uKVxuXG4gICAgICAgICAgICBmaHNhX2NvbnRyaWJ1dGlvbiA9IG1pbihjYXNoLCBmaHNhX3Jvb20pICAjIEV4YW1wbGUgRkhTQSBjb250cmlidXRpb24gbGltaXRcbiAgICAgICAgICAgIGZoc2Ffcm9vbSA9IG1heCgwLCBmaHNhX3Jvb20gLSBmaHNhX2NvbnRyaWJ1dGlvbilcbiAgICAgICAgICAgIGZoc2FfYmFsYW5jZSArPSBmaHNhX2NvbnRyaWJ1dGlvblxuICAgICAgICAgICAgY2FzaCA9IG1heCgwLCBjYXNoIC0gZmhzYV9jb250cmlidXRpb24pXG5cbiAgICAgICAgICAgIHRmc2FfY29udHJpYnV0aW9uID0gbWluKGNhc2gsIHRmc2Ffcm9vbSkgICMgRXhhbXBsZSBURlNBIGNvbnRyaWJ1dGlvbiBsaW1pdFxuICAgICAgICAgICAgdGZzYV9yb29tID0gbWF4KDAsIHRmc2Ffcm9vbSAtIHRmc2FfY29udHJpYnV0aW9uKVxuICAgICAgICAgICAgdGZzYV9iYWxhbmNlICs9IHRmc2FfY29udHJpYnV0aW9uXG4gICAgICAgICAgICBjYXNoID0gbWF4KDAsIGNhc2ggLSB0ZnNhX2NvbnRyaWJ1dGlvbilcblxuICAgICAgICAgICAgYnJva2VyYWdlX2NvbnRyaWJ1dGlvbiA9IG1heCgwLCBjYXNoKSAgIyBSZW1haW5pbmcgZnVuZHNcbiAgICAgICAgICAgIGJyb2tlcmFnZV9iYWxhbmNlICs9IGJyb2tlcmFnZV9jb250cmlidXRpb25cbiAgICAgICAgICAgIGNhc2ggPSBtYXgoMCwgY2FzaCAtIGJyb2tlcmFnZV9jb250cmlidXRpb24pXG5cbiAgICAgICAgICAgICMgVXBkYXRlIHNhbGFyeSwgYm9udXMsIGFuZCBleHBlbnNlcyBmb3IgdGhlIG5leHQgeWVhclxuICAgICAgICAgICAgc2FsYXJ5ICo9IDEgKyBzYWxhcnlfZ3Jvd3RoXG4gICAgICAgICAgICBib251cyAqPSAxICsgYm9udXNfZ3Jvd3RoXG4gICAgICAgICAgICBleHBlbnNlcyAqPSAxICsgZXhwZW5zZXNfZ3Jvd3RoXG5cbiAgICAgICAgICAgICMgU3RvcmUgYmFsYW5jZXMgZm9yIHRoZSB5ZWFyXG4gICAgICAgICAgICBycnNwX2JhbGFuY2VzLmFwcGVuZChycnNwX2JhbGFuY2UpXG4gICAgICAgICAgICBmaHNhX2JhbGFuY2VzLmFwcGVuZChmaHNhX2JhbGFuY2UpXG4gICAgICAgICAgICB0ZnNhX2JhbGFuY2VzLmFwcGVuZCh0ZnNhX2JhbGFuY2UpXG4gICAgICAgICAgICBicm9rZXJhZ2VfYmFsYW5jZXMuYXBwZW5kKGJyb2tlcmFnZV9iYWxhbmNlKVxuICAgICAgICAgICAgbmV0X3dvcnRocy5hcHBlbmQoXG4gICAgICAgICAgICAgICAgc3VtKFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICBycnNwX2JhbGFuY2UsICAjIC0gKHJyc3BfYmFsYW5jZSAtIGluaXRpYWxfcnJzcF9iYWxhbmNlKSAqIHRheF9yYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmhzYV9iYWxhbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGZzYV9iYWxhbmNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJva2VyYWdlX2JhbGFuY2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAjIC0gKGJyb2tlcmFnZV9iYWxhbmNlIC0gaW5pdGlhbF9icm9rZXJhZ2VfYmFsYW5jZSkgKiB0YXhfcmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcblxuICAgICAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6XG4gICAgICAgICAgICByYWlzZVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgXCJSUlNQXCI6IHJyc3BfYmFsYW5jZXMsXG4gICAgICAgIFwiRkhTQVwiOiBmaHNhX2JhbGFuY2VzLFxuICAgICAgICBcIlRGU0FcIjogdGZzYV9iYWxhbmNlcyxcbiAgICAgICAgXCJCcm9rZXJhZ2VcIjogYnJva2VyYWdlX2JhbGFuY2VzLFxuICAgICAgICBcIk5ldCBXb3J0aFwiOiBuZXRfd29ydGhzLFxuICAgIH1gXG5leHBvcnQgeyBuZXdzUHJvbXB0LCB0ZWNobmljYWxQcm9tcHQsIGV4cGFuc2lvblByb21wdCwgcHJldmlvdXNDb2RlIH1cbiJdfQ==