<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductReviewController extends Controller
{
    // ── a) POST /api/reviews ───────────────────────────────────────────────────
    public function store(Request $request)
    {
        $request->validate([
            'order_id'  => 'required|integer|exists:orders,id',
            'rating'    => 'required|integer|min:1|max:5',
            'comment'   => 'nullable|string|max:1000',
            'images'    => 'nullable|array|max:5',
            'images.*'  => 'file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $order = Order::findOrFail($request->order_id);

        // Guard: order must belong to the authenticated user
        if ((int) $order->user_id !== (int) auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Guard: order must be delivered
        if (!in_array(strtolower($order->status), ['delivered', 'completed'])) {
            return response()->json([
                'message' => 'You can only review orders that have been delivered.'
            ], 422);
        }

        // Guard: no duplicate review per order
        if (ProductReview::where('order_id', $order->id)->exists()) {
            return response()->json(['message' => 'You have already reviewed this order.'], 422);
        }

        // Upload images
        $imagePaths = [];
        if ($request->hasFile('images')) {
            $productId = $order->product_id ?? 'misc';
            foreach ($request->file('images') as $file) {
                $path = $file->store("reviews/{$productId}", 'public');
                $imagePaths[] = $path;
            }
        }

        $review = ProductReview::create([
            'order_id'   => $order->id,
            'user_id'    => auth()->id(),
            'product_id' => $order->product_id,
            'rating'     => $request->rating,
            'comment'    => $request->comment,
            'images'     => count($imagePaths) ? $imagePaths : null,
            'is_visible' => true,
        ]);

        return response()->json(
            $review->load('user:id,name'),
            201
        );
    }

    // ── b) GET /api/products/{id}/reviews ─────────────────────────────────────
    public function indexByProduct(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);

        $reviews = ProductReview::visible()
            ->where('product_id', $productId)
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->paginate(10);

        // Privacy-mask reviewer name: "Juan D."
        $reviews->getCollection()->transform(function ($review) {
            $name   = ($review->user ? $review->user->name : null) ?? 'Anonymous';
            $parts  = explode(' ', trim($name));
            $masked = $parts[0];
            if (count($parts) > 1) {
                $masked .= ' ' . strtoupper(substr(end($parts), 0, 1)) . '.';
            }

            // Build public image URLs
            $imageUrls = collect($review->images ?? [])->map(function ($path) {
                return asset('storage/' . $path);
            })->values()->all();

            return [
                'id'            => $review->id,
                'reviewer_name' => $masked,
                'rating'        => $review->rating,
                'comment'       => $review->comment,
                'images'        => $imageUrls,
                'helpful_count' => $review->helpful_count,
                'created_at'    => $review->created_at,
            ];
        });

        // Aggregate stats
        $allVisible      = ProductReview::visible()->where('product_id', $productId);
        $totalReviews    = $allVisible->count();
        $averageRating   = $totalReviews > 0
            ? round($allVisible->avg('rating'), 1)
            : 0;

        // Breakdown: count per star (5→1)
        $breakdown = [];
        for ($star = 5; $star >= 1; $star--) {
            $breakdown[$star] = ProductReview::visible()
                ->where('product_id', $productId)
                ->where('rating', $star)
                ->count();
        }

        return response()->json([
            'reviews'        => $reviews,
            'average_rating' => (float) $averageRating,
            'total_reviews'  => $totalReviews,
            'rating_breakdown' => $breakdown,   // { "5": 12, "4": 8, ... }
        ]);
    }

    // ── c) POST /api/reviews/{id}/helpful ─────────────────────────────────────
    public function markHelpful(Request $request, $reviewId)
    {
        $review = ProductReview::findOrFail($reviewId);
        $review->increment('helpful_count');

        return response()->json(['helpful_count' => $review->fresh()->helpful_count]);
    }
}
