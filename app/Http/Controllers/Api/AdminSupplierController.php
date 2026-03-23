<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class AdminSupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::all();
        return response()->json($suppliers);
    }

    public function setInterview(Request $request, $id)
    {
        $request->validate(['interview_date' => 'required|date']);
        $supplier = Supplier::findOrFail($id);
        
        $supplier->update([
            'supplier_status' => 'interview_set',
            'interview_date' => $request->interview_date
        ]);
        
        return response()->json(['message' => 'Interview scheduled', 'supplier' => $supplier]);
    }

    public function confirm($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->update(['supplier_status' => 'active']);
        
        return response()->json(['message' => 'Supplier confirmed', 'supplier' => $supplier]);
    }

    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete(); // This is now a Soft Delete
        
        return response()->json(['message' => 'Supplier safely soft deleted']);
    }
}
