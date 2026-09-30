import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get Monday 00:00 SAST of the current week
 */
function getWeekStart(): Date {
  const now = new Date();
  // Adjust for SAST (UTC+2)
  const sastTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const day = sastTime.getUTCDay();
  const diff = sastTime.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(sastTime.getUTCFullYear(), sastTime.getUTCMonth(), diff);
  monday.setUTCHours(0, 0, 0, 0);
  // Convert back to local time
  return new Date(monday.getTime() - 2 * 60 * 60 * 1000);
}

/**
 * POST /api/items/weekly-refresh
 * Selects 6 random items eligible for rental and sets as this week's picks
 * Call via cron job every Monday at 00:00 SAST
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Verify request is from Vercel Cron
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weekStart = getWeekStart();

    // Check if picks already exist for this week
    const existingCount = await prisma.weeklyPick.count({
      where: { weekStart },
    });

    if (existingCount === 6) {
      return NextResponse.json({
        message: 'Weekly picks already set for this week',
        weekStart,
        count: existingCount,
      });
    }

    // Delete old picks for this week if partial
    await prisma.weeklyPick.deleteMany({ where: { weekStart } });

    // Fetch all rental-eligible items (active, with images, quantity > 0)
    const eligibleItems = await prisma.item.findMany({
      where: {
        isActive: true,
        quantity: { gt: 0 },
        // Prioritize items with images for better UX
        images: { some: {} },
        // Only RENTING or BOTH types
        OR: [
          { itemType: 'RENTING' },
          { itemType: 'BOTH' },
        ],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 100, // Fetch top 100 recent items to randomize from
    });

    if (eligibleItems.length < 6) {
      return NextResponse.json(
        {
          error: 'Not enough eligible items in database',
          available: eligibleItems.length,
          required: 6,
        },
        { status: 400 }
      );
    }

    // Randomly shuffle and pick 6
    const shuffled = eligibleItems.sort(() => Math.random() - 0.5).slice(0, 6);

    // Create WeeklyPick records
    const picks = await Promise.all(
      shuffled.map((item, index) =>
        prisma.weeklyPick.create({
          data: {
            itemId: item.id,
            weekStart,
            position: index,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      weekStart,
      picks: picks.map((p) => ({ id: p.id, position: p.position, itemId: p.itemId })),
      message: 'Weekly picks refreshed with 6 random rental items',
    });
  } catch (error) {
    console.error('weekly-refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
