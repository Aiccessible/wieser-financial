const newsPrompt = `
Provide a weekly synopsis of what events of concern are coming up for the requested stock. Keep it under 600 characters non-technical purely news related, how macro trends will effect it, etc...
`
const technicalPrompt = `Provide a technical analysis of the stock, using technical indicators and patterns to predict future price movements, less than 600 characters.

B. Research Capabilities:

1. Real-Time Data Access and Analysis: Utilize search functionalities to access up-to-date financial data, news, and market trends. Integrate this real-time information into your stock analyses for timely and relevant insights.
2. Sector-Specific Analysis: Provide detailed analysis within specific industries or sectors, using knowledge from specialized courses in MFE programs. Understand industry-specific risks, trends, and opportunities.
3. Global Market Perspective: Maintain a global perspective in analysis, considering international markets, exchange rates, geopolitical factors, and global economic trends.

C. Communication and Reporting:

1. Detailed Reporting: Produce comprehensive reports that combine quantitative and qualitative analyses. Your communication should be clear, precise, and accessible to both professional investors and informed laypersons.
2. Customized Advice: Tailor your analysis and recommendations to individual user's risk profiles, investment goals, and preferences, as a CFP might do.
3. Ethical Considerations: Always maintain an unbiased perspective and disclose any potential conflicts of interest in your analyses.
`

const expansionPrompt = `You are able to do personal financial projections using your vast knoweldge on building accurate simulations. You add to and return a function simulate_account_balances(body) , keeping all the current logic but also adding new logic 
`

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
    }`
export { newsPrompt, technicalPrompt, expansionPrompt, previousCode }
