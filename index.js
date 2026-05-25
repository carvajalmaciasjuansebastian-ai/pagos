const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V5 - Diseño Limpio) Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// CONFIGURACIÓN DE TU NEGOCIO
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";

// 1. MODO INLINE: La modelo escribe "@Pagocliente_bot 20 Maria"
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || "Modelo";

    if (!monto || isNaN(monto)) return;

    const resultado = [{
        type: 'article',
        id: `pago_${monto}_${modelo}_${Date.now()}`,
        title: `💎 ORDEN DE PAGO 💎`,
        description: `Enviar orden de ${monto} USDT para ${modelo}`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                          `💰 **Monto a pagar:** \`${monto}\` USDT\n` +
                          `🏦 **Red:** TON Network\n\n` +
                          `🚀 **Instrucciones:**\n` +
                          `1. Toca el botón **PAGAR AHORA**.\n` +
                          `2. Confirma el envío desde tu Wallet.\n` +
                          `3. Envía el capture aquí mismo.\n\n` +
                          `🔥 **¡Prepárate para la diversión!** 🔥`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            [Markup.button.url(`🚀 PAGAR ${monto} USDT AHORA`, `https://t.me/wallet?startattach=external_pay__${MI_BILLETERA}__${monto}`)],
            [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${NOMBRE_BOT}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 2. COMANDO TRADICIONAL
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    const texto = `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                  `💰 **Monto a pagar:** \`${monto}\` USDT\n` +
                  `🏦 **Red:** TON Network\n\n` +
                  `🚀 **Instrucciones:**\n` +
                  `1. Toca el botón **PAGAR AHORA**.\n` +
                  `2. Confirma el envío desde tu Wallet.\n` +
                  `3. Envía el capture aquí mismo.\n\n` +
                  `🔥 **¡Prepárate para la diversión!** 🔥`;

    await ctx.replyWithMarkdown(texto, Markup.inlineKeyboard([
        [Markup.button.url(`🚀 PAGAR ${monto} USDT AHORA`, `https://t.me/wallet?startattach=external_pay__${MI_BILLETERA}__${monto}`)],
        [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${NOMBRE_BOT}`)]
    ]));
});

// 3. RECEPCIÓN DE COMPROBANTES
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción en la Wallet, espera un momento.");

    const reporte = `📸 **NUEVO PAGO RECIBIDO (MONTO FIJO)**\n` +
                    `👤 Cliente: ${user} (${username})\n` +
                    `🆔 ID Telegram: \`${ctx.from.id}\``;
    
    try {
        await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, reporte);
        await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
    } catch (err) {
        console.error("Error reenviando al grupo de control:", err);
    }
});

bot.start((ctx) => {
    ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí para habilitar tu servicio de inmediato.");
});

bot.launch({ dropPendingUpdates: true });
