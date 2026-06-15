const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

// Verificación de salud del contenedor en Render
app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V11 - Sistema Dual) Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// =========================================================================
// CONFIGURACIÓN CENTRAL DE TU BILLETERA (Todos los pagos van aquí)
// =========================================================================
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";

// ID del grupo para control de operaciones e ingresos
const GRUPO_PAGOS = parseInt(process.env.GRUPO_CONTROL_ID);

// 1. MODO INLINE (Escribiendo @Pagocliente_bot [monto] [modelo] en chats privados)
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || ctx.inlineQuery.from.first_name || "Modelo";

    if (!monto || isNaN(monto)) return;

    const nombreModelo = modelo.toUpperCase();
    
    // Equivalencia para Stars: 1 USDT suele calcularse comercialmente en unas 50 estrellas
    const montoStars = Math.round(monto * 50);

    // --- NOTIFICACIÓN INTERNA AL GRUPO DE CONTROL ---
    const avisoOrden = `🔔 **ÓRDEN MULTI-PAGO GENERADA**\n👩‍🦰 Modelo: ${nombreModelo}\n💰 Monto: \`${monto}\` USDT / \`${montoStars}\` XTR\n📌 _Esperando elección del cliente_`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrden);
    } catch (err) {
        console.error("Error enviando alerta al grupo en modo inline:", err);
    }
    // ------------------------------------------------

    const resultado = [{
        type: 'article',
        id: `multipago_${monto}_${modelo}_${Date.now()}`,
        title: `💎 ORDEN DE PAGO / PAYMENT ORDER 💎`,
        description: `Enviar orden de ${monto} USDT para ${modelo}`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${nombreModelo}** 💎\n\n` +
                          `💰 **Monto a pagar / Amount:** \`${monto}\` USDT o \`${montoStars}\` Estrellas\n` +
                          `🏦 **Red / Network:** TON Network / Telegram Stars\n\n` +
                          `🇪🇸 **Instrucciones:**\n` +
                          `Selecciona tu método de pago preferido abajo. Puedes pagar directamente con Crypto (Wallet/Tonkeeper) o usar tu tarjeta mediante Google Pay / Apple Pay (Estrellas).\n\n` +
                          `🇺🇸 **Instructions:**\n` +
                          `Select your preferred payment method below. You can pay directly with Crypto or use your card via Google Pay / Apple Pay (Stars).\n\n` +
                          `🔥 **¡Prepárate para la diversión! / Get ready for fun!** 🔥`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            // OPCIÓN 1: Cobro directo en USDT por la red TON
            [Markup.button.url(`🚀 CRYPTO: PAGAR ${monto} USDT (TON)`, `https://t.me/wallet?startattach=external_pay_${MI_BILLETERA}_${monto}`)],
            // OPCIÓN 2: Redirección segura para pago nativo con Tarjeta (Google Pay / Apple Pay)
            [Markup.button.url(`⭐ TARJETA: GOOGLE PAY / APPLE PAY`, `https://t.me/${NOMBRE_BOT}?start=stars_${montoStars}_${modelo}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 2. ARRANQUE DEL BOT Y PROCESADOR DE FACTURAS DE ESTRELLAS (/start payload)
bot.start(async (ctx) => {
    const startPayload = ctx.startPayload;
    
    // Si viene de la orden inline para pagar con Tarjeta/Stars ingresa aquí
    if (startPayload && startPayload.startsWith('stars_')) {
        const partes = startPayload.split('_');
        const stars = parseInt(partes[1]);
        const modelo = partes[2] || "Modelo";

        if (!isNaN(stars)) {
            try {
                return await ctx.replyWithInvoice({
                    title: `⭐ PAGO CON TARJETA / STARS: ${modelo.toUpperCase()}`,
                    description: `Procesado de forma segura mediante Apple Pay / Google Pay.`,
                    payload: `stars_invoice_${modelo}_${Date.now()}`,
                    provider_token: "", // OBLIGATORIO DEJAR VACÍO PARA TELEGRAM STARS
                    currency: "XTR",     // MONEDA OFICIAL PARA ESTRELLAS NATIIVAS
                    prices: [{ label: `Acceso Premium ${modelo}`, amount: stars }],
                    start_parameter: `pay_${stars}_${modelo}`,
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.pay(`💳 CONFIRMAR PAGO (${stars} STARS)`)]
                    ]).reply_markup
                });
            } catch (error) {
                console.error("Error al desplegar factura Stars:", error);
                return ctx.reply("❌ Hubo un error al iniciar la pasarela de Google/Apple Pay.");
            }
        }
    }

    // Mensaje estándar de bienvenida si no trae payload de pago
    ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí para habilitar tu servicio de inmediato.\n\n👋 Welcome! Send your payment screenshot here to activate your service immediately.");
});

// 3. COMANDO TRADICIONAL (Uso en el chat directo del bot: /cobrar 30 Maria)
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    const nombreModelo = modelo.toUpperCase();
    const montoStars = Math.round(monto * 50);

    const avisoOrdenCmd = `🔔 **ÓRDEN MULTI-PAGO GENERADA (COMANDO)**\n👩‍🦰 Modelo: ${nombreModelo}\n💰 Monto: \`${monto}\` USDT / \`${montoStars}\` XTR`;
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrdenCmd);
    } catch (e) { 
        console.error("Error enviando alerta al grupo en comando:", e); 
    }

    const texto = `💎 **ORDEN DE PAGO: ${nombreModelo}** 💎\n\n` +
                  `💰 **Monto a pagar / Amount:** \`${monto}\` USDT o \`${montoStars}\` Estrellas\n` +
                  `🏦 **Red / Network:** TON Network / Telegram Stars\n\n` +
                  `🇪🇸 **Instrucciones:**\n` +
                  `Selecciona tu método de pago preferido abajo. Puedes pagar directamente con Crypto (Wallet/Tonkeeper) o usar tu tarjeta mediante Google Pay / Apple Pay (Estrellas).\n\n` +
                  `🇺🇸 **Instructions:**\n` +
                  `Select your preferred payment method below. You can pay directly with Crypto or use your card via Google Pay / Apple Pay (Stars).\n\n` +
                  `🔥 **¡Prepárate para la diversión! / Get ready for fun!** 🔥`;

    await ctx.replyWithMarkdown(texto, Markup.inlineKeyboard([
        [Markup.button.url(`🚀 CRYPTO: PAGAR ${monto} USDT (TON)`, `https://t.me/wallet?startattach=external_pay_${MI_BILLETERA}_${monto}`)],
        [Markup.button.url(`⭐ TARJETA: GOOGLE PAY / APPLE PAY`, `https://t.me/${NOMBRE_BOT}?start=stars_${montoStars}_${modelo}`)]
    ]));
});

