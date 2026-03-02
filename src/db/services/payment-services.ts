import { and, asc, count, desc, eq, type SQL } from "drizzle-orm";
import db from "~/db";
import {
  eventParticipants,
  events,
  eventTeams,
  participants,
  payment,
  teams,
} from "~/db/schema";
import { env } from "~/env";
import { AppError } from "~/lib/errors/app-error";
import { getRazorpayClient } from "~/lib/razorpay/config";
import { verifyRazorpaySignature } from "~/lib/razorpay/verify";
import { calculateTotalAmount } from "~/lib/utils";
import type {
  CreateOrderInput,
  VerifyAndSavePaymentInput,
} from "~/lib/validation/payment";

const envAmount = env.HACKFEST_AMOUNT;

export async function createOrder(data: CreateOrderInput) {
  if (data.paymentType === "PARTICIPATION") {
    const user = await db.query.participants.findFirst({
      where: eq(participants.id, data.sessionUserId),
      with: { payments: true },
      columns: { id: true },
    });
    if (!user) throw new AppError("USER_NOT_FOUND", 404);

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, data.teamId),
      with: { payments: true, users: true },
      columns: {
        id: true,
        name: true,
        leaderId: true,
        isCompleted: true,
        paymentStatus: true,
      },
    });
    if (!team) throw new AppError("TEAM_NOT_FOUND", 404);

    if (team.leaderId !== user.id) {
      throw new AppError("ONLY_LEADER_CAN_CREATE_PAYMENT_ORDER", 400);
    }
    if (!team.isCompleted) {
      throw new AppError("TEAM_NOT_COMPLETED", 400);
    }

    const hasPaidPaymentInPayments = team.payments?.some(
      (p) => p.paymentStatus === "Paid",
    );
    const hasPaidPaymentAsPerStatus = team.paymentStatus === "Paid";
    if (hasPaidPaymentInPayments || hasPaidPaymentAsPerStatus) {
      throw new AppError("PAYMENT_ALREADY_COMPLETED", 400);
    }

    const amount: number = Number(envAmount ?? 400);
    const TO_BE_PAID = calculateTotalAmount(team.users.length, amount, 2);
    const CURRENCY = "INR";
    const PAYMENT_CAPTURE = true;
    const RECEIPT = `receipt_${data.teamId.substring(0, 5)}_${Date.now()}`;

    try {
      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: TO_BE_PAID * 100, // ah 100 for paisa
        currency: CURRENCY,
        receipt: RECEIPT,
        payment_capture: PAYMENT_CAPTURE,
        notes: {
          teamId: team.id,
          teamName: team.name,
          userId: user.id,
          paymentType: data.paymentType,
        },
      });

      await db.insert(payment).values({
        paymentName: "HACKFEST_26_PAYMENT - PARTICIPATION",
        paymentType: data.paymentType,
        amount: TO_BE_PAID.toString(),
        paymentStatus: "Pending",
        razorpayOrderId: order.id,
        razorpayPaymentId: null,
        razorpaySignature: null,
        userId: user.id,
        teamId: team.id,
      });

      return {
        success: true,
        orderId: order.id,
        orderAmount: order.amount,
        orderCurrency: order.currency,
      };
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new AppError("FAILED_TO_CREATE_PAYMENT", 500);
    }
  } else if (data.paymentType === "EVENT") {
    if (!data.eventId) throw new AppError("EVENT_ID_REQUIRED", 400);

    const event = await db.query.events.findFirst({
      where: eq(events.id, data.eventId),
    });
    if (!event) throw new AppError("EVENT_NOT_FOUND", 404);

    const eventTeam = await db.query.eventTeams.findFirst({
      where: eq(eventTeams.id, data.teamId),
      columns: { id: true, name: true, paymentStatus: true, isComplete: true },
    });
    if (!eventTeam) throw new AppError("TEAM_NOT_FOUND", 404);

    const userParticipant = await db.query.eventParticipants.findFirst({
      where: and(
        eq(eventParticipants.eventId, data.eventId),
        eq(eventParticipants.userId, data.sessionUserId),
      ),
    });

    if (!userParticipant)
      throw new AppError("USER_NOT_REGISTERED_FOR_EVENT", 400);
    if (!userParticipant.isLeader)
      throw new AppError("ONLY_LEADER_CAN_CREATE_PAYMENT_ORDER", 400);

    if (!eventTeam.isComplete) {
      throw new AppError("TEAM_NOT_COMPLETED", 400);
    }

    if (eventTeam.paymentStatus === "Paid") {
      throw new AppError("PAYMENT_ALREADY_COMPLETED", 400);
    }

    const existingPayments = await db.query.payment.findMany({
      where: and(
        eq(payment.eventTeamId, eventTeam.id),
        eq(payment.paymentStatus, "Paid"),
      ),
    });
    if (existingPayments.length > 0)
      throw new AppError("PAYMENT_ALREADY_COMPLETED", 400);

    const TO_BE_PAID = event.hfAmount;

    if (TO_BE_PAID <= 0) {
      throw new AppError("PAYMENT_NOT_REQUIRED", 400);
    }

    const CURRENCY = "INR";
    const PAYMENT_CAPTURE = true;
    const RECEIPT = `receipt_${eventTeam.id.substring(0, 5)}_${Date.now()}`;

    try {
      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: TO_BE_PAID * 100,
        currency: CURRENCY,
        receipt: RECEIPT,
        payment_capture: PAYMENT_CAPTURE,
        notes: {
          eventTeamId: eventTeam.id,
          teamName: eventTeam.name,
          eventUserId: userParticipant.id,
          eventId: event.id,
          paymentType: data.paymentType,
        },
      });

      await db.insert(payment).values({
        paymentName: `${event.title} - HACKFEST_26`,
        paymentType: data.paymentType,
        amount: TO_BE_PAID.toString(),
        paymentStatus: "Pending",
        razorpayOrderId: order.id,
        razorpayPaymentId: null,
        razorpaySignature: null,
        eventUserId: userParticipant.id,
        eventTeamId: eventTeam.id,
      });

      return {
        success: true,
        orderId: order.id,
        orderAmount: order.amount,
        orderCurrency: order.currency,
      };
    } catch (error) {
      console.error("Razorpay EVENT order creation failed:", error);
      throw new AppError("FAILED_TO_CREATE_PAYMENT", 500);
    }
  } else {
    throw new AppError("INVALID_PAYMENT_TYPE", 400);
  }
}

