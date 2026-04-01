import { and, asc, count, desc, eq } from "drizzle-orm";
import { auth } from "~/auth/dashboard-config";
import db from "~/db";
import { getSiteSettings } from "~/db/data/siteSettings";
import {
  eventParticipants,
  events,
  eventTeams,
  payment,
  selected,
  teams,
} from "~/db/schema";
import { isAdmin } from "~/lib/auth/permissions";
import { AppError } from "~/lib/errors/app-error";
import { sendPaymentVerifiedEmail } from "~/lib/mail";

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
  if (team.paymentStatus === "Paid") {
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
      paymentType: "HACKFEST",
      amount: amount.toString(),
      paymentStatus: "Pending",
      paymentScreenshotUrl,
      paymentTransactionId,
      userId,
    })
    .returning({ id: payment.id });

  await db
    .update(teams)
    .set({ paymentId: inserted.id, paymentStatus: "Pending" })
    .where(eq(teams.id, teamId));

  return inserted;
}

export async function hasPendingPayment(teamId: string) {
  const existingTeam = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: { paymentStatus: true },
  });

  return existingTeam?.paymentStatus === "Pending";
}

export async function checkPayment(teamId: string) {
  const leaderUser = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    columns: { leaderId: true },
  });

  if (!leaderUser) {
    throw new AppError("TEAM_NOT_FOUND", 404);
  }

  const existingPayment = await db.query.payment.findFirst({
    where: eq(payment.userId, leaderUser.leaderId),
    columns: { paymentStatus: true },
  });

  if (!existingPayment) {
    return false;
  }
  return true;
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
          with: { users: { columns: { id: true } } },
        },
        eventTeam: {
          columns: { id: true, name: true },
          with: { members: { columns: { id: true } } },
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
        p.eventTeam?.name?.toLowerCase().includes(searchLower) ||
        p.user?.name?.toLowerCase().includes(searchLower) ||
        p.user?.email?.toLowerCase().includes(searchLower),
    );
  }

  const total = totalResult[0]?.total ?? 0;

  const processedPayments = filteredPayments.map((p) => {
    let defaultTeam = null;
    let memberCount = 0;

    if (p.paymentType === "EVENT" && p.eventTeam) {
      defaultTeam = { id: p.eventTeam.id, name: p.eventTeam.name };
      memberCount = p.eventTeam.members?.length || 0;
    } else if (p.team) {
      defaultTeam = { id: p.team.id, name: p.team.name };
      memberCount = p.team.users?.length || 0;
    }

    return {
      ...p,
      team: defaultTeam,
      memberCount,
      eventTeam: undefined,
    };
  });

  return {
    payments: processedPayments,
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", 401);
  }
  if (!isAdmin(session.dashboardUser)) {
    throw new AppError("UNAUTHORIZED", 401);
  }
  const existing = await db.query.payment.findFirst({
    where: eq(payment.id, paymentId),
    columns: { id: true, paymentStatus: true, paymentType: true },
    with: {
      team: { columns: { id: true, name: true } },
      eventTeam: { columns: { id: true, name: true, eventId: true } },
    },
  });

  if (!existing) {
    throw new AppError("PAYMENT_NOT_FOUND", 404, {
      title: "Payment not found",
    });
  }

  if (existing.paymentStatus === "Paid") {
    throw new AppError("PAYMENT_ALREADY_VERIFIED", 400, {
      title: "Already Verified",
      description:
        "This payment has already been verified and cannot be reverted.",
    });
  }

  const newStatus = "Paid";

  await db
    .update(payment)
    .set({ paymentStatus: newStatus })
    .where(eq(payment.id, paymentId));

  // If toggling to Paid, also update team payment status
  if (existing.paymentType === "EVENT" && existing.eventTeam?.id) {
    await db
      .update(eventTeams)
      .set({
        paymentStatus: newStatus,
        ...(newStatus === "Paid"
          ? { isComplete: true }
          : { isComplete: false }),
      })
      .where(eq(eventTeams.id, existing.eventTeam.id));
  } else if (existing.team?.id) {
    await db
      .update(teams)
      .set({ paymentStatus: newStatus })
      .where(eq(teams.id, existing.team.id));
  }

  try {
    let leaderUser: { name: string | null; email: string | null } | undefined;
    let teamName = "";
    let eventNameStr: string | undefined;

    if (existing.paymentType === "EVENT" && existing.eventTeam?.id) {
      const leader = await db.query.eventParticipants.findFirst({
        where: and(
          eq(eventParticipants.teamId, existing.eventTeam.id),
          eq(eventParticipants.isLeader, true),
        ),
        with: { user: true },
      });
      leaderUser = leader?.user;
      teamName = existing.eventTeam.name;

      if (existing.eventTeam.eventId) {
        const eventData = await db.query.events.findFirst({
          where: eq(events.id, existing.eventTeam.eventId),
          columns: { title: true },
        });
        eventNameStr = eventData?.title;
      }

      if (leaderUser?.email) {
        sendPaymentVerifiedEmail({
          to: leaderUser.email,
          leaderName: leaderUser.name || "Leader",
          teamName,
          eventName: eventNameStr,
        }).catch(console.error);
      }
    }
  } catch (error) {
    console.error("Failed to notify leader:", error);
  }

  return { paymentStatus: newStatus };
}

