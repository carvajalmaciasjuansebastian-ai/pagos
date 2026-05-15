const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// Servidor para mantener vivo el bot en Render
const app = express();
app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V3 - Pago Directo) Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// CONFIGURACIÓN DE TU NEGOCIO
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";

// Enlace de transferencia profunda (Deep Link) para abrir la billetera directo a tu cuenta
const URL_PAGO_DIRECTO = `https://t.me/wallet?startattach=external_pay__${MI_BILLETERA}`;

// 1. MODO INLINE: La modelo escribe "@Pagocliente_bot 10 Maria" en cualquier chat privado
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || "Modelo";

    if (!monto || isNaN(monto)) return;

    const resultado = [{
        type: 'article',
        id: 'pago_' + Date.now(),
        title: `💰 Cobrar ${monto} USDT para ${modelo}`,
        description: `Enviar ficha de pago directo al cliente`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                          `💰 **Monto:** \`${monto}\` USDT\n` +
                          `🏦 **Red:** TON Network\n\n` +
                          `📌 **Billetera (Toca para copiar):**\n\`${MI_BILLETERA}\`\n\n` +
                          `✅ **Instrucciones:**\n` +
                          `1. Toca el botón **PAGAR AHORA**.\n` +
                          `2. Confirma el envío en tu Wallet.\n` +
                          `3. Envía la captura aquí para procesar tu orden.`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            [Markup.button.url('🚀 PAGAR AHORA (UN CLIC)', URL_PAGO_DIRECTO)],
            [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${NOMBRE_BOT}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 2. COMANDO TRADICIONAL: Para usar dentro de grupos de control o ventas
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    const texto = `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                  `💰 **Monto:** \`${monto}\` USDT\n` +
                  `📌 **Billetera:** \`${MI_BILLETERA}\``;

    await ctx.replyWithMarkdown(texto, Markup.inlineKeyboard([
        [Markup.button.url('🚀 PAGAR AHORA (UN CLIC)', URL_PAGO_DIRECTO)],
        [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${NOMBRE_BOT}`)]
    ]));
});

// 3. RECEPCIÓN DE COMPROBANTES: El cliente manda la foto al chat del bot
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    await ctx.reply("⏳ **Comprobante enviado.** El administrador verificará el ingreso en la Wallet. Por favor, no cierres este chat.");

    // Reporte detallado para el Grupo de Control de Jorge
    const reporte = `📸 **NUEVO PAGO RECIBIDO**\n` +
                    `👤 Cliente: ${user} (${username})\n` +
                    `🆔 ID Telegram: \`${ctx.from.id}\`\n` +
                    `🕒 Hora: ${new Date().toLocaleString()}`;
    
    try {
        await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, reporte);
        await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
    } catch (err) {
        console.error("Error reenviando al grupo de control:", err);
    }
});

// Mensaje de bienvenida para clientes que entran al bot
bot.start((ctx) => {
    ctx.reply("👋 ¡Hola! Si ya realizaste tu pago, **envía la captura de pantalla aquí** para que el administrador verifique tu transacción.");
});

bot.launch({ dropPendingUpdates: true }).then(() => {
    console.log("🚀 Pagocliente_bot funcionando con un clic");
});

// Manejo de errores para evitar caídas del servidor
bot.catch((err, ctx) => {
    console.error(`Error en el bot para ${ctx.updateType}:`, err);
});
