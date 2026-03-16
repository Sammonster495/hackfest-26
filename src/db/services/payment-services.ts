import { and, asc, count, desc, eq } from "drizzle-orm";
import db from "~/db";
import { getSiteSettings } from "~/db/data/siteSettings";
import { payment, selected, teams } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";

// ---------------------------------------------------------------------------
// Create participation payment (screenshot-based, no Razorpay)
// ---------------------------------------------------------------------------

interface CreateParticipationPaymentInput {
  userId: string;
  teamId: string;
  paymentScreenshotUrl: string;
  paymentTransactionId: string;
  memberCount: number;
}

export async function createParticipationPayment({
  userId,
  teamId,
  paymentScreenshotUrl,
  paymentTransactionId,
  memberCount,
}: CreateParticipationPaymentInput) {
  const rawSettings = await getSiteSettings();
  const siteSettings = Array.isArray(rawSettings)
    ? rawSettings[0]
    : rawSettings;

  if (!siteSettings?.paymentsOpen) {
    throw new AppError("PAYMENTS_NOT_OPEN", 403, {
      title: "Payments not open",
      description:
        "The payment portal is currently closed. Please try again later.",
    });
  }

  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: {
      id: true,
      leaderId: true,
      isCompleted: true,
      paymentStatus: true,
    },
  });

  if (!team) {
    throw new AppError("TEAM_NOT_FOUND", 404);
  }

  if (team.leaderId !== userId) {
    throw new AppError("NOT_LEADER", 403, {
      title: "Not a team leader",
      description: "Only the team leader can complete the payment.",
    });
  }

  if (!team.isCompleted) {
    throw new AppError("TEAM_NOT_COMPLETED", 400, {
      title: "Team not confirmed",
      description: "Your team must be confirmed before making payment.",
    });
  }

  const selectedEntry = await db.query.selected.findFirst({
    where: eq(selected.teamId, teamId),
  });

  if (!selectedEntry) {
    throw new AppError("TEAM_NOT_SELECTED", 403, {
      title: "Team not selected",
      description: "Your team has not been selected for this hackathon.",
    });
  }

  // Check for an existing paid payment to avoid duplicates
  const existingPaidPayment = await db.query.payment.findFirst({
    where: and(eq(payment.teamId, teamId), eq(payment.paymentStatus, "Paid")),
  });

  if (existingPaidPayment) {
    throw new AppError("PAYMENT_ALREADY_COMPLETED", 400, {
      title: "Payment already completed",
      description: "Your team has already completed payment.",
    });
  }

  const amount = memberCount * 400;

  const [inserted] = await db
    .insert(payment)
    .values({
      paymentName: "HACKFEST_26 - PARTICIPATION",
      paymentType: "PARTICIPATION",
      amount: amount.toString(),
      paymentStatus: "Pending",
      paymentScreenshotUrl,
      paymentTransactionId,
      userId,
      teamId,
    })
    .returning({ id: payment.id });

  return inserted;
}

export async function hasPendingPayment(teamId: string) {
  const existingPayment = await db.query.payment.findFirst({
    where: and(
      eq(payment.teamId, teamId),
      eq(payment.paymentStatus, "Pending"),
    ),
  });

  return !!existingPayment;
}

// ---------------------------------------------------------------------------
// Fetch payments for admin dashboard
// ---------------------------------------------------------------------------

export async function getPaymentsForDashboard({
  page = 1,
  limit = 20,
  search,
  sortOrder = "desc",
}: {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}) {
  const offset = (page - 1) * limit;

  const [totalResult, paymentsResult] = await Promise.all([
    db.select({ total: count() }).from(payment),
    db.query.payment.findMany({
      with: {
        team: {
          columns: { id: true, name: true },
        },
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        sortOrder === "asc" ? asc(payment.createdAt) : desc(payment.createdAt),
      ],
      limit,
      offset,
    }),
  ]);

  let filteredPayments = paymentsResult;

  if (search?.trim()) {
    const searchLower = search.trim().toLowerCase();
    filteredPayments = paymentsResult.filter(
      (p) =>
        p.team?.name?.toLowerCase().includes(searchLower) ||
        p.user?.name?.toLowerCase().includes(searchLower) ||
        p.user?.email?.toLowerCase().includes(searchLower),
    );
  }

  const total = totalResult[0]?.total ?? 0;

  return {
    payments: filteredPayments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ---------------------------------------------------------------------------
// Toggle payment verification (Pending <-> Paid)
// ---------------------------------------------------------------------------

export async function togglePaymentVerification(paymentId: string) {
  const existing = await db.query.payment.findFirst({
    where: eq(payment.id, paymentId),
    columns: { id: true, paymentStatus: true, teamId: true },
  });

  if (!existing) {
    throw new AppError("PAYMENT_NOT_FOUND", 404, {
      title: "Payment not found",
    });
  }

  const newStatus = existing.paymentStatus === "Paid" ? "Pending" : "Paid";

  await db
    .update(payment)
    .set({ paymentStatus: newStatus })
    .where(eq(payment.id, paymentId));

  // If toggling to Paid, also update team payment status
  if (existing.teamId) {
    await db
      .update(teams)
      .set({ paymentStatus: newStatus })
      .where(eq(teams.id, existing.teamId));
  }

  return { paymentStatus: newStatus };
}