export async function getPaymentStats() {
  const totalConfirmedHackfestPaymentsResult = await db.query.payment.findMany({
    where: and(
      eq(payment.paymentType, "HACKFEST"),
      eq(payment.paymentStatus, "Paid"),
    ),
    columns: { amount: true },
  });

  const numberOfHFPaymentsConfirmed =
    totalConfirmedHackfestPaymentsResult.length;

  const totalConfirmedHackfestPayments =
    totalConfirmedHackfestPaymentsResult.reduce(
      (sum, p) => sum + parseInt(p.amount),
      0,
    );

  const totalPendingHackfestPaymentsResult = await db.query.payment.findMany({
    where: and(
      eq(payment.paymentType, "HACKFEST"),
      eq(payment.paymentStatus, "Pending"),
    ),
    columns: { amount: true },
  });

  const numberOfHFPaymentsPending = totalPendingHackfestPaymentsResult.length;

  const totalPendingHackfestPayments =
    totalPendingHackfestPaymentsResult.reduce(
      (sum, p) => sum + parseInt(p.amount),
      0,
    );

  const totalConfirmedEventPaymentsResult = await db.query.payment.findMany({
    where: and(
      eq(payment.paymentType, "EVENT"),
      eq(payment.paymentStatus, "Paid"),
    ),
    columns: { amount: true },
  });

  const numberOfEventPaymentsConfirmed =
    totalConfirmedEventPaymentsResult.length;

  const totalConfirmedEventPayments = totalConfirmedEventPaymentsResult.reduce(
    (sum, p) => sum + parseInt(p.amount),
    0,
  );

  const totalPendingEventPaymentsResult = await db.query.payment.findMany({
    where: and(
      eq(payment.paymentType, "EVENT"),
      eq(payment.paymentStatus, "Pending"),
    ),
    columns: { amount: true },
  });

  const numberOfEventPaymentsPending = totalPendingEventPaymentsResult.length;

  const totalPendingEventPayments = totalPendingEventPaymentsResult.reduce(
    (sum, p) => sum + parseInt(p.amount),
    0,
  );

  return {
    numberOfHFPaymentsConfirmed,
    numberOfHFPaymentsPending,
    numberOfEventPaymentsConfirmed,
    numberOfEventPaymentsPending,
    totalConfirmedHackfestPayments,
    totalPendingHackfestPayments,
    totalConfirmedEventPayments,
    totalPendingEventPayments,
  };
}
