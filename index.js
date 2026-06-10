const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V12 - Transferencia Forzada) Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// CONFIGURACIÓN DE TU NEGOCIO
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";
const GRUPO_PAGOS = parseInt(process.env.GRUPO_CONTROL_ID);

// 1. MODO INLINE
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || "Modelo";

    if (!monto || isNaN(monto)) return;

    // --- NOTIFICACIÓN AL GRUPO ---
    const nombreModelo = modelo.toUpperCase();
    const avisoOrden = `🔔 **ÓRDEN GENERADA EN CHAT**\n👩‍🦰 Modelo: ${nombreModelo}\n💰 Monto: \`${monto}\` USDT\n📌 _Enviada al cliente_`;
    try { await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrden); } catch (err) { console.error(err); }

    // CAMBIO RADICAL: Enlace de transferencia directa de la red TON para USDT.
    // Al hacer clic, abre la Wallet o Tonkeeper cargando TU billetera directamente, sin importar el chat de la modelo.
    const urlPagoFijo = `https://ton.app/transfer/${MI_BILLETERA}?amount=${monto * 1000000000}&token=usdt`;

    const resultado = [{
        type: 'article',
        id: `pago_${monto}_${modelo}_${Date.now()}`,
        title: `💎 ORDEN DE PAGO / PAYMENT ORDER 💎`,
        description: `Enviar orden de ${monto} USDT para ${modelo}`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${nombreModelo}** 💎\n\n` +
                          `💰 **Monto a pagar / Amount:** \`${monto}\` USDT\n` +
                          `🏦 **Red / Network:** TON Network (USDT)\n\n` +
                          `🇪🇸 **Instrucciones:**\n` +
                          `1. Toca el botón **PAGAR AHORA**.\n` +
                          `2. Selecciona tu Wallet (Telegram Wallet o Tonkeeper).\n` +
                          `3. Confirma el envío y sube el capture aquí.\n\n` +
                          `🇺🇸 **Instructions:**\n` +
                          `1. Tap the **PAY NOW** button.\n` +
                          `2. Choose your preferred Wallet.\n` +
                          `3. Confirm the payment and send the screenshot right here.\n\n` +
                          `🔥 **¡Prepárate para la diversión! / Get ready for fun!** 🔥`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            [Markup.button.url(`🚀 PAGAR / PAY ${monto} USDT AHORA`, urlPagoFijo)],
            [Markup.button.url('📸 ENVIAR COMPROBANTE / SEND RECEIPT', `https://t.me/${NOMBRE_BOT}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 2. COMANDO TRADICIONAL
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) return ctx.reply('❌ Uso: /cobrar 20 Maria');

    const urlPagoFijo = `https://ton.app/transfer/${MI_BILLETERA}?amount=${monto * 1000000000}&token=usdt`;

    const texto = `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                  `💰 **Monto a pagar / Amount:** \`${monto}\` USDT\n` +
                  `🏦 **Red / Network:** TON Network (USDT)\n\n` +
                  `🇪🇸 **Instrucciones:**\n` +
                  `1. Toca el botón **PAGAR AHORA**.\n` +
                  `2. Confirma el envío y sube la captura.\n\n` +
                  `🇺🇸 **Instructions:**\n` +
                  `1. Tap the **PAY NOW** button.\n` +
                  `2. Confirm the transaction and send the screenshot.`;

    await ctx.replyWithMarkdown(texto, Markup.inlineKeyboard([
        [Markup.button.url(`🚀 PAGAR / PAY ${monto} USDT AHORA`, urlPagoFijo)],
        [Markup.button.url('📸 ENVIAR COMPROBANTE / SEND RECEIPT', `https://t.me/${NOMBRE_BOT}`)]
    ]));
});

// 3. RECEPCIÓN DE COMPROBANTES
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";
    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción en la Wallet, espera un momento.");
    const reporte = `📸 **NUEVO COMPROBANTE RECIBIDO**\n👤 Cliente: ${user} (${username})\n🆔 ID: \`${ctx.from.id}\`\n⏳ Estado: Esperando revisión`;
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, reporte);
        await ctx.forwardMessage(GRUPO_PAGOS);
    } catch (err) { console.error(err); }
});

bot.start((ctx) => ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí."));
bot.launch({ dropPendingUpdates: true });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
