export const SQL_QUERY_STRING = `
SELECT 
    ef_month,
    category,
    biller,
    amount,
    currency,
    created_ts
FROM expensage_backend.expenses_forecast
ORDER BY ef_month;`;

export const SUMMARY_QUERY_STRING = `
SELECT ef_month as month, SUM(amount) as total 
FROM expensage_backend.expenses_forecast
GROUP BY ef_month
ORDER BY total DESC;`;

export const STATS_QUERY_STRING = `
SELECT 
    sum(amount) as yearly_total,
    sum(amount)/12 as avg_expense_month,
    round(sum(amount)/365) as avg_expense_day 
FROM expensage_backend.expenses_forecast;`;

export const INSERT_EXPENSE_QUERY = `
INSERT INTO expensage_backend.expenses_forecast (ef_month, category, biller, amount, currency, created_ts, updated_ts)
VALUES ($ef_month, '$category', '$biller', $amount, 'INR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`;