export async function savePayment(data: VerifyAndSavePaymentInput) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

  if (!env.RAZORPAY_SECRET) {
    throw new AppError("RAZORPAY_SECRET is not configured", 500);
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const isValid = verifyRazorpaySignature(
    body,
    razorpaySignature,
    env.RAZORPAY_SECRET,
  );

  if (!isValid) {
    throw new AppError("Invalid payment signature", 400);
  }

  const existingPaidPayment = await db.query.payment.findFirst({
    where: eq(payment.razorpayPaymentId, razorpayPaymentId),
  });

  const existingPendingPayment = await db.query.payment.findFirst({
    where: eq(payment.razorpayOrderId, razorpayOrderId),
  });

  let paymentData = null;

  try {
    if (existingPaidPayment) {
      paymentData = existingPaidPayment;
    } else if (!existingPaidPayment && existingPendingPayment) {
      const [updatedResult] = await db
        .update(payment)
        .set({
          paymentStatus: "Paid",
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        })
        .where(eq(payment.id, existingPendingPayment.id))
        .returning();
      paymentData = updatedResult;
      if (
        existingPendingPayment.teamId &&
        existingPendingPayment.paymentType === "PARTICIPATION"
      ) {
        await db
          .update(teams)
          .set({
            paymentStatus: "Paid",
          })
          .where(eq(teams.id, existingPendingPayment.teamId));
      } else if (
        existingPendingPayment.eventTeamId &&
        existingPendingPayment.paymentType === "EVENT"
      ) {
        await db
          .update(eventTeams)
          .set({
            paymentStatus: "Paid",
          })
          .where(eq(eventTeams.id, existingPendingPayment.eventTeamId));
      }
    } else if (!existingPaidPayment && !existingPendingPayment) {
      const [insertedResult] = await db
        .insert(payment)
        .values({
          paymentName: data.paymentName,
          paymentType: data.paymentType,
          amount: data.amount.toString(),
          paymentStatus: "Paid",
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          userId: null,
          teamId: null,
          eventTeamId: null,
          eventUserId: null,
        })
        .returning();
      paymentData = insertedResult;
    }

    return {
      success: true,
      paymentDbId: paymentData?.id,
      paymentRazorpayId: paymentData?.razorpayPaymentId,
    };
  } catch (error) {
    console.error("Payment save failed:", error);
    throw new AppError("Failed to save payment record", 500);
  }
}

