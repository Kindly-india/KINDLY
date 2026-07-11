"use client"

import { useState } from "react"
import Script from "next/script"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { X, Loader2, ShieldCheck } from "lucide-react"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface Props {
  eventId: string
  eventTitle: string
  ticketPricePaise: number
  onSuccess: () => void
  onClose: () => void
}

export function EventCheckoutModal({ eventId, eventTitle, ticketPricePaise, onSuccess, onClose }: Props) {
  const [scriptReady, setScriptReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const rupees = (ticketPricePaise / 100).toLocaleString("en-IN")

  const handlePay = async () => {
    if (!scriptReady || processing) return
    setProcessing(true)
    try {
      const order = await api.createPaymentOrder(eventId)

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "KINDLY",
        description: eventTitle,
        theme: { color: "#80242a" },
        handler: async (response: any) => {
          try {
            await api.verifyPayment(eventId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            toast.success("Payment successful — you're registered!")
            onSuccess()
          } catch (err: any) {
            toast.error(err.message || "Payment could not be confirmed. Contact support if you were charged.")
          } finally {
            setProcessing(false)
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      })

      razorpay.on("payment.failed", () => {
        toast.error("Payment failed — please try again.")
        setProcessing(false)
      })

      razorpay.open()
    } catch (err: any) {
      toast.error(err.message || "Could not start payment")
      setProcessing(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />

      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full md:max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl md:rounded-3xl rounded-t-3xl px-6 pt-6 pb-10 md:pb-8 shadow-2xl shadow-black/20 dark:shadow-black/60 border-t border-black/5 dark:border-white/10 z-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5 md:hidden" />

          <div className="flex items-start justify-between mb-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Complete Your Booking</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Secure payment via Razorpay</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-muted rounded-2xl p-4 mb-6 border border-border">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-bold text-foreground">{eventTitle}</span>
            </p>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-xs text-muted-foreground">Ticket price</span>
              <span className="text-2xl font-black text-foreground">₹{rupees}</span>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={!scriptReady || processing}
            className="w-full h-12 bg-[#ff6b6b] hover:bg-[#ee5a5a] text-white font-black rounded-2xl text-sm shadow-lg hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 ease-out flex items-center justify-center gap-2"
          >
            {processing || !scriptReady ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ₹${rupees}`}
          </button>
        </div>
      </div>
    </>
  )
}
