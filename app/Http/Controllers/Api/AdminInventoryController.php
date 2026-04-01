<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminInventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Inventory::with(['brand', 'category', 'supplier']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhereHas('brand', function ($b) use ($request) {
                      $b->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
            'category_id' => 'required|exists:categories,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|string',
        ]);

        $inventory = Inventory::create([
            'name' => $request->name,
            'slug' => \Illuminate\Support\Str::slug($request->name) . '-' . \Illuminate\Support\Str::random(4),
            'brand_id' => $request->brand_id,
            'category_id' => $request->category_id,
            'supplier_id' => $request->supplier_id,
            'price' => $request->price,
            'stock' => $request->stock,
            'image' => $request->image,
        ]);

        if ($inventory->stock == 0) $inventory->status = 'Out of Stock';
        elseif ($inventory->stock <= 5) $inventory->status = 'Low Stock';
        else $inventory->status = 'Active';
        $inventory->save();

        return response()->json($inventory->load(['brand', 'category', 'supplier']), 201);
    }

    public function update(Request $request, $id)
    {
        $item = Inventory::findOrFail($id);

        $request->validate([
            'stock' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
        ]);

        $item->update($request->only(['stock', 'price']));
        
        if ($item->stock == 0) $item->status = 'Out of Stock';
        elseif ($item->stock <= 5) $item->status = 'Low Stock';
        else $item->status = 'Active';
        $item->save();

        // Optional: Sync back to Product Management? 
        // Typically Inventory and PM prices should match.
        Product::where('name', $item->name)
               ->where('supplier_id', $item->supplier_id)
               ->update([
                   'stock' => $item->stock,
                   'price' => $item->price,
                   'status' => $item->status
               ]);

        return response()->json($item->load(['brand', 'category', 'supplier']));
    }

    public function destroy($id)
    {
        $item = Inventory::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted from Inventory']);
    }
}
