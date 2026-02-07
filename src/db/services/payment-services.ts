import db from "~/db";
import { participants, payment, teams } from "~/db/schema";
import { AppError } from "~/lib/errors/app-error";
import type { CreateOrderInput, VerifyAndSavePaymentInput } from "~/lib/validation/payment";
import { razorPay } from "~/lib/razorpay/config";
import { eq } from "drizzle-orm";
import { verifyRazorpaySignature } from "~/lib/razorpay/verify";
import { env } from "~/env";

const envAmount = env.HACKFEST_AMOUNT;

export async function createOrder(data: CreateOrderInput) {
    const user = await db.query.participants.findFirst({
        where: eq(participants.id, data.sessionUserId),
        with: {
            payments: true,
        },
        columns: {
            isLeader: true,
            id: true,
        }
    });

    if (!user) throw new AppError("USER_NOT_FOUND", 404);

    if (!user.isLeader) {
        throw new AppError("ONLY_LEADER_CAN_CREATE_PAYMENT_ORDER", 400);
    }

    const team = await db.query.teams.findFirst({
        where: eq(teams.id, data.teamId),
        with: {
            payments: true,
            users: true,
        },
        columns: {
            id: true,
            name: true,
            leaderId: true,
            isCompleted: true,
            paymentStatus: true,
        }
    });

    if (!team) throw new AppError("TEAM_NOT_FOUND", 404);

    if (team.leaderId !== user.id) {
        throw new AppError("ONLY_LEADER_CAN_CREATE_PAYMENT_ORDER", 400);
    }

    if (!team.isCompleted) {
        throw new AppError("TEAM_NOT_COMPLETED", 400);
    }

    const hasPaidPaymentInPayments = team.payments?.some(p => p.paymentStatus === "Paid");
    const hasPaidPaymentAsPerStatus = team.paymentStatus === "Paid";

    if (hasPaidPaymentInPayments || hasPaidPaymentAsPerStatus) {
        throw new AppError("PAYMENT_ALREADY_COMPLETED", 400);
    }

    const amount: number = Number(envAmount ?? 350);

    const TO_BE_PAID = team.users.length * amount;
    const CURRENCY = "INR";
    const PAYMENT_CAPTURE = true;
    const RECEIPT = `receipt_${data.teamId.substring(0, 5)}_${Date.now()}`;

    try {
        const order = await razorPay.orders.create({
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
            paymentName: "HACKFEST_26_PAYMENT",
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
        }
    } catch (error) {
        console.error("Razorpay order creation failed:", error);
        throw new AppError("FAILED_TO_CREATE_PAYMENT", 500);
    }
}

export async function savePayment(data: VerifyAndSavePaymentInput) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const isValid = verifyRazorpaySignature(
        body,
        razorpaySignature,
        env.RAZORPAY_SECRET!
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
        }
        else if (!existingPaidPayment && existingPendingPayment) {
            const [updatedResult] = await db.update(payment).set({
                paymentStatus: "Paid",
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
            }).where(eq(payment.id, existingPendingPayment.id)).returning();
            paymentData = updatedResult;
            if (existingPendingPayment.teamId) {
                await db.update(teams).set({
                    paymentStatus: "Paid",
                }).where(eq(teams.id, existingPendingPayment.teamId));
            }
        }
        else if (!existingPaidPayment && !existingPendingPayment) {
            const [insertedResult] = await db.insert(payment).values({
                paymentName: data.paymentName,
                paymentType: data.paymentType,
                amount: data.amount.toString(),
                paymentStatus: "Paid",
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
                userId: null, // Ah have purposely set to null as this case will never occur because createOrder will connect the payment to a user
                teamId: null,
            }).returning();
            paymentData = insertedResult;
        }

        return { success: true, paymentDbId: paymentData?.id, paymentRazorpayId: paymentData?.razorpayPaymentId };
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
    sessionUserId: number,
    paymentSignature?: string,
    teamId?: string,
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
        });
        return {
            success: true,
        }
    }

    if (paymentInDb.paymentStatus === "Pending") {
        const updatedPayment = await db.update(payment).set({
            paymentStatus: "Paid",
            razorpayPaymentId: paymentId,
            razorpaySignature: paymentSignature,
        }).where(eq(payment.id, paymentInDb.id)).returning();
        if (teamId) {
            await db.update(teams).set({
                paymentStatus: "Paid",
            }).where(eq(teams.id, teamId));
        }
        return {
            success: true,
        }
    }

    if (paymentInDb.paymentStatus === "Paid") {
        if (teamId) {
            await db.update(teams).set({
                paymentStatus: "Paid",
            }).where(eq(teams.id, teamId));
        }
        return {
            success: true,
        }
    }

    return {
        success: false,
    }
}
