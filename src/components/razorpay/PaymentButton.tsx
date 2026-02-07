import Script from "next/script";
import { useSession } from "next-auth/react";
import { forwardRef } from "react";
import { env } from "~/env";
import { Button, type ButtonProps } from "../ui/button";

const PaymentButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    onStart?: () => void;
    description: string;
    extraClassName?: string;
    onSuccess: (paymentId: string) => void;
    onFailure: (error?: string) => void;
    onEnd?: () => void;
  } & (
      | {
          paymentType: "EVENT";
          amountInINR: number;
          teamId: string;
        }
      | {
          paymentType: "MEMBERSHIP";
          amountInINR?: never;
          teamId?: never;
        }
    )
>(
  (
    {
      onStart,
      description,
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
    const session = useSession();

    if (!session || !session.data?.user) {
      return (
        <Button
          ref={ref}
          {...props}
          disabled
          className="bg-gray-500 text-white cursor-not-allowed"
        >
          Please login to make a payment
        </Button>
      );
    }

    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />

        <Button
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
                sessionUserId: session.data.user.id, // TODO [RAHUL] : ADD USER ID TO SESSION
              }),
            });
            const orderData = await order.json();
            if (!orderData || !orderData.orderId) {
              console.error("Failed to create order", orderData);
              if (orderData.error) {
                onFailure(orderData.error);
              } else {
                onFailure();
              }
              return;
            }

            console.log("Order created successfully", orderData);

            const paymentObj = new window.Razorpay({
              key: env.NEXT_PUBLIC_RAZORPAY_API_KEY_ID || "",
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
                sessionUserId: session.data.user.id,
              },
              theme: {
                color: "#3399cc",
              },
              prefill: {
                name: session.data.user?.name || "",
                email: session.data.user?.email || "",
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
                      sessionUserId: session.data.user.id,
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
                  onSuccess(paymentData.paymentDbId);
                } catch (error) {
                  console.error("Error saving payment", error);
                  onFailure();
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
