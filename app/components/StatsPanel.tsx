interface StatsPanelProps {
    statsData: Record<string, any> | null;
}

export function StatsPanel({ statsData }: StatsPanelProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Yearly Total</h3>
                <p className="text-3xl font-bold text-blue-600">
                    ₹{statsData?.yearly_total || 0}
                </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Expense/Month</h3>
                <p className="text-3xl font-bold text-blue-600">
                    ₹{statsData?.avg_expense_per_month || 0}
                </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Expense/Day</h3>
                <p className="text-3xl font-bold text-blue-600">
                    ₹{statsData?.avg_expense_per_day || 0}
                </p>
            </div>
        </div>
    );
}
