# UniqBrio Logo Setup for Payment Receipts

## Logo Implementation Status
✅ **COMPLETED** - The UniqBrio logo has been successfully integrated into all payment receipt/payslip components.

## Logo Files Updated
The following files have been updated to include the UniqBrio logo:

1. **`/app/api/payslip/generate/route.ts`** - Server-generated HTML receipts
2. **`/app/payments/components/payment-actions.tsx`** - PDF receipt generation
3. **`/app/payments/components/payslip-button.tsx`** - Print preview receipts

## Logo File Location
**File**: `/public/uniqbrio-logo.png`

**⚠️ IMPORTANT**: You need to manually replace the placeholder logo file with your actual UniqBrio logo image:

1. Save your UniqBrio logo as `uniqbrio-logo.png`
2. Replace the file at: `public/uniqbrio-logo.png`
3. Recommended logo specifications:
   - Format: PNG (for transparency support)
   - Max width: 200px 
   - Height: Auto (maintains aspect ratio)
   - Background: Transparent or white

## Logo Styling Applied
- **Size**: Max-width 200px, auto height
- **Alignment**: Center aligned
- **Spacing**: 15px margin-bottom
- **Display**: Block element for proper centering
- **Responsive**: Scales appropriately for different screen sizes

## Receipt Locations Where Logo Appears
✅ **HTML Receipts** (API route)
✅ **PDF Downloads** (Payment actions)  
✅ **Print Preview** (Payslip button)

## Testing
After replacing the logo file, test the logo appearance by:
1. Generating a payslip from the payments table
2. Using the "Generate Payslip" button
3. Checking the print preview
4. Downloading PDF receipts

The logo will appear prominently at the top center of all payment receipts above the "UNIQBRIO" company name.