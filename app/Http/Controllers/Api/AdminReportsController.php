<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

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
            ->where('status', 'completed')
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
            ->where('status', 'completed')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $monthlyRevenue = [];
        foreach ($monthlyRaw as $row) {
            $monthlyRevenue[(int) $row->month] = (float) $row->revenue;
        }

        // ── Top products ──────────────────────────────────────────────────────
        $productStats = [];
        foreach ($orders as $o) {
            $pName = $o->product_name;
            if (!isset($productStats[$pName])) {
                $productStats[$pName] = ['qty' => 0, 'rev' => 0];
            }
            $productStats[$pName]['qty'] += $o->quantity;
            $productStats[$pName]['rev'] += $o->total_amount;
        }
        uasort($productStats, function ($a, $b) { return $b['qty'] - $a['qty']; });

        $topProducts = [];
        $count = 0;
        foreach ($productStats as $name => $stats) {
            if ($count >= 5) break;
            $topProducts[] = [
                'name' => $name,
                'qty'  => $stats['qty'],
                'rev'  => $stats['rev'],
            ];
            $count++;
        }

        // ── Customer insights ─────────────────────────────────────────────────
        $customerIds = Order::whereYear('created_at', $year)
            ->where('status', 'completed')
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->unique()
            ->all();

        $returningCount = 0;
        $newCount       = 0;
        foreach ($customerIds as $uid) {
            $lifetime = Order::where('user_id', $uid)->where('status', 'completed')->count();
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
                ->where('status', 'completed')
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
        $orders = Order::with(['user', 'product', 'brand', 'rider'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json($orders);
    }

    /**
     * PUT /api/admin/orders/{id}/assign-rider
     */
    public function assignRider(Request $request, $id)
    {
        $request->validate(['rider_id' => 'required|exists:riders,id']);
        $order = Order::findOrFail($id);
        
        $order->rider_id = $request->rider_id;
        $order->status = 'assigned';
        $order->save();

        // Notify the Rider
        \App\Models\UserNotification::create([
            'user_id' => $request->rider_id,
            'title' => 'New Delivery Assigned',
            'message' => 'You have been assigned to deliver order ' . $order->ref,
            'type' => 'delivery_assigned',
            'is_read' => false
        ]);

        if ($order->user_id) {
            \App\Models\UserNotification::create([
                'user_id' => $order->user_id,
                'title' => 'Order Processing',
                'message' => 'Your order ' . $order->ref . ' is now being processed. A rider has been assigned to deliver your order.',
                'type' => 'order_status',
                'is_read' => false
            ]);
        }

        return response()->json($order->load(['user', 'product', 'brand', 'rider']));
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
        $order->delete();

        return response()->json([
            'message'       => 'Order deleted successfully',
            'stock_changed' => false,
        ]);
    }

}
