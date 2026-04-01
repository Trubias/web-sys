<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class AdminProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['brand', 'category', 'supplier']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhereHas('brand', function ($b) use ($request) {
                      $b->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:255',
            'brand_id'    => 'required|exists:brands,id',
            'category_id' => 'required|exists:categories,id',
            'price'          => 'required|numeric|min:0',
            'stock'          => 'required|integer|min:0',
            'description'    => 'nullable|string',
            'image'          => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'existing_image' => 'nullable|string',
            'supplier_id'    => 'nullable',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        } elseif ($request->filled('existing_image')) {
            $imagePath = $request->existing_image;
        }

        // Reuse existing product record if one exists (prevents duplicate IDs / stale order FK)
        $existing = Product::where('name', $request->name)
            ->where('supplier_id', $request->supplier_id ?? null)
            ->first();

        $values = [
            'brand_id'    => $request->brand_id,
            'category_id' => $request->category_id,
            'price'       => $request->price,
            'stock'       => $request->stock,
            'description' => $request->description ?? '',
        ];
        if ($imagePath) {
            $values['image'] = $imagePath;
        }

        if ($existing) {
            $existing->update($values);
            $product = $existing->fresh(['brand', 'category', 'supplier']);
        } else {
            $product = Product::create(array_merge($values, [
                'name'        => $request->name,
                'slug'        => Str::slug($request->name) . '-' . Str::random(4),
                'image'       => $imagePath,
                'supplier_id' => $request->supplier_id ?? null,
            ]));
            $product->load(['brand', 'category', 'supplier']);
        }

        return response()->json($product, 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'stock'       => 'sometimes|required|integer|min:0',
            'name'        => 'sometimes|required|string|max:255',
            'price'       => 'sometimes|required|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'brand_id'    => 'sometimes|exists:brands,id',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        // NOTE: Admin Product Management stock is managed by the frontend (reqStore).
        // Admin actions must NEVER write to supplier_products (Supplier Portal table).

        // Admin inventory stock update
        $product->update($request->only([
            'name', 'price', 'stock', 'description',
            'brand_id', 'category_id', 'supplier_id'
        ]));
        
        // Update Inventory (Product) status
        if ($product->stock == 0) {
            $product->status = 'Out of Stock';
        } elseif ($product->stock > 0 && $product->stock <= 10) {
            $product->status = 'Low Stock';
        } else {
            $product->status = 'Active';
        }
        $product->save();

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $product->image = $request->file('image')->store('products', 'public');
            $product->save();
        }

        return response()->json($product->load(['brand', 'category', 'supplier']));
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        // NOTE: Stock is returned to Admin Product Management via the frontend (reqStore).
        // Admin actions must NEVER write to supplier_products (Supplier Portal table).

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        $product->delete();
        return response()->json(['message' => 'Deleted', 'returned_stock' => $product->stock]);
    }

    public function brands()
    {
        return response()->json(Brand::orderBy('name')->get());
    }

    public function storeBrand(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $brand = Brand::firstOrCreate(
            ['name' => $request->name],
            ['slug' => Str::slug($request->name)]
        );
        return response()->json($brand, 201);
    }

    public function categories()
    {
        return response()->json(Category::orderBy('name')->get());
    }

    public function storeCategory(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $category = Category::firstOrCreate(
            ['name' => $request->name],
            ['slug' => Str::slug($request->name)]
        );
        return response()->json($category, 201);
    }

    public function suppliers()
    {
        // Return ALL suppliers (active/confirmed) with their brands string
        return response()->json(
            Supplier::select('id', 'name', 'address', 'brands', 'supplier_status')
                ->whereIn('supplier_status', ['confirmed', 'active'])
                ->orderBy('name')
                ->get()
        );
    }
}