// 4. CONFIRMACIÓN AUTOMÁTICA DE COMPRA EXITOSA (SÓLO TELEGRAM STARS)
bot.on('successful_payment', async (ctx) => {
    const paymentInfo = ctx.message.successful_payment;
    const totalStars = paymentInfo.total_amount;
    const invoicePayload = paymentInfo.invoice_payload;
    
    const partesPayload = invoicePayload.split('_');
    const modeloIdentificada = partesPayload[2] ? partesPayload[2].toUpperCase() : "SISTEMA";

    const clienteName = ctx.from.first_name || "Usuario";
    const clienteUser = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    await ctx.reply("✅ **¡Pago completado con éxito!** Tus servicios han sido habilitados de manera inmediata.");

    // Reporte automatizado de saldo centralizado al grupo
    const reportePago = `💸 **⭐ ¡INGRESO POR TARJETA CONFIRMADO! ⭐** 💸\n` +
                        `👩‍🦰 Para la Modelo: **${modeloIdentificada}**\n` +
                        `💵 Saldo añadido al bot: \`${totalStars}\` Estrellas (XTR)\n` +
                        `👤 Cliente: ${clienteName} (${clienteUser})\n` +
                        `🆔 ID Cliente: \`${ctx.from.id}\`\n` +
                        `💳 Método de recaudación: Google Pay / Apple Pay`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, reportePago);
    } catch (err) {
        console.error("Error notificando pago de estrellas al grupo:", err);
    }
});

// 5. RECEPCIÓN DE COMPROBANTES (Reenvía las capturas de pantalla de los clientes que pagan con TON)
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción en la Wallet, espera un momento.");

    const report = `📸 **NUEVO COMPROBANTE RECIBIDO**\n` +
                   `👤 Cliente: ${user} (${username})\n` +
                   `🆔 ID Telegram: \`${ctx.from.id}\`\n` +
                   `⏳ Estado: Esperando revisión en Wallet`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, report);
        await ctx.forwardMessage(GRUPO_PAGOS);
    } catch (err) {
        console.error("Error reenviando el comprobante al grupo de control:", err);
    }
});

// Asegura limpiar conexiones colgadas en Telegram antes de encender el bot de nuevo
bot.telegram.deleteWebhook()
    .then(() => {
        return bot.launch({ dropPendingUpdates: true });
    })
    .then(() => console.log('Bot Pagocliente_bot inicializado correctamente con Sistema Dual 🚀'))
    .catch((err) => console.error('Error crítico al lanzar el bot:', err));

// Manejo seguro del apagado
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
