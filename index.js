const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V13 - Antifraude) Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";
const GRUPO_PAGOS = parseInt(process.env.GRUPO_CONTROL_ID);

// 🚨 REGISTRO OFICIAL DE MODELOS LATIN CONNECT
const REGISTRO_MODELOS = {
    "CATALINA": 8860149047,
    "NATY": 8842392864,
    "VICTORIA": 8794256442,
    "KIARA": 8643531437,
    "GABY": 8934690346,
    "GABRIELA": 8934690346,
    "MEGAN": 8838802906,
    "SOFIA": 8737222053
};

// 🛑 LISTA NEGRA DE PALABRAS PROHIBIDAS (Filtro Antifraude)
const PALABRAS_PROHIBIDAS = [
    "WHATSAPP", "WHATSAP", "WSP", "WASAP", "NUMERO", "NUMBER", "CELULAR", "CEL", "TELEFONO", "PHONE",
    "INSTAGRAM", "INSTA", "IG", "FACEBOOK", "FB", "TIKTOK", "TWITTER", "TELEGRAM", "USER", "CONTACTO",
    "CONTACT", "ESCRIBEME", "ESCRIBIRME", "PASAME", "DAME", "LINK", "ENLACE", "URL", "PAGINA",
    "+57", "+1", "+34", "+58", "@" // Detecta prefijos telefónicos comunes y arrobas de usuarios
];

// =========================================================================

// 🚀 SISTEMA DE INTERCEPTACIÓN Y FILTRADO DE MENSAJES (PROTECCIÓN ANTI-ROBO)
bot.on('text', async (ctx, next) => {
    // Si el mensaje viene del grupo de control, lo ignoramos y dejamos que continúe
    if (ctx.chat.id === GRUPO_PAGOS) return next();

    const textoMensaje = ctx.message.text;
    const textoMayusculas = textoMensaje.toUpperCase();
    const senderId = ctx.from.id;
    const senderName = ctx.from.first_name || "Usuario";
    const senderUsername = ctx.from.username ? `@${ctx.from.username}` : "Sin @";

    // Verificar si el mensaje contiene alguna palabra prohibida
    const contienePalabraProhibida = PALABRAS_PROHIBIDAS.some(palabra => textoMayusculas.includes(palabra));

    if (contienePalabraProhibida) {
        // 1. Borrar o bloquear el mensaje enviando una advertencia al infractor
        await ctx.reply("⚠️ **POLÍTICA DE SEGURIDAD:** Por normas de la plataforma, está estrictamente prohibido intercambiar datos de contacto externos (WhatsApp, Redes Sociales o Teléfonos). Tu mensaje no ha sido enviado.");

        // 2. Armar reporte de alerta roja para el administrador
        const alertaFraude = `🚨 **ALERTA ROJA: INTENTO DE DESVÍO DE CLIENTE** 🚨\n\n` +
                             `👤 **Infractor:** ${senderName} (${senderUsername})\n` +
                             `🆔 **ID Telegram:** \`${senderId}\`\n` +
                             `💬 **Mensaje Interceptado:**\n_"${textoMensaje}"_\n\n` +
                             `🛡️ _El mensaje fue bloqueado automáticamente por el sistema de seguridad de Latin Connect._`;

        try {
            await bot.telegram.sendMessage(GRUPO_PAGOS, alertaFraude);
        } catch (err) {
            console.error("Error enviando alerta de fraude al grupo:", err);
        }
        
        return; // Corta la ejecución del mensaje, no se envía a nadie más
    }

    // Si el mensaje es limpio, dejamos que siga el flujo normal del bot
    return next();
});

// =========================================================================

// 1. MODO INLINE
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || ctx.inlineQuery.from.first_name || "Modelo";

    if (!monto || isNaN(monto)) return;

    const nombreModelo = modelo.toUpperCase();
    const avisoOrden = `🔔 **ÓRDEN GENERADA EN CHAT**\n👩‍🦰 Modelo: ${nombreModelo}\n💰 Monto: \`${monto}\` USDT\n📌 _Enviada al cliente en chat privado_`;
    
    try { await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrden); } catch (err) {}

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

// 2. COMANDO TRADICIONAL
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) return ctx.reply('❌ Uso: /cobrar 20 Maria');

    const avisoOrdenCmd = `🔔 **ÓRDEN GENERADA (COMANDO)**\n👩‍🦰 Modelo: ${modelo.toUpperCase()}\n💰 Monto: \`${monto}\` USDT`;
    try { await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrdenCmd); } catch (e) {}

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

