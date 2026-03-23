<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['brand', 'category']);

        if ($request->filled('brand') && $request->brand !== 'all') {
            $query->whereHas('brand', function($q) use ($request) {
                $q->where('slug', $request->brand);
            });
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }
        if ($request->filled('limit')) {
            $query->limit((int) $request->limit);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        return response()->json(Product::with(['brand', 'category'])->findOrFail($id));
    }
}
