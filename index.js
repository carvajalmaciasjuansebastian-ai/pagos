const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// ==========================================
// CONFIGURACIÓN DEL SERVIDOR WEB (EXPRESS)
// ==========================================
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Bot Pagocliente_bot (V9 - Notificaciones Corregidas) Activo 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});

// ==========================================
// CONFIGURACIÓN DEL BOT Y VARIABLES
// ==========================================
const bot = new Telegraf(process.env.BOT_TOKEN.trim());

const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";
const GRUPO_PAGOS = parseInt(process.env.GRUPO_CONTROL_ID);

// ==========================================
// 1. MODO INLINE (Cobros en chats privados)
// ==========================================
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    
    // Si la modelo no escribe su nombre, el bot toma automáticamente su Primer Nombre de Telegram
    const modelo = partes[1] || ctx.from.first_name || "Modelo";

    if (!monto || isNaN(monto)) return;

    // --- NOTIFICACIÓN SEGURA AL GRUPO DE PAGOS ---
    const nombreModelo = modelo.toUpperCase();
    const usernameModelo = ctx.from.username ? ` (@${ctx.from.username})` : "";
    
    // El reporte al grupo ahora incluye el nombre detectado y su @username de Telegram para asegurar el rastro
    const avisoOrden = `🔔 **ÓRDEN GENERADA EN CHAT**\n👩‍🦰 Modelo: ${nombreModelo}${usernameModelo}\n💰 Monto: \`${monto}\` USDT\n📌 _Enviada al cliente en chat privado_`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrden);
    } catch (err) {
        console.error("Error sending notification to control group in inline mode:", err);
    }
    // --------------------------------------------

    const resultado = [{
        type: 'article',
        id: `pago_${monto}_${modelo}_${Date.now()}`,
        title: `💎 ORDEN DE PAGO 💎`,
        description: `Enviar orden de ${monto} USDT para ${modelo}`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${nombreModelo}** 💎\n\n` +
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

// ==========================================
// 2. COMANDO TRADICIONAL (/cobrar)
// ==========================================
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    
    // Si no se define el nombre en el comando, toma el nombre del Telegram de quien ejecuta
    const modelo = partes[2] || ctx.from.first_name || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    const nombreModelo = modelo.toUpperCase();
    const usernameModelo = ctx.from.username ? ` (@${ctx.from.username})` : "";
    const avisoOrdenCmd = `🔔 **ÓRDEN GENERADA (COMANDO)**\n👩‍🦰 Modelo: ${nombreModelo}${usernameModelo}\n💰 Monto: \`${monto}\` USDT`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrdenCmd);
    } catch (e) { 
        console.error("Error sending notification to control group in command mode:", e); 
    }

    const texto = `💎 **ORDEN DE PAGO: ${nombreModelo}** 💎\n\n` +
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

// ==========================================
// 3. RECEPCIÓN Y REENVÍO DE COMPROBANTES
// ==========================================
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción en la Wallet, espera un momento.");

    const reporte = `📸 **NUEVO COMPROBANTE RECIBIDO**\n` +
                    `👤 Cliente: ${user} (${username})\n` +
                    `🆔 ID Telegram: \`${ctx.from.id}\`\n` +
                    `⏳ Estado: Esperando revisión en Wallet`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, reporte);
        await ctx.forwardMessage(GRUPO_PAGOS);
    } catch (err) {
        console.error("Error forwarding receipt to control group:", err);
    }
});

// ==========================================
// 4. COMANDO DE INICIO (/start)
// ==========================================
bot.start((ctx) => {
    ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí para habilitar tu servicio de inmediato.");
});

// ==========================================
// LANZAMIENTO Y CONTROL DE PROCESOS
// ==========================================
bot.launch({ dropPendingUpdates: true });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
