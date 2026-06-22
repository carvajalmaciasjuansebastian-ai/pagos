const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

// Verificación de salud del contenedor en Render
app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V10 - Estable) Activo 🚀'));
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

    // --- NOTIFICACIÓN INTERNA AL GRUPO DE CONTROL ---
    const nombreModelo = modelo.toUpperCase();
    const avisoOrden = `🔔 **ÓRDEN GENERADA EN CHAT**\n👩‍🦰 Modelo: ${nombreModelo}\n💰 Monto: \`${monto}\` USDT\n📌 _Enviada al cliente en chat privado_`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrden);
    } catch (err) {
        console.error("Error enviando alerta al grupo en modo inline:", err);
    }
    // ------------------------------------------------

    const resultado = [{
        type: 'article',
        id: `pago_${monto}_${modelo}_${Date.now()}`,
        title: `💎 ORDEN DE PAGO / PAYMENT ORDER 💎`,
        description: `Enviar orden de ${monto} USDT para ${modelo}`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                          `💰 **Monto a pagar / Amount:** \`${monto}\` USDT\n` +
                          `🏦 **Red / Network:** TON Network\n\n` +
                          `🇪🇸 **Instrucciones:**\n` +
                          `1. Toca el botón **PAGAR AHORA**.\n` +
                          `2. Confirma el envío desde tu Wallet.\n` +
                          `3. Envía el capture aquí mismo.\n\n` +
                          `🇺🇸 **Instructions:**\n` +
                          `1. Tap the **PAY NOW** button.\n` +
                          `2. Confirm the transaction in your Wallet.\n` +
                          `3. Send the screenshot right here.\n\n` +
                          `🔥 **¡Prepárate para la diversión! / Get ready for fun!** 🔥`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            [Markup.button.url(`🚀 PAGAR / PAY ${monto} USDT AHORA`, `https://t.me/wallet?startattach=external_pay_${MI_BILLETERA}_${monto}`)],
            [Markup.button.url(`🏦 PAGAR CON ZELLE`, `https://t.me/${NOMBRE_BOT}?start=zelle`)],
            [Markup.button.url('📸 ENVIAR COMPROBANTE / SEND RECEIPT', `https://t.me/${NOMBRE_BOT}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 2. COMANDO TRADICIONAL (Uso en el chat directo del bot: /cobrar 30 Maria)
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    const avisoOrdenCmd = `🔔 **ÓRDEN GENERADA (COMANDO)**\n👩‍🦰 Modelo: ${modelo.toUpperCase()}\n💰 Monto: \`${monto}\` USDT`;
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrdenCmd);
    } catch (e) { 
        console.error("Error enviando alerta al grupo en comando:", e); 
    }

    const texto = `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                  `💰 **Monto a pagar / Amount:** \`${monto}\` USDT\n` +
                  `🏦 **Red / Network:** TON Network\n\n` +
                  `🇪🇸 **Instrucciones:**\n` +
                  `1. Toca el botón **PAGAR AHORA**.\n` +
                  `2. Confirma el envío desde tu Wallet.\n` +
                  `3. Envía el capture aquí mismo.\n\n` +
                  `🇺🇸 **Instructions:**\n` +
                  `1. Tap the **PAY NOW** button.\n` +
                  `2. Confirm the transaction in your Wallet.\n` +
                  `3. Send the screenshot right here.\n\n` +
                  `🔥 **¡Prepárate para la diversión! / Get ready for fun!** 🔥`;

    await ctx.replyWithMarkdown(texto, Markup.inlineKeyboard([
        [Markup.button.url(`🚀 PAGAR / PAY ${monto} USDT AHORA`, `https://t.me/wallet?startattach=external_pay_${MI_BILLETERA}_${monto}`)],
        [Markup.button.url(`🏦 PAGAR CON ZELLE`, `https://t.me/${NOMBRE_BOT}?start=zelle`)],
        [Markup.button.url('📸 ENVIAR COMPROBANTE / SEND RECEIPT', `https://t.me/${NOMBRE_BOT}`)]
    ]));
});

// 3. RECEPCIÓN DE COMPROBANTES (Reenvía las capturas de pantalla de los clientes)
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

// 4. ARRANQUE DEL BOT LIMPIANDO CONFLICTOS 409
bot.start((ctx) => {
    const payload = ctx.startPayload;
    if (payload === 'zelle') {
        return ctx.replyWithMarkdown(`🏦 **INFORMACIÓN DE CORREO ZELLE**\n\n` +
                                    `• Por favor realiza tu transferencia al siguiente correo:\n` +
                                    `👉 \`jcompany444@gmail.com\`\n\n` +
                                    `📸 Una vez realizado el pago, envía la captura de pantalla por este mismo chat.`);
    }
    ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí para habilitar tu servicio de inmediato.");
});

// Asegura limpiar conexiones colgadas en Telegram antes de encender el bot de nuevo
bot.telegram.deleteWebhook()
    .then(() => {
        return bot.launch({ dropPendingUpdates: true });
    })
    .then(() => console.log('Bot Pagocliente_bot inicializado correctamente 🚀'))
    .catch((err) => console.error('Error crítico al lanzar el bot:', err));

// Manejo seguro del apagado
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