// 3. RECEPCIÓN DE COMPROBANTES
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";
    const userId = ctx.from.id;

    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción en la Wallet, espera un momento.");

    const captionTexto = ctx.message.caption || "";
    let modeloDetectada = "DESCONOCIDA";
    for (const key of Object.keys(REGISTRO_MODELOS)) {
        if (captionTexto.toUpperCase().includes(key)) {
            modeloDetectada = key;
            break;
        }
    }

    const report = `📸 **NUEVO COMPROBANTE RECIBIDO**\n` +
                   `👤 Cliente: ${user} (${username})\n` +
                   `🆔 ID Telegram: \`${userId}\`\n` +
                   `👩‍🦰 Modelo Detectada: **${modeloDetectada}**\n` +
                   `⏳ Estado: Esperando revisión de pago`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, report, Markup.inlineKeyboard([
            [Markup.button.callback('➡️ Procesar y Elegir Modelo', `menu_${userId}_${modeloDetectada}`)]
        ]));
        await ctx.forwardMessage(GRUPO_PAGOS);
    } catch (err) {
        console.error("Error en flujo de foto:", err);
    }
});

// 3.4 PASO INTERMEDIO: SELECCIÓN DE MODELO EN EL GRUPO
bot.action(/^menu_(\d+)_(.+)$/, async (ctx) => {
    const targetUserId = ctx.match[1];
    const detectada = ctx.match[2];

    const botones = [
        [Markup.button.callback(`Catalina`, `confirmar_${targetUserId}_CATALINA`), Markup.button.callback(`Naty`, `confirmar_${targetUserId}_NATY`)],
        [Markup.button.callback(`Victoria`, `confirmar_${targetUserId}_VICTORIA`), Markup.button.callback(`Kiara`, `confirmar_${targetUserId}_KIARA`)],
        [Markup.button.callback(`Gaby`, `confirmar_${targetUserId}_GABY`), Markup.button.callback(`Megan`, `confirmar_${targetUserId}_MEGAN`)],
        [Markup.button.callback(`Sofia`, `confirmar_${targetUserId}_SOFIA`)],
        [Markup.button.callback(`❌ Cancelar / Solo Cliente`, `confirmar_${targetUserId}_NINGUNA`)]
    ];

    await ctx.editMessageText(`⚙️ **PASO 2: CONFIRMACIÓN DE OPERACIÓN**\n\n¿A qué modelo deseas asignarle este pago y enviar notificación de Show? \n_(Detectada originalmente: ${detectada})_`, Markup.inlineKeyboard(botones));
});

// 3.5 CONFIRMACIÓN TRIPLE
bot.action(/^confirmar_(\d+)_(.+)$/, async (ctx) => {
    const targetUserId = ctx.match[1];
    const nombreModelo = ctx.match[2];
    const adminName = ctx.from.first_name || "Administrador";

    const exitoTexto = `✅ **¡PAGO CONFIRMADO!** 💎\n\n` +
                       `🇪🇸 Tu transacción ha sido validada correctamente.\n` +
                       `🔥 **El pago fue confirmado, puedes proceder con el show.** ponte en contacto de inmediato.\n\n` +
                       `🇺🇸 Payment confirmed, you can proceed with the show.`;

    const avisoModeloTexto = `💰 **¡PAGO CONFIRMADO!** 💰\n\n` +
                             `👑 Hola ${nombreModelo}, el administrador ha verificado tu pago.\n` +
                             `🚀 **El pago fue confirmado, procede a tu show de inmediato.** 🔥`;

    let infoModeloAdicional = "";

    try {
        await bot.telegram.sendMessage(targetUserId, exitoTexto, { parse_mode: 'Markdown' });
        
        if (nombreModelo !== "NINGUNA" && REGISTRO_MODELOS[nombreModelo]) {
            const modeloChatId = REGISTRO_MODELOS[nombreModelo];
            try {
                await bot.telegram.sendMessage(modeloChatId, avisoModeloTexto, { parse_mode: 'Markdown' });
                infoModeloAdicional = `\n📱 **Notificación enviada a:** ${nombreModelo} (Privado) ✅`;
            } catch (errModelo) {
                infoModeloAdicional = `\n⚠️ **Alerta:** No se pudo enviar privado a ${nombreModelo}.`;
            }
        } else {
            infoModeloAdicional = `\n⚠️ **Aviso:** No se asignó a ninguna modelo específica.`;
        }
        
        await ctx.answerCbQuery("¡Show Autorizado Exitosamente! 🚀");

        const updatedText = `🟢 **¡PAGO CONFIRMED & SHOW AUTORIZADO!** 🎬\n\n` +
                            `👤 **ID Cliente:** \`${targetUserId}\`\n` +
                            `👩‍🦰 **Modelo Asignada:** ${nombreModelo}\n` +
                            `🤵 **Aprobado por:** ${adminName}\n` +
                            `${infoModeloAdicional}\n\n` +
                            `📣 _¡El cliente y la modelo ya fueron notificados en sus chats privados para iniciar el show ahora mismo!_`;
                            
        await ctx.editMessageText(updatedText, Markup.inlineKeyboard([])); 
    } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("Error en la confirmación", { show_alert: true });
    }
});

// 4. ARRANQUE DEL BOT
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

bot.telegram.deleteWebhook()
    .then(() => bot.launch({ dropPendingUpdates: true }))
    .then(() => console.log('Bot V13 Antifraude activo en el sistema 🚀'))
    .catch((err) => console.error(err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
