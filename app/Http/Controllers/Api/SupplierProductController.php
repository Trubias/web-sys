<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class SupplierProductController extends Controller
{
    public function index(Request $request)
    {
        $query = SupplierProduct::with(['brand', 'category', 'supplier']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhereHas('brand', function ($b) use ($request) {
                      $b->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        // Admins can filter by supplier_id, but Suppliers are locked to their own ID automatically
        if ($request->user() && $request->user()->role === 'supplier') {
            $query->where('supplier_id', $request->user()->id);
        } elseif ($request->filled('supplier_id')) {
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
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'description' => 'nullable|string',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'existing_image' => 'nullable|string',
            'supplier_id' => 'required',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('supplier_products', 'public');
        } elseif ($request->filled('existing_image')) {
            $imagePath = $request->existing_image;
        }

        $supplier_id = ($request->user() && $request->user()->role === 'supplier') ? $request->user()->id : $request->supplier_id;

        $product = SupplierProduct::create([
            'name'        => $request->name,
            'slug'        => Str::slug($request->name) . '-' . Str::random(4),
            'brand_id'    => $request->brand_id,
            'category_id' => $request->category_id,
            'price'       => $request->price,
            'stock'       => $request->stock,
            'description' => $request->description ?? '',
            'image'       => $imagePath,
            'supplier_id' => $supplier_id,
        ]);

        return response()->json($product->load(['brand', 'category', 'supplier']), 201);
    }

    public function update(Request $request, $id)
    {
        $product = SupplierProduct::findOrFail($id);

        if ($request->user() && $request->user()->role === 'supplier' && $product->supplier_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized actions on another supplier\'s product.'], 403);
        }

        $request->validate([
            'stock'       => 'sometimes|required|integer|min:0',
            'name'        => 'sometimes|required|string|max:255',
            'price'       => 'sometimes|required|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'brand_id'    => 'sometimes|exists:brands,id',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $updateData = $request->only([
            'name', 'price', 'stock', 'description',
            'brand_id', 'category_id'
        ]);
        
        // Admins can change the supplier mapping, but Suppliers cannot
        if ($request->filled('supplier_id') && (!$request->user() || $request->user()->role !== 'supplier')) {
            $updateData['supplier_id'] = $request->supplier_id;
        }

        $product->update($updateData);

        if ($request->has('stock')) {
            if ($product->stock == 0) {
                $product->status = 'Out of Stock';
            } elseif ($product->stock > 0 && $product->stock <= 10) {
                $product->status = 'Low Stock';
            } else {
                $product->status = 'Active';
            }
            $product->save();
        }

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $product->image = $request->file('image')->store('supplier_products', 'public');
            $product->save();
        }

        return response()->json($product->load(['brand', 'category', 'supplier']));
    }

    public function destroy($id)
    {
        $product = SupplierProduct::findOrFail($id);
        
        if (request()->user() && request()->user()->role === 'supplier' && $product->supplier_id !== request()->user()->id) {
            return response()->json(['message' => 'Unauthorized deletion of another supplier\'s product.'], 403);
        }
        
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        $product->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function deductStock(Request $request, $id)
    {
        $product = SupplierProduct::findOrFail($id);
        
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $product->stock = $product->stock - $request->quantity;
        
        if ($product->stock <= 0) {
            $product->status = 'Out of Stock';
        } elseif ($product->stock > 0 && $product->stock <= 10) {
            $product->status = 'Low Stock';
        } else {
            $product->status = 'Active';
        }

        $product->save();

        return response()->json($product);
    }
}
