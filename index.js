const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// Servidor para Render
const app = express();
app.get('/', (req, res) => res.send('Bot Pagocliente_bot Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// Tu billetera fija de Wallet
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";

// 1. MODO INLINE (La modelo escribe @Pagocliente_bot 20 Maria en cualquier chat)
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
        description: `Enviar ficha de pago al chat actual`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                          `💰 **Monto:** \`${monto}\` USDT\n` +
                          `🏦 **Red:** TON Network\n\n` +
                          `📌 **Billetera (Toca para copiar):**\n\`${MI_BILLETERA}\`\n\n` +
                          `✅ **Al terminar, toca el botón de abajo para enviar el comprobante.**`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            [Markup.button.url('📱 ABRIR MI WALLET', 'https://t.me/wallet')],
            [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${NOMBRE_BOT}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 2. COMANDO TRADICIONAL (Para usar dentro de grupos)
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    await ctx.replyWithMarkdown(
        `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n💰 **Monto:** \`${monto}\` USDT\n📌 **Billetera:** \`${MI_BILLETERA}\``,
        Markup.inlineKeyboard([
            [Markup.button.url('📱 ABRIR WALLET', 'https://t.me/wallet')],
            [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${NOMBRE_BOT}`)]
        ])
    );
});

// 3. RECEPCIÓN DE FOTOS (El bot recibe el capture y te lo manda)
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    await ctx.reply("⏳ **Enviado al administrador.** Estamos verificando tu pago en la red TON, por favor espera.");

    // Reporte para ti en el Grupo de Control
    const reporte = `📸 **NUEVO PAGO POR VERIFICAR**\n👤 Cliente: ${user} (${username})\n🆔 ID: \`${ctx.from.id}\``;
    
    await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, reporte);
    await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
});

bot.start((ctx) => {
    ctx.reply("👋 ¡Bienvenido! Por favor, **envía la foto de tu comprobante de pago** para activarte el servicio.");
});

bot.launch({ dropPendingUpdates: true });
