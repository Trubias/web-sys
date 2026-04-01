<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Inventory;
use App\Models\SupplierProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupplierOrderController extends Controller
{
    /**
     * GET /api/supplier/orders
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'supplier') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $orders = Order::where('supplier_id', $user->id)
            ->with(['brand', 'product'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }

    /**
     * PUT /api/supplier/orders/{id}/accept
     */
    public function accept(Request $request, $id)
    {
        $user = $request->user();
        $order = Order::where('supplier_id', $user->id)->findOrFail($id);

        $order->status = 'accepted';
        $order->save();

        return response()->json($order);
    }

    /**
     * PUT /api/supplier/orders/{id}/delivered
     */
    public function markAsDelivered(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'supplier') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $order = Order::where('supplier_id', $user->id)->findOrFail($id);

        if ($order->status === 'delivered' || $order->status === 'completed') {
            return response()->json(['message' => 'Order already delivered'], 400);
        }

        DB::beginTransaction();
        try {
            $order->status = 'delivered';
            $order->delivered_at = now();
            $order->save();

            $details = [
                'name'          => $order->product_name,
                'brand_id'      => $order->brand_id,
                'price'         => $order->unit_price,
                'image'         => $order->product_image,
                'supplier_id'   => $order->supplier_id,
                'supplier_name' => $order->supplier_name,
                'stock'         => $order->quantity,
            ];

            // 1. Sync Product Management (products table)
            $product = Product::where('name', $details['name'])
                ->where('supplier_id', $details['supplier_id'])
                ->first();

            if ($product) {
                $product->stock += $details['stock'];
                $product->price = $details['price'];
                $product->image = $details['image'];
            } else {
                $product = new Product($details);
                $product->slug = Str::slug($details['name']) . '-' . Str::random(4);
                // Fallback category if not found
                $product->category_id = 1; 
            }

            if ($product->stock == 0) $product->status = 'Out of Stock';
            elseif ($product->stock <= 5) $product->status = 'Low Stock';
            else $product->status = 'Active';
            $product->save();

            // 2. Sync Inventory Administration
            $inventory = Inventory::where('name', $details['name'])
                ->where('supplier_id', $details['supplier_id'])
                ->first();

            if ($inventory) {
                $inventory->stock += $details['stock'];
                $inventory->price = $details['price'];
                $inventory->image = $details['image'];
            } else {
                $inventory = new Inventory($details);
                $inventory->slug = Str::slug($details['name']) . '-' . Str::random(4);
                $inventory->category_id = $product->category_id;
            }

            if ($inventory->stock == 0) $inventory->status = 'Out of Stock';
            elseif ($inventory->stock <= 5) $inventory->status = 'Low Stock';
            else $inventory->status = 'Active';
            $inventory->save();

            // 3. Deduct stock from Supplier Product Table (supplier_products)
            $specProduct = SupplierProduct::where('name', $details['name'])
                ->where('supplier_id', $details['supplier_id'])
                ->first();
            
            if ($specProduct) {
                $specProduct->stock = max(0, $specProduct->stock - $details['stock']);
                if ($specProduct->stock == 0) $specProduct->status = 'Out of Stock';
                elseif ($specProduct->stock <= 5) $specProduct->status = 'Low Stock';
                else $specProduct->status = 'Active';
                $specProduct->save();
            }

            DB::commit();
            return response()->json(['message' => 'Status Updated & Inventory Synchronized', 'order' => $order]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Sync failed', 'message' => $e->getMessage()], 500);
        }
    }
}
