"use client";

/**
 * @component StripeCheckout
 * @author Alejandro Serrano / Jandosoft
 * @copyright (c) 2026 Alejandro Serrano. All rights reserved.
 * @description Formulario seguro de pago integrado con Stripe Elements para planes HormiRuta.
 */
import React, { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export default function StripeCheckout({
    amount,
    planName,
    onSuccess,
    onCancel
}: {
    amount: number;
    planName: string;
    onSuccess: () => void;
    onCancel: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/pricing?status=success`,
            },
            redirect: "if_required",
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                setMessage(error.message || "Ocurrió un error con la tarjeta.");
            } else {
                setMessage("Ocurrió un error inesperado.");
            }
        } else {

            onSuccess();
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 text-sm">Plan Seleccionado</span>
                    <span className="text-white font-bold">{planName}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-white/60 text-sm">Total a pagar</span>
                    <span className="text-info font-black text-xl">${amount} MXN</span>
                </div>
            </div>

            <PaymentElement id="payment-element" options={{ layout: "tabs" }} />

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {message}
                </motion.div>
            )}

            <div className="flex flex-col gap-3">
                <button
                    disabled={isLoading || !stripe || !elements}
                    id="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-info to-blue-600 text-dark font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-info/20 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5" />
                            Pagar Ahora
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="w-full py-2 text-xs text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                    Cancelar
                </button>
            </div>

            <p className="text-[10px] text-center text-white/20 mt-4 leading-relaxed">
                Tus pagos se procesan de forma segura a través de Stripe.<br />
                No almacenamos los datos de tu tarjeta.
            </p>
        </form>
    );
}
