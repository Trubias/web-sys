<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard?period=Last 30 Days
     */
    public function index(Request $request)
    {
        $period = $request->query('period', 'Last 30 Days');

        $now = Carbon::now();
        $startDate = null;
        $prevStartDate = null;
        $prevEndDate = null;

        // Determine date ranges for current and previous periods
        if ($period === 'Today') {
            $startDate = $now->copy()->startOfDay();
            $prevStartDate = $now->copy()->subDay()->startOfDay();
            $prevEndDate = $now->copy()->subDay()->endOfDay();
        } elseif ($period === 'Last Week') {
            $startDate = $now->copy()->subDays(7)->startOfDay();
            $prevStartDate = $now->copy()->subDays(14)->startOfDay();
            $prevEndDate = $now->copy()->subDays(7)->endOfDay();
        } elseif ($period === 'Last Month') {
            $startDate = $now->copy()->subDays(30)->startOfDay();
            $prevStartDate = $now->copy()->subDays(60)->startOfDay();
            $prevEndDate = $now->copy()->subDays(30)->endOfDay();
        } elseif ($period === 'Last 90 Days') {
            $startDate = $now->copy()->subDays(90)->startOfDay();
            $prevStartDate = $now->copy()->subDays(180)->startOfDay();
            $prevEndDate = $now->copy()->subDays(90)->endOfDay();
        } else {
            // Default to Last 30 Days (which was the old title, map it to Last Month logic)
            $startDate = $now->copy()->subDays(30)->startOfDay();
            $prevStartDate = $now->copy()->subDays(60)->startOfDay();
            $prevEndDate = $now->copy()->subDays(30)->endOfDay();
        }

        // ── 1. Current Period Metrics ──────────────────────────────────────────
        $currentCompletedOrders = Order::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->get();
        $currentTotalSales = $currentCompletedOrders->sum('total_amount');
        $currentTotalOrders = Order::where('created_at', '>=', $startDate)->count();

        // Total Customers registered in this period
        $currentNewCustomers = User::where('role', 'customer')
            ->where('created_at', '>=', $startDate)
            ->count();
        // Grand total of all customers up to now
        $totalCustomers = User::where('role', 'customer')->count();

        // Low stock count from Inventory (products table)
        $inventoryLowStock = \App\Models\Product::where('stock', '<=', 5)->count();

        // Low stock count from Product Management (supplier_products table)
        $productMgmtLowStock = \App\Models\SupplierProduct::where('stock', '<=', 5)->count();

        $lowStockAlerts = $inventoryLowStock + $productMgmtLowStock;

        // ── 2. Previous Period Metrics ─────────────────────────────────────────
        $prevCompletedOrdersCount = Order::where('status', 'completed')
            ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->count();
            
        $prevTotalSales = Order::where('status', 'completed')
            ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->sum('total_amount');
            
        $prevTotalOrders = Order::whereBetween('created_at', [$prevStartDate, $prevEndDate])->count();
        
        $prevNewCustomers = User::where('role', 'customer')
            ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->count();

        // Limit percentages to +/- 999% visually
        $salesChange = $this->calcChange($currentTotalSales, $prevTotalSales);
        $ordersChange = $this->calcChange($currentTotalOrders, $prevTotalOrders);
        $customersChange = $this->calcChange($currentNewCustomers, $prevNewCustomers);
        // We do not calculate change for Low Stock as it's an instantaneous global count, not period-dependent
        
        // ── 3. Revenue Chart Data ──────────────────────────────────────────────
        // If Today -> group by hour. Else -> group by day.
        $chartData = [];
        if ($period === 'Today') {
            $hours = range(0, 23);
            $grouped = $currentCompletedOrders->groupBy(function($d) { return Carbon::parse($d->created_at)->format('H'); });
            foreach ($hours as $h) {
                $rev = isset($grouped[str_pad($h, 2, '0', STR_PAD_LEFT)]) ? $grouped[str_pad($h, 2, '0', STR_PAD_LEFT)]->sum('total_amount') : 0;
                $chartData[] = (float)$rev;
            }
        } else {
            // Last Week -> 7 days. Last Month -> 30 days. Last 90 Days -> 90 days.
            $daysCount = $period === 'Last Week' ? 7 : ($period === 'Last 90 Days' ? 90 : 30);
            $grouped = $currentCompletedOrders->groupBy(function($d) { return Carbon::parse($d->created_at)->format('Y-m-d'); });
            
            for ($i = $daysCount - 1; $i >= 0; $i--) {
                $dateStr = $now->copy()->subDays($i)->format('Y-m-d');
                $rev = isset($grouped[$dateStr]) ? $grouped[$dateStr]->sum('total_amount') : 0;
                $chartData[] = (float)$rev;
            }
        }

        // ── 4. Recent Orders (Last 5) ──────────────────────────────────────────
        $recentOrders = Order::orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(function($o) {
                return [
                    'id'      => $o->ref ?: ('#ORD-' . $o->id),
                    'product' => $o->product_name,
                    'amount'  => (float) $o->total_amount,
                    'status'  => ucfirst($o->status),
                ];
            });

        return response()->json([
            'metrics' => [
                'total_sales'      => (float) $currentTotalSales,
                'sales_change'     => $salesChange,
                'total_orders'     => $currentTotalOrders,
                'orders_change'    => $ordersChange,
                'low_stock'        => $lowStockAlerts,
                'total_customers'  => $totalCustomers,
                'customers_change' => $customersChange, // change in acquiring rate, total customers goes up
            ],
            'chart_data'    => $chartData,
            'recent_orders' => $recentOrders,
        ]);
    }

    private function calcChange($current, $prev)
    {
        if ($prev == 0) return null; // Not enough data to calculate % change from zero
        $pct = (($current - $prev) / $prev) * 100;
        return round($pct, 1);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'notify_new_order' => 'required|boolean'
        ]);

        $user = auth()->user();
        if ($user) {
            $user->update(['notify_new_order' => $request->notify_new_order]);
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
