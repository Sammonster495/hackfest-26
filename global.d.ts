interface RazorPayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: {
    address: string;
    paymentType?: string;
    sessionUserId?: string;
    teamId?: string;
    paymentName?: string;
  };
  theme: {
    color: string;
  };
}

interface RazorPay {
  open: () => void;
}

interface Window {
  Razorpay: new (options: RazorPayOptions) => RazorPay;
}