export async function webhookCapture(
  paymentId: string,
  orderId: string,
  amount: number,
  paymentType: string,
  paymentName: string,
  _sessionUserId: number,
  paymentSignature?: string,
  teamId?: string,
  eventTeamId?: string,
) {
  const paymentInDb = await db.query.payment.findFirst({
    where: eq(payment.razorpayOrderId, orderId),
  });

  if (!paymentInDb) {
    await db.insert(payment).values({
      paymentName,
      paymentType,
      amount: amount.toString(),
      paymentStatus: "Paid",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: paymentSignature,
      userId: null,
      teamId: null,
      eventUserId: null,
      eventTeamId: null,
    });
    return {
      success: true,
    };
  }

  if (paymentInDb.paymentStatus === "Pending") {
    const _updatedPayment = await db
      .update(payment)
      .set({
        paymentStatus: "Paid",
        razorpayPaymentId: paymentId,
        razorpaySignature: paymentSignature,
      })
      .where(eq(payment.id, paymentInDb.id))
      .returning();
    if (teamId && paymentInDb.paymentType === "PARTICIPATION") {
      await db
        .update(teams)
        .set({
          paymentStatus: "Paid",
        })
        .where(eq(teams.id, teamId));
    } else if (eventTeamId && paymentInDb.paymentType === "EVENT") {
      await db
        .update(eventTeams)
        .set({
          paymentStatus: "Paid",
        })
        .where(eq(eventTeams.id, eventTeamId));
    }
    return {
      success: true,
    };
  }

  if (paymentInDb.paymentStatus === "Paid") {
    if (teamId && paymentInDb.paymentType === "PARTICIPATION") {
      await db
        .update(teams)
        .set({
          paymentStatus: "Paid",
        })
        .where(eq(teams.id, teamId));
    } else if (eventTeamId && paymentInDb.paymentType === "EVENT") {
      await db
        .update(eventTeams)
        .set({
          paymentStatus: "Paid",
        })
        .where(eq(eventTeams.id, eventTeamId));
    }
    return {
      success: true,
    };
  }

  return {
    success: false,
  };
}

export async function getPayments({
  page = 1,
  limit = 20,
  status,
  search,
  sortOrder = "desc",
  type = "PARTICIPATION",
}: {
  page?: number;
  limit?: number;
  status?: "Pending" | "Paid" | "Refunded";
  search?: string;
  sortOrder?: "asc" | "desc";
  type?: "PARTICIPATION" | "EVENT" | "ALL";
}) {
  const conditions: SQL[] = [];

  if (status) {
    conditions.push(eq(payment.paymentStatus, status));
  }

  if (type !== "ALL") {
    conditions.push(eq(payment.paymentType, type));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = (page - 1) * limit;

  const [totalResult, paymentsResult] = await Promise.all([
    db.select({ total: count() }).from(payment).where(where),
    db.query.payment.findMany({
      where,
      with: {
        team: {
          columns: { id: true, name: true },
        },
        user: {
          columns: { id: true, name: true, email: true },
        },
        eventTeam: {
          columns: { id: true, name: true },
        },
        eventUser: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
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

  if (search) {
    const searchLower = search.toLowerCase();
    filteredPayments = paymentsResult.filter(
      (p) =>
        p.team?.name?.toLowerCase().includes(searchLower) ||
        p.user?.name?.toLowerCase().includes(searchLower) ||
        p.user?.email?.toLowerCase().includes(searchLower) ||
        p.eventTeam?.name?.toLowerCase().includes(searchLower) ||
        p.eventUser?.user?.name?.toLowerCase().includes(searchLower) ||
        p.eventUser?.user?.email?.toLowerCase().includes(searchLower) ||
        p.razorpayOrderId?.toLowerCase().includes(searchLower),
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
