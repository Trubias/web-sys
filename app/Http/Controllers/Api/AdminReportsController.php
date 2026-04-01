<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportsController extends Controller
{
    /**
     * GET /api/admin/reports?year=2026
     * Returns all analytics metrics for the selected year from real orders.
     */
    public function index(Request $request)
    {
        $year = (int) $request->query('year', now()->year);

        // ── Completed orders for the selected year ────────────────────────────
        $orders = Order::whereYear('created_at', $year)
            ->whereIn('status', ['completed', 'delivered'])
            ->get();

        $totalRevenue  = $orders->sum('total_amount');
        $orderCount    = $orders->count();
        $avgOrderValue = $orderCount > 0 ? round($totalRevenue / $orderCount, 2) : 0;

        // ── Total orders (all statuses) for conversion rate ───────────────────
        $totalPlaced   = Order::whereYear('created_at', $year)->count();
        $conversionRate = $totalPlaced > 0
            ? round(($orderCount / $totalPlaced) * 100, 1)
            : 0;

        // ── Top selling brand by quantity ─────────────────────────────────────
        $brandSales = [];
        foreach ($orders as $o) {
            $bName = $o->brand_name ?: 'Unknown';
            if (!isset($brandSales[$bName])) {
                $brandSales[$bName] = ['qty' => 0, 'rev' => 0];
            }
            $brandSales[$bName]['qty'] += $o->quantity;
            $brandSales[$bName]['rev'] += $o->total_amount;
        }
        // Sort by qty desc
        uasort($brandSales, function ($a, $b) { return $b['qty'] - $a['qty']; });

        $topBrand = count($brandSales) > 0 ? array_key_first($brandSales) : null;

        // ── Revenue by month (1-12) ───────────────────────────────────────────
        $monthlyRaw = Order::selectRaw('MONTH(created_at) as month, SUM(total_amount) as revenue')
            ->whereYear('created_at', $year)
            ->whereIn('status', ['completed', 'delivered'])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $monthlyRevenue = [];
        foreach ($monthlyRaw as $row) {
            $monthlyRevenue[(int) $row->month] = (float) $row->revenue;
        }

        // ── Top products (joined with products table for real image) ──────────
        $topProductsRaw = DB::table('orders')
            ->join('products', 'orders.product_id', '=', 'products.id')
            ->select(
                'products.id',
                'products.name',
                'products.image',
                DB::raw('SUM(orders.quantity) as total_qty'),
                DB::raw('SUM(orders.total_amount) as total_revenue')
            )
            ->whereYear('orders.created_at', $year)
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->whereNotNull('orders.product_id')
            ->groupBy('products.id', 'products.name', 'products.image')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get();

        $topProducts = $topProductsRaw->map(function ($row) {
            return [
                'name'      => $row->name,
                'qty'       => (int) $row->total_qty,
                'rev'       => (float) $row->total_revenue,
                'image_url' => $row->image ? asset('storage/' . $row->image) : null,
            ];
        })->values()->all();

        // Fallback: orders without product_id (legacy data) — append if we have fewer than 5
        if (count($topProducts) < 5) {
            $legacyStats = [];
            foreach ($orders->whereNull('product_id') as $o) {
                $pName = $o->product_name;
                if (!$pName) continue;
                if (!isset($legacyStats[$pName])) {
                    $legacyStats[$pName] = ['qty' => 0, 'rev' => 0];
                }
                $legacyStats[$pName]['qty'] += $o->quantity;
                $legacyStats[$pName]['rev'] += $o->total_amount;
            }
            arsort($legacyStats);
            $existing = array_column($topProducts, 'name');
            foreach ($legacyStats as $name => $stats) {
                if (count($topProducts) >= 5) break;
                if (in_array($name, $existing)) continue;
                $topProducts[] = [
                    'name'      => $name,
                    'qty'       => $stats['qty'],
                    'rev'       => $stats['rev'],
                    'image_url' => null,
                ];
            }
        }

        // ── Customer insights ─────────────────────────────────────────────────
        $customerIds = Order::whereYear('created_at', $year)
            ->whereIn('status', ['completed', 'delivered'])
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->unique()
            ->all();

        $returningCount = 0;
        $newCount       = 0;
        foreach ($customerIds as $uid) {
            $lifetime = Order::where('user_id', $uid)->whereIn('status', ['completed', 'delivered'])->count();
            if ($lifetime > 1) {
                $returningCount++;
            } else {
                $newCount++;
            }
        }
        $totalCustomers   = $newCount + $returningCount;
        $returningPercent = $totalCustomers > 0
            ? round(($returningCount / $totalCustomers) * 100, 1)
            : 0;

        $avgLTV = 0;
        if ($totalCustomers > 0 && count($customerIds) > 0) {
            $lifetimeRevenue = Order::whereIn('user_id', $customerIds)
                ->whereIn('status', ['completed', 'delivered'])
                ->sum('total_amount');
            $avgLTV = round($lifetimeRevenue / $totalCustomers, 2);
        }

        return response()->json([
            'year'              => $year,
            'total_revenue'     => (float) $totalRevenue,
            'order_count'       => $orderCount,
            'avg_order_value'   => (float) $avgOrderValue,
            'conversion_rate'   => (float) $conversionRate,
            'top_brand'         => $topBrand,
            'monthly_revenue'   => $monthlyRevenue,
            'sales_by_brand'    => $brandSales,
            'top_products'      => $topProducts,
            'returning_percent' => (float) $returningPercent,
            'avg_ltv'           => (float) $avgLTV,
        ]);
    }

    /**
     * POST /api/admin/orders — place a new customer order
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'        => 'nullable|exists:users,id',
            'customer_name'  => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'product_id'     => 'nullable|exists:products,id',
            'product_name'   => 'required|string|max:255',
            'brand_id'       => 'nullable|exists:brands,id',
            'brand_name'     => 'nullable|string|max:255',
            'quantity'       => 'required|integer|min:1',
            'unit_price'     => 'required|numeric|min:0',
            'status'         => 'sometimes|string',
        ]);

        $data['total_amount'] = $data['unit_price'] * $data['quantity'];
        $data['ref']          = 'ORD-' . strtoupper(substr(uniqid(), -6));
        $data['status']       = isset($data['status']) ? $data['status'] : 'completed';

        $order = Order::create($data);
        return response()->json($order, 201);
    }

    /**
     * GET /api/admin/orders — list all customer orders
     */
    public function orders(Request $request)
    {
        $orders = Order::with(['user', 'product.category', 'brand', 'rider'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json($orders);
    }



    /**
     * DELETE /api/admin/orders/{id}
     *
     * Stock rules:
     *  - Pending order deleted  → NO stock change (stock was never deducted)
     *  - Delivered order deleted → NO stock reversal (stock was already deducted on delivery)
     *  - Any other status       → NO stock change
     */
    public function destroyOrder($id)
    {
        $order = Order::findOrFail($id);

        // Notify the customer if this order belongs to a user
        if ($order->user_id) {
            $isPending   = $order->status === 'pending';
            $isDelivered = in_array($order->status, ['delivered', 'completed']);

            if ($isPending) {
                $msg = 'Your order ' . $order->ref . ' has been cancelled by the admin. No charges have been applied.';
            } elseif ($isDelivered) {
                $msg = 'Your order ' . $order->ref . ' record has been removed by the admin.';
            } else {
                $msg = 'Your order ' . $order->ref . ' has been cancelled by the admin.';
            }

            \App\Models\UserNotification::create([
                'user_id' => $order->user_id,
                'title'   => 'Order Cancelled',
                'message' => $msg,
                'type'    => 'order_cancelled',
                'is_read' => false,
            ]);
        }

        // DO NOT touch stock here under any circumstances:
        // - Pending: stock was never deducted, so nothing to restore.
        // - Delivered: stock was already deducted by riderDeliveryController::markAsDelivered.
        $order->admin_archived = true;
        $order->save();

        return response()->json([
            'message'       => 'Order deleted successfully',
            'stock_changed' => false,
        ]);
    }

}
