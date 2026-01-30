import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
            <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-100">
                <h1 className="text-4xl font-extrabold text-teal-800 mb-8">Política de Privacidad de Hormiruta</h1>
                <p className="text-slate-500 mb-6 italic">Última actualización: 29 de enero de 2026</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-700 mb-4">1. Introducción</h2>
                    <p className="leading-relaxed">
                        En Hormiruta, valoramos y respetamos su privacidad. Esta política describe cómo recopilamos, utilizamos y protegemos sus datos personales cuando utiliza nuestra aplicación móvil y servicios web.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-700 mb-4">2. Datos que recopilamos</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Ubicación:</strong> Recopilamos datos de ubicación precisa y aproximada para permitir la funcionalidad de trazado de rutas y optimización logística.</li>
                        <li><strong>Información de Cuenta:</strong> Nombre, correo electrónico y foto de perfil (vía Google Auth).</li>
                        <li><strong>Información Financiera:</strong> Procesamos pagos a través de proveedores seguros (Stripe). No almacenamos directamente sus números de tarjeta en nuestros servidores.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-700 mb-4">3. Uso de la Información</h2>
                    <p className="leading-relaxed">
                        Utilizamos su información exclusivamente para la funcionalidad principal de la app:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Calcular rutas óptimas.</li>
                        <li>Gestionar suscripciones y pagos.</li>
                        <li>Permitir el envío de alertas SOS en caso de emergencia.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-teal-700 mb-4">4. Seguridad</h2>
                    <p className="leading-relaxed">
                        Sus datos se transmiten mediante protocolos de cifrado seguros (HTTPS) y se almacenan en bases de datos protegidas. No compartimos sus datos personales con terceros para fines publicitarios.
                    </p>
                </section>

                <section className="mb-8 border-t border-slate-100 pt-8">
                    <h2 className="text-2xl font-bold text-teal-700 mb-4">5. Contacto</h2>
                    <p className="leading-relaxed">
                        Si tiene alguna duda sobre nuestra política, puede contactarnos en:
                        <br />
                        <span className="text-teal-600 font-semibold">soporte@hormiruta.vercel.app</span>
                    </p>
                </section>

                <div className="mt-12 text-center text-slate-400 text-sm">
                    &copy; 2026 Hormiruta. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
}
