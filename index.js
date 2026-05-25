const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V7 - Control Total) Activo 🚀'));
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

    // --- NOTIFICACIÓN DE ORDEN GENERADA ---
    // Te avisa al grupo de pagos apenas la modelo lanza el comando en el chat privado
    const creador = ctx.from.first_name || "Modelo";
    const usernameCreador = ctx.from.username ? `@${ctx.from.username}` : "Sin @";
    
    const avisoOrden = `🔔 **ÓRDEN GENERADA EN CHAT**\n` +
                       `👤 Por: ${creador} (${usernameCreador})\n` +
                       `👩‍🦰 Modelo: ${modelo.toUpperCase()}\n` +
                       `💰 Monto: \`${monto}\` USDT`;
    
    try {
        // Envía la alerta a tu grupo de control
        await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, avisoOrden);
    } catch (err) {
        console.error("Error al enviar aviso de orden generada:", err);
    }
    // ----------------------------------------

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

// 2. COMANDO TRADICIONAL POR SI LO USAN EN GRUPOS
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    // Alerta de orden para comando tradicional
    const avisoOrdenCmd = `🔔 **ÓRDEN GENERADA (COMANDO)**\n👩‍🦰 Modelo: ${modelo.toUpperCase()}\n💰 Monto: \`${monto}\` USDT`;
    try {
        await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, avisoOrdenCmd);
    } catch (e) { console.error(e); }

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

// 3. RECEPCIÓN DE COMPROBANTES (Cuando el cliente envía la foto)
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    // Respuesta inmediata al cliente en su chat privado
    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción en la Wallet, espera un momento.");

    // --- NOTIFICACIÓN DE PAGO POR VERIFICAR ---
    const reporte = `📸 **NUEVO COMPROBANTE RECIBIDO**\n` +
                    `👤 Cliente: ${user} (${username})\n` +
                    `🆔 ID Telegram: \`${ctx.from.id}\`\n` +
                    `⏳ Estado: Esperando que revises tu Wallet`;
    
    try {
        // Envía el texto informativo al grupo "pagos"
        await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, reporte);
        // Te reenvía la foto exacta del capture para que la veas ahí mismo
        await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
    } catch (err) {
        console.error("Error reenviando el comprobante al grupo de control:", err);
    }
});

bot.start((ctx) => {
    ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí para habilitar tu servicio de inmediato.");
});

bot.launch({ dropPendingUpdates: true });
