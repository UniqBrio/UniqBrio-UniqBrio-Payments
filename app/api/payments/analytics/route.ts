import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Period = "week" | "month" | "quarter" | "year";

function getPeriodRange(period: Period) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start: Date;
  switch (period) {
    case "week": {
      // last 7 days including today
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "month": {
      start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case "quarter": {
      const month = end.getMonth();
      const qStartMonth = Math.floor(month / 3) * 3;
      start = new Date(end.getFullYear(), qStartMonth, 1, 0, 0, 0, 0);
      break;
    }
    case "year":
    default: {
      start = new Date(end.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    }
  }
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const periodParam = (url.searchParams.get("period") || "month").toLowerCase() as Period;
    const period: Period = ["week", "month", "quarter", "year"].includes(periodParam)
      ? periodParam
      : "month";
    // Allow explicit date range override via from/to (ISO or yyyy-mm-dd)
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    let { start, end } = getPeriodRange(period);
    if (fromParam && toParam) {
      const f = new Date(fromParam);
      const t = new Date(toParam);
      if (!isNaN(f.getTime()) && !isNaN(t.getTime())) {
        start = new Date(f);
        start.setHours(0, 0, 0, 0);
        end = new Date(t);
        end.setHours(23, 59, 59, 999);
      }
    }

    // Allowed methods for chart; others will be grouped as Other
    const allowedMethods = ["Cash", "UPI", "Card", "Bank Transfer"];

    // Aggregate payment method mix and total received in the given period (Completed payments only)
    const [result] = await Payment.aggregate([
      { $unwind: "$paymentRecords" },
      {
        $match: {
          "paymentRecords.paymentStatus": "Completed",
          "paymentRecords.paymentDate": { $gte: start, $lte: end },
        },
      },
      {
        $facet: {
          byMethod: [
            {
              $group: {
                _id: "$paymentRecords.paymentMethod",
                amount: { $sum: "$paymentRecords.amount" },
              },
            },
          ],
          total: [
            { $group: { _id: null, amount: { $sum: "$paymentRecords.amount" } } },
          ],
        },
      },
    ]).exec();

    const totalReceived = (result?.total?.[0]?.amount as number) || 0;
    const rawMix: Array<{ _id: string; amount: number }> = result?.byMethod || [];

    // Normalize to fixed set with zero defaults
    const mixMap: Record<string, number> = Object.fromEntries(
      allowedMethods.map((m) => [m, 0])
    );
    let other = 0;
    for (const row of rawMix) {
      const method = row?._id || "Unknown";
      const amt = Number(row?.amount || 0);
      if (allowedMethods.includes(method)) {
        mixMap[method] += amt;
      } else {
        other += amt;
      }
    }
    const mix = allowedMethods.map((m) => ({ method: m, amount: mixMap[m] }));

    const withPct = mix.map((x) => ({
      ...x,
      percentage: totalReceived > 0 ? (x.amount / totalReceived) * 100 : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        range: { start: start.toISOString(), end: end.toISOString() },
        totalReceived,
        otherAmount: other,
        mix: withPct,
      },
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: "Analytics fetch failed", details: e?.message },
      { status: 500 }
    );
  }
}
