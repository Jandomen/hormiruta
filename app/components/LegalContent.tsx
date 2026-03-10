'use client';

import React from 'react';
import { ScrollText, ShieldCheck, Scale, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const PrivacyPolicy = () => (
    <div className="space-y-8 text-left p-2">
        <section className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-info" />
                <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">Aviso de Privacidad</h3>
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                Jandosoft (en adelante, "Hormiruta"), con domicilio en Ciudad de México, es responsable del tratamiento de sus datos personales.
            </p>
        </section>

        <section className="space-y-3">
            <h4 className="text-[10px] font-black text-info uppercase tracking-widest">1. Datos que Recabamos</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
                Recopilamos datos de geolocalización en tiempo real para el funcionamiento de la ruta, nombre del operador, correo electrónico y datos de contacto de clientes para facilitar las entregas.
            </p>
        </section>

        <section className="space-y-3">
            <h4 className="text-[10px] font-black text-info uppercase tracking-widest">2. Finalidad del Tratamiento</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
                Sus datos son utilizados exclusivamente para:
            </p>
            <ul className="space-y-2 pl-4">
                <li className="text-[11px] text-white/50 flex items-start gap-2 italic">
                    <span className="text-info">•</span> Optimización de rutas logísticas.
                </li>
                <li className="text-[11px] text-white/50 flex items-start gap-2 italic">
                    <span className="text-info">•</span> Gestión de suscripciones y pagos vía Stripe.
                </li>
                <li className="text-[11px] text-white/50 flex items-start gap-2 italic">
                    <span className="text-info">•</span> Envío de alertas de geofencing y SOS.
                </li>
            </ul>
        </section>

        <section className="space-y-3">
            <h4 className="text-[10px] font-black text-info uppercase tracking-widest">3. Derechos ARCO</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
                Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos enviando un correo a soporte@hormiruta.com
            </p>
        </section>
    </div>
);

export const TermsConditions = () => (
    <div className="space-y-8 text-left p-2">
        <section className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
                <Scale className="w-5 h-5 text-info" />
                <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">Términos y Condiciones</h3>
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                Última actualización: Marzo 2026. Al utilizar Hormiruta, usted acepta los siguientes términos.
            </p>
        </section>

        <section className="space-y-3">
            <h4 className="text-[10px] font-black text-info uppercase tracking-widest">1. Uso del Servicio</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
                Hormiruta se reserva el derecho de suspender cuentas que hagan uso indebido del optimizador o intenten vulnerar la seguridad de la plataforma. La precisión de las rutas depende de servicios de terceros (Google Maps).
            </p>
        </section>

        <section className="space-y-3">
            <h4 className="text-[10px] font-black text-info uppercase tracking-widest">2. Suscripciones y Pagos</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
                El plan recurrente tiene un costo de $199 MXN mensuales. Las cancelaciones deben realizarse antes del próximo ciclo de facturación para evitar cargos adicionales. No hay reembolsos parciales.
            </p>
        </section>

        <section className="space-y-3">
            <h4 className="text-[10px] font-black text-info uppercase tracking-widest">3. Responsabilidad</h4>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
                Hormiruta no se hace responsable por multas de tránsito, accidentes o retrasos en las entregas derivados del uso de la aplicación. El conductor es responsable en todo momento de la operación segura del vehículo.
            </p>
        </section>

        <div className="p-4 bg-info/5 rounded-2xl border border-info/10 text-[9px] text-info/60 uppercase font-black tracking-widest text-center mt-6 italic">
            Al continuar navegando aceptas estos acuerdos legales.
        </div>
    </div>
);
