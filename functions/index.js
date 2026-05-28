const admin = require('firebase-admin')
const nodemailer = require('nodemailer')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineJsonSecret } = require('firebase-functions/params')
const { logger } = require('firebase-functions')

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
        service: 'gmail',
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
    from: `"Foodmania CR" <${cfg.email.user}>`,
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
  logger.log('Code verified for:', email)
  return { success: true }
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

  const order = {
    ...pedidoData,
    usuario: email || 'Anónimo',
    creadoEn: admin.firestore.Timestamp.now()
  }

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
      const itemsHtml = (pedidoData.items || []).map(item =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${item.nombre} x${item.cantidad}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">₡${item.precio * item.cantidad}</td></tr>`
      ).join('')

      logger.log('Sending email to:', email)

      await mailTransporter.sendMail({
        from: `"Foodmania CR" <${cfg.email.user}>`,
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
                <tbody>${itemsHtml}</tbody>
              </table>
              <hr style="margin:16px 0;border:none;border-top:2px solid #642d81;" />
              <p style="margin:0;text-align:right;font-size:18px;font-weight:bold;">Total: ₡${pedidoData.total || 0}</p>
              <hr style="margin:16px 0;border:none;border-top:1px solid #ddd;" />
              <p style="margin:0 0 4px;"><strong>💳 Pago:</strong> ${pedidoData.metodoPago || '—'}</p>
              <p style="margin:0 0 4px;"><strong>🏪 Retiro:</strong> ${pedidoData.tipoRetiro === 'sucursal' ? pedidoData.sucursal : 'Domicilio'}</p>
              <p style="margin:0 0 4px;"><strong>⭐ Puntos ganados:</strong> ${pedidoData.puntosGanados || 0}</p>
              ${pedidoData.puntosCanjeados ? `<p style="margin:0;"><strong>🔥 Puntos canjeados:</strong> ${pedidoData.puntosCanjeados}</p>` : ''}
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
