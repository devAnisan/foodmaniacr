const admin = require('firebase-admin')
const nodemailer = require('nodemailer')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineJsonSecret } = require('firebase-functions/params')
const { logger } = require('firebase-functions')
const { calculateOrderTotals } = require('./calculos')

const emailConfig = defineJsonSecret('FUNCTIONS_CONFIG_EXPORT')

admin.initializeApp()

const db = admin.firestore()

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  try {
    const cfg = emailConfig.value()
    const emailUser = cfg.email?.user
    const emailPass = cfg.email?.pass
    if (emailUser && emailPass) {
      transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: emailUser, pass: emailPass }
      })
    } else {
      logger.warn('Email config missing — email.user or email.pass not set')
    }
  } catch (e) {
    logger.warn('Email config error:', e.message)
  }
  return transporter
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX = 3

exports.sendVerificationCode = onCall({ secrets: [emailConfig] }, async (request) => {
  const email = request.data.email
  if (!email) throw new HttpsError('invalid-argument', 'Email requerido')

  const code = generateCode()
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)

  await db.collection('codigos_verificacion').doc(email).set({
    code,
    expiresAt,
    usado: false,
    creadoEn: admin.firestore.Timestamp.now()
  })

  const mailTransporter = getTransporter()
  if (!mailTransporter) {
    throw new HttpsError('unavailable', 'Servicio de correo no disponible')
  }

  const cfg = emailConfig.value()
  await mailTransporter.sendMail({
    from: `"Foodmania CR" <pedidos@foodmania.cr>`,
    to: email,
    subject: '🔐 Tu código de verificación — Foodmania CR',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#642d81;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;">🍔 Foodmania CR</h1>
          <p style="margin:8px 0 0;opacity:0.9;">Verificá tu correo</p>
        </div>
        <div style="padding:24px;text-align:center;">
          <p style="font-size:16px;margin:0 0 16px;">Usá este código para verificar tu cuenta:</p>
          <div style="background:#f3e8ff;border:2px solid #642d81;border-radius:12px;padding:16px;display:inline-block;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#642d81;">${code}</span>
          </div>
          <p style="color:#888;font-size:13px;margin-top:16px;">Válido por 10 minutos.</p>
        </div>
        <div style="padding:16px;text-align:center;color:#888;font-size:12px;border-top:1px solid #ddd;">
          Foodmania CR — Tu antojo, nuestra especialidad
        </div>
      </div>
    `
  })

  logger.log('Verification code sent to:', email)
  return { success: true }
})

exports.verifyCode = onCall(async (request) => {
  const { email, code } = request.data
  if (!email || !code) throw new HttpsError('invalid-argument', 'Email y código requeridos')

  const docRef = db.collection('codigos_verificacion').doc(email)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    throw new HttpsError('not-found', 'No se encontró un código para este correo. Solicita uno nuevo.')
  }

  const data = docSnap.data()
  if (data.usado) {
    throw new HttpsError('already-exists', 'Este código ya fue usado. Solicita uno nuevo.')
  }

  if (data.expiresAt.toMillis() < Date.now()) {
    throw new HttpsError('deadline-exceeded', 'El código expiró. Solicita uno nuevo.')
  }

  if (data.code !== code) {
    throw new HttpsError('unauthenticated', 'Código incorrecto.')
  }

  await docRef.update({ usado: true })

  try {
    const userRecord = await admin.auth().getUserByEmail(email)
    if (!userRecord.emailVerified) {
      await admin.auth().updateUser(userRecord.uid, { emailVerified: true })
    }
  } catch (e) {
    logger.warn('Could not update emailVerified in Auth:', e.message)
  }

  logger.log('Code verified for:', email)
  return { success: true }
})

exports.calculateOrderTotals = onCall(async (request) => {
  const { items, distanciaKm, withDrawType, agrandarMap, agrandarPuntosMap, bebidaPuntosMap } = request.data

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Carrito vacío')
  }

  const totals = calculateOrderTotals(
    items,
    parseFloat(distanciaKm) || 0,
    withDrawType || 'sucursal',
    agrandarMap || {},
    agrandarPuntosMap || {},
    bebidaPuntosMap || {}
  )

  logger.log('Order totals calculated:', totals)
  return totals
})

exports.createOrder = onCall({ secrets: [emailConfig] }, async (request) => {
  const data = request.data
  const pedidoData = data.pedido
  const auth = request.auth
  const email = auth?.token?.email || null
  const uid = auth?.uid || null

  logger.log('Order request from:', auth?.token?.email || 'Anonymous', 'UID:', uid)

  const cincoMinAtras = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const recent = await db.collection('pedidos')
    .where('creadoEn', '>', cincoMinAtras)
    .get()

  let count = 0
  recent.forEach(doc => {
    const d = doc.data()
    if (d.usuario === email || d.usuario === 'Anónimo') count++
  })

  if (count >= RATE_LIMIT_MAX) {
    throw new HttpsError('resource-exhausted',
      'Demasiados pedidos en poco tiempo. Esperá unos minutos e intentá de nuevo.')
  }

  const totals = calculateOrderTotals(
    pedidoData.items || [],
    parseFloat(pedidoData.distanciaKm) || parseFloat(pedidoData.distanciaKm || 0),
    pedidoData.tipoRetiro || 'sucursal',
    pedidoData.agrandarMap || {},
    pedidoData.agrandarPuntosMap || {},
    pedidoData.bebidaPuntosMap || {}
  )

  let puntosGanados = totals.coinsGanados
  let esPrimeraCompra = false
  let esMartesFoodManiacos = false
  let esCumpleanos = false

  const hoy = new Date().getDay()
  if (hoy === 2) {
    esMartesFoodManiacos = true
    puntosGanados *= 2
    logger.log('🔥 Martes FoodManiacos — ManiaCoins x2')
  }

  if (uid) {
    const clientRef = db.collection('clientes').doc(uid)
    const clientSnap = await clientRef.get()
    if (clientSnap.exists && clientSnap.data().primeraCompra === true) {
      esPrimeraCompra = true
      puntosGanados *= 2
      await clientRef.update({ primeraCompra: false })
      logger.log('🎉 Primera compra — ManiaCoins x2 para', email)
    }
    const cumpleanos = clientSnap.exists ? clientSnap.data().cumpleanos : null
    if (cumpleanos) {
      const hoy = new Date()
      const [, mes, dia] = cumpleanos.split('-')
      if (hoy.getMonth() + 1 === parseInt(mes) && hoy.getDate() === parseInt(dia)) {
        esCumpleanos = true
        puntosGanados += 100
        logger.log('🎂 Cumpleaños — 100 ManiaCoins extra para', email)
      }
    }
    await clientRef.set({
      ultimaCompra: admin.firestore.Timestamp.now()
    }, { merge: true })
  }

  const order = {
    ...pedidoData,
    subtotal: totals.baseCashTotal,
    costoBebidas: totals.totalBebidasCash,
    costoAgrandar: totals.totalAgrandarCash,
    costoEnvio: totals.costoEnvio,
    total: totals.totalConEnvio,
    puntosGanados,
    cashTotalSinEnvio: totals.cashTotalSinEnvio,
    usuario: email || 'Anónimo',
    creadoEn: admin.firestore.Timestamp.now()
  }

  delete order.agrandarMap
  delete order.agrandarPuntosMap
  delete order.bebidaPuntosMap

  const docRef = await db.collection('pedidos').add(order)

  if (uid && pedidoData.puntosCanjeados > 0) {
    const clientRef = db.collection('clientes').doc(uid)
    const clientSnap = await clientRef.get()

    if (clientSnap.exists) {
      const puntosActuales = clientSnap.data().puntos || 0
      if (puntosActuales >= pedidoData.puntosCanjeados) {
        await clientRef.update({
          puntos: admin.firestore.FieldValue.increment(-pedidoData.puntosCanjeados)
        })
      }
    }
  }

  const mailTransporter = getTransporter()
  if (mailTransporter && email) {
    try {
      const cfg = emailConfig.value()
      const itemsHtml = (pedidoData.items || []).map(item => {
        let nombreHtml = `${item.nombre} x${item.cantidad}`
        if (item.bebida) {
          const precioBebida = Number(item.bebida.precio) * Number(item.cantidad)
          const canjeada = item.bebida.canjeadoConPuntos
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🥤 ${item.bebida.nombre} x${item.cantidad}${canjeada ? ' (🪙 canjeado)' : ` — ₡${precioBebida}`}</div>`
        }
        if (item.gaseosaSel) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🥤 Sabor gaseosa: ${item.gaseosaSel}</div>`
        }
        if (item.proteinaSel) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🍗 Proteína: ${item.proteinaSel}</div>`
        }
        if (item.papasConSalsa) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🍟 Papas con salsa</div>`
        }
        if (item.salsasAlitas?.length) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🌶️ ${item.salsasAlitas.join(', ')}</div>`
        }
        if (item.agrandarPapas) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">⬆️ Papas agrandadas</div>`
        }
        const precioItem = item.esCanje ? `🪙 ${item.puntosCanje * item.cantidad}` : `₡${Number(item.precio) * Number(item.cantidad)}`
        return `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${nombreHtml}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">${precioItem}</td></tr>`
      }).join('')

      const envioHtml = pedidoData.tipoRetiro === 'domicilio' && totals.costoEnvio > 0
        ? `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">🛵 Envío a domicilio</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">₡${totals.costoEnvio}</td></tr>`
        : ''

      const subtotalBebidas = totals.totalBebidasCash || 0
      const subtotalAgrandar = totals.totalAgrandarCash || 0
      const tieneExtras = subtotalBebidas > 0 || subtotalAgrandar > 0

      logger.log('Sending email to:', email)

      await mailTransporter.sendMail({
        from: `"Foodmania CR" <pedidos@foodmania.cr>`,
        to: email,
        subject: '✅ Pedido confirmado — Foodmania CR',
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
            <div style="background:#642d81;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;">🍔 Foodmania CR</h1>
              <p style="margin:8px 0 0;opacity:0.9;">¡Tu pedido fue confirmado!</p>
            </div>
            <div style="padding:24px;background:#f9f9f9;">
              <p style="margin:0 0 16px;"><strong>👤 Cliente:</strong> ${pedidoData.nombre || '—'}</p>
              <p style="margin:0 0 16px;"><strong>📞 Teléfono:</strong> ${pedidoData.telefono || '—'}</p>
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="background:#642d81;color:white;"><th style="padding:8px;text-align:left;">Producto</th><th style="padding:8px;text-align:right;">Subtotal</th></tr></thead>
                <tbody>${itemsHtml}${envioHtml}</tbody>
              </table>
              <hr style="margin:16px 0;border:none;border-top:2px solid #642d81;" />
              <div style="text-align:right;">
                ${tieneExtras ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">Subtotal productos: ₡${totals.baseCashTotal || 0}</p>` : ''}
                ${subtotalBebidas > 0 ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">🥤 Bebidas: ₡${subtotalBebidas}</p>` : ''}
                ${subtotalAgrandar > 0 ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">⬆️ Agrandar papas: ₡${subtotalAgrandar}</p>` : ''}
                ${totals.costoEnvio > 0 ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">🛵 Envío: ₡${totals.costoEnvio}</p>` : ''}
                <p style="margin:0;font-size:20px;font-weight:bold;">Total: ₡${totals.totalConEnvio || 0}</p>
              </div>
              <hr style="margin:16px 0;border:none;border-top:1px solid #ddd;" />
              <p style="margin:0 0 4px;"><strong>💳 Pago:</strong> ${pedidoData.metodoPago || '—'}</p>
              <p style="margin:0 0 4px;"><strong>🏪 Retiro:</strong> ${pedidoData.tipoRetiro === 'sucursal' ? pedidoData.sucursal : 'Domicilio'}</p>
              ${esPrimeraCompra ? '<p style="margin:0 0 4px;color:#642d81;font-weight:bold;">🎉 ¡Primera compra! ManiaCoins x2</p>' : ''}
              ${esMartesFoodManiacos ? '<p style="margin:0 0 4px;background:linear-gradient(135deg,#642d81,#eab308);color:white;padding:8px 12px;border-radius:8px;font-weight:bold;text-align:center;">🔥 Martes FoodManiacos — ManiaCoins x2</p>' : ''}
              ${esCumpleanos ? '<p style="margin:0 0 4px;background:linear-gradient(135deg,#e91e63,#ff6f00);color:white;padding:8px 12px;border-radius:8px;font-weight:bold;text-align:center;">🎂 ¡Feliz cumpleaños! Recibiste 100 ManiaCoins de regalo</p>' : ''}
              <p style="margin:0 0 4px;"><strong>🪙 ManiaCoins ganados:</strong> ${puntosGanados || 0}</p>
              ${order.puntosCanjeados ? `<p style="margin:0;"><strong>🔥 ManiaCoins canjeados:</strong> ${order.puntosCanjeados}</p>` : ''}
            </div>
            <div style="padding:16px;text-align:center;color:#888;font-size:12px;border-top:1px solid #ddd;">
              Foodmania CR — Tu antojo, nuestra especialidad
            </div>
          </div>
        `
      })
      logger.log('Email sent successfully to:', email)
    } catch (mailError) {
      logger.error('Error enviando correo:', mailError.message, mailError.stack)
    }
  } else {
    logger.log('Email skipped — transporter:', !!mailTransporter, 'email:', !!email)
  }

  return { id: docRef.id }
})

exports.sendNotification = onCall(async (request) => {
  const { title, body, target, data } = request.data
  if (!title || !body) throw new HttpsError('invalid-argument', 'Faltan titulo o cuerpo')

  let tokens = []

  if (target === 'all') {
    const snapshot = await db.collection('clientes')
      .where('fcmToken', '!=', null)
      .get()
    snapshot.forEach(doc => {
      const t = doc.data().fcmToken
      if (t) tokens.push(t)
    })
  } else if (target?.type === 'nivel') {
    const coinsMin = target.coinsMin || 0
    const snapshot = await db.collection('clientes')
      .where('fcmToken', '!=', null)
      .where('puntos', '>=', coinsMin)
      .get()
    snapshot.forEach(doc => {
      const t = doc.data().fcmToken
      if (t) tokens.push(t)
    })
  } else if (target?.type === 'usuario' && target.uid) {
    const docSnap = await db.collection('clientes').doc(target.uid).get()
    if (docSnap.exists && docSnap.data().fcmToken) {
      tokens = [docSnap.data().fcmToken]
    }
  }

  if (tokens.length === 0) {
    logger.log('No tokens found for target:', target)
    return { successCount: 0, failureCount: 0 }
  }

  const message = {
    notification: { title, body },
    data: data || {},
    tokens
  }

  const response = await admin.messaging().sendEachForMulticast(message)
  logger.log('Notificacion enviada:', response.successCount, 'exitos,', response.failureCount, 'fallos')

  if (response.failureCount > 0) {
    response.responses.forEach((resp, idx) => {
      if (resp.error) {
        logger.warn('Error en token', idx, ':', resp.error.message)
      }
    })
  }

  return { successCount: response.successCount, failureCount: response.failureCount }
})
