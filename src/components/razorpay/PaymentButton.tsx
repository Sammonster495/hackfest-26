"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { forwardRef } from "react";

import { Button, type ButtonProps } from "../ui/button";

interface User {
  id: string;
  name: string;
  email: string;
}

const PaymentButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    onStart?: () => void;
    description: string;
    user: User;
    extraClassName?: string;
    onSuccess?: (paymentId: string) => void;
    onFailure?: (error?: string) => void;
    onEnd?: () => void;
  } & {
    paymentType: "EVENT" | "PARTICIPATION";
    amountInINR: number;
    teamId: string;
  }
>(
  (
    {
      onStart,
      description,
      user,
      extraClassName,
      paymentType,
      amountInINR,
      teamId,
      onFailure,
      onSuccess,
      onEnd,
      ...props
    },
    ref,
  ) => {
    const router = useRouter();

    const handleSuccess =
      onSuccess ??
      ((paymentId: string) => {
        console.log("Payment successful", paymentId);
        router.refresh();
      });

    const handleFailure =
      onFailure ??
      ((error?: string) => {
        console.error("Payment failed", error);
      });

    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />

        <Button
          name="Pay Now"
          ref={ref}
          className={`z-20 flex-1 font-bold text-md ${extraClassName}`}
          onClick={async () => {
            if (onStart) {
              onStart();
            }

            const order = await fetch(`/api/razorpay/create-order`, {
              method: "POST",
              body: JSON.stringify({
                paymentType: paymentType,
                amountInINR: amountInINR,
                teamId: teamId,
                sessionUserId: user.id,
              }),
            });
            const orderData = await order.json();
            if (!orderData || !orderData.orderId) {
              console.error("Failed to create order", orderData);
              if (orderData.error) {
                handleFailure(orderData.error);
              } else {
                handleFailure();
              }
              return;
            }

            console.log("Order created successfully", orderData);

            const paymentObj = new window.Razorpay({
              key: process.env.NEXT_PUBLIC_RAZORPAY_API_KEY_ID || "",
              order_id: orderData.orderId,
              amount: orderData.orderAmount,
              currency: orderData.orderCurrency,
              name: "HackFest",
              description: description,
              image: "", // TODO [RAHUL] : ADD IMAGE
              notes: {
                address: "NMAM Institute of Technology, Nitte, Karnataka",
                paymentType: paymentType,
                paymentName: description,
                teamId: teamId,
                sessionUserId: user.id,
              },
              theme: {
                color: "#3399cc",
              },
              prefill: {
                name: user.name || "",
                email: user.email || "",
              },
              handler: async (response) => {
                console.log("Payment response received", response);
                try {
                  const payment = await fetch(`/api/razorpay/save-payment`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      paymentType: paymentType,
                      amountInINR: amountInINR,
                      teamId: teamId,
                      amount: orderData.orderAmount,
                      paymentName: description,
                      razorpayOrderId: response.razorpay_order_id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                      sessionUserId: user.id,
                    }),
                  });
                  const paymentData = await payment.json();
                  if (
                    !paymentData ||
                    !paymentData.paymentDbId ||
                    paymentData.razorpayPaymentId
                  ) {
                    console.error("Failed to save payment", paymentData);
                    throw new Error("Payment save failed");
                  }
                  console.log("Payment saved successfully", paymentData);
                  handleSuccess(paymentData.paymentDbId);
                } catch (error) {
                  console.error("Error saving payment", error);
                  handleFailure();
                  return;
                }
              },
            });
            paymentObj.open();
            if (onEnd) {
              onEnd();
            }
          }}
          {...props}
        />
      </>
    );
  },
);

PaymentButton.displayName = "Pay Now";
export default PaymentButton;
