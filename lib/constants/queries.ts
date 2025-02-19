export const SQL_QUERY_STRING = `
SELECT 
    ef_month,
    category,
    biller,
    amount,
    currency,
    created_ts
FROM expensage_backend.expenses_forecast
ORDER BY ef_month ASC, created_ts DESC;`;

export const SUMMARY_QUERY_STRING = `
SELECT ef_month as month, SUM(amount) as total 
FROM expensage_backend.expenses_forecast
WHERE currency='$currency'
GROUP BY ef_month
ORDER BY ef_month ASC;`;

export const STATS_QUERY_STRING = `
SELECT 
    SUM(amount) as yearly_total,
    SUM(amount)/12 as avg_expense_per_month,
    SUM(amount)/365 as avg_expense_per_day 
FROM expensage_backend.expenses_forecast;`;

export const INSERT_EXPENSE_QUERY = `
INSERT INTO expensage_backend.expenses_forecast (
    ef_month,
    category,
    biller,
    amount,
    currency,
    created_ts
) VALUES (
    $ef_month,
    '$category',
    '$biller',
    $amount,
    '$currency',
    CURRENT_TIMESTAMP
);`;

export const INSERT_EXPENSE_QUERY_SEPARATE_FIELDS = `
INSERT INTO expensage_backend.expenses_forecast (
    ef_month,
    category,
    biller,
    amount,
    currency,
    created_ts,
    updated_ts
) VALUES (
    $ef_month,
    '$category',
    '$biller',
    $amount,
    '$currency',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);`;
