const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V10 - Pasarela Provider Activa) Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// CONFIGURACIÓN CENTRAL
const NOMBRE_BOT = "Pagocliente_bot";
const GRUPO_PAGOS = parseInt(process.env.GRUPO_CONTROL_ID);
const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN ? process.env.PROVIDER_TOKEN.trim() : "";

// 1. MODO INLINE (Cuando la modelo genera la orden en cualquier chat privado)
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || "Modelo";

    if (!monto || isNaN(monto)) return;

    // --- NOTIFICACIÓN INTERNA AL GRUPO DE CONTROL ---
    const nombreModelo = modelo.toUpperCase();
    const avisoOrden = `🔔 **ÓRDEN GENERADA EN CHAT**\n👩‍🦰 Modelo: ${nombreModelo}\n💰 Monto: \`${monto}\` USDT\n📌 _Enviada al cliente en chat privado_`;
    try { await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrden); } catch (err) { console.error(err); }

    // Usamos el formato nativo de facturas integradas para consultas inline
    const resultado = [{
        type: 'article',
        id: `pago_${monto}_${modelo}_${Date.now()}`,
        title: `💎 ORDEN DE PAGO / PAYMENT ORDER 💎`,
        description: `Enviar orden de ${monto} USDT para ${modelo}`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                          `💰 **Monto a pagar / Amount:** \`${monto}\` USDT\n` +
                          `🏦 **Red / Network:** TON Network (USDT)\n\n` +
                          `🇪🇸 Presiona el botón de abajo para pagar de forma segura.\n` +
                          `🇺🇸 Press the button below to pay securely.`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            // Este link redirige al cliente al chat del bot pasándole los parámetros para que se le despliegue su factura centralizada de forma automática
            [Markup.button.url(`🚀 IR A PAGAR / GO TO PAY ${monto} USDT`, `https://t.me/${NOMBRE_BOT}?start=pay_${monto}_${modelo}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 4. MANEJADOR DEL ARRANQUE EN CHAT PRIVADO (Procesa el redireccionamiento y envía la factura real)
bot.start(async (ctx) => {
    const startPayload = ctx.startPayload; // Captura el "pay_monto_modelo"
    
    if (startPayload && startPayload.startsWith('pay_')) {
        const partes = startPayload.split('_');
        const monto = parseFloat(partes[1]);
        const modelo = partes[2] || "Servicio";

        if (!isNaN(monto)) {
            // Estructura de precios nativa de Telegram (monto * 100 para centavos si aplica, pero en USDT suele ser directo o con 6/2 decimales dependiendo del provider)
            // La mayoría de providers de USDT en TG toman el monto entero x100. Modifica si tu pasarela usa otra escala.
            const prices = [{ label: `Servicio ${modelo}`, amount: Math.round(monto * 100) }];

            return await ctx.replyWithInvoice({
                title: `💎 PAGO CENTRALIZADO: ${modelo.toUpperCase()}`,
                description: `🇪🇸 Pago seguro de ${monto} USDT para continuar el servicio.\n🇺🇸 Secure payment of ${monto} USDT to continue the service.`,
                payload: `invoice_${modelo}_${Date.now()}`,
                provider_token: PROVIDER_TOKEN,
                currency: 'XTR', // Cambia por 'USDT' o la moneda que use tu proveedor específico si no es Stars/Crypto.
                prices: prices,
                start_parameter: `pay_${monto}_${modelo}`,
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.pay(`🚀 PAGAR / PAY ${monto} USDT NOW`)]
                ]).reply_markup
            });
        }
    }

    ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí para habilitar tu servicio de inmediato o usa el enlace que te envió la modelo.");
});

// 2. COMANDO TRADICIONAL EN CHAT DIRECTO (/cobrar 20 Maria)
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = parseFloat(partes[1]);
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    const prices = [{ label: `Servicio ${modelo}`, amount: Math.round(monto * 100) }];

    try {
        await ctx.replyWithInvoice({
            title: `💎 PAGO CENTRALIZADO: ${modelo.toUpperCase()}`,
            description: `🇪🇸 Pago seguro de ${monto} USDT.\n🇺🇸 Secure payment of ${monto} USDT.`,
            payload: `invoice_${modelo}_${Date.now()}`,
            provider_token: PROVIDER_TOKEN,
            currency: 'XTR', // Ajústalo a la moneda asignada a tu PROVIDER_TOKEN
            prices: prices,
            start_parameter: `pay_${monto}_${modelo}`,
            reply_markup: Markup.inlineKeyboard([
                [Markup.button.pay(`🚀 PAGAR / PAY ${monto} USDT AHORA`)]
            ]).reply_markup
        });
    } catch (e) {
        console.error("Error enviando factura por comando:", e);
        ctx.reply("❌ Error al generar la pasarela de pago. Verifica los tokens.");
    }
});

// 3. RECEPCIÓN DE COMPROBANTES (Para clientes que pagan alternativamente o envían capture)
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción, espera un momento.");

    const reporte = `📸 **NUEVO COMPROBANTE RECIBIDO**\n` +
                    `👤 Cliente: ${user} (${username})\n` +
                    `🆔 ID Telegram: \`${ctx.from.id}\`\n` +
                    `⏳ Estado: Esperando revisión manual`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, reporte);
        await ctx.forwardMessage(GRUPO_PAGOS);
    } catch (err) {
        console.error("Error reenviando comprobante:", err);
    }
});

bot.launch({ dropPendingUpdates: true });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
