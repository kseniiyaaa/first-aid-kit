const nodemailer = require('nodemailer');

// Unit key → Ukrainian label (mirrors src/utils/units.js)
const UNIT_LABELS_UK = {
    tablets:  'таблетки',
    capsules: 'капсули',
    ml:       'мл',
    mg:       'мг',
    g:        'г',
    drops:    'краплі',
    patches:  'пластирі',
    tubes:    'туби',
    ampoules: 'ампули',
};
const displayUnit = (unit) => UNIT_LABELS_UK[unit] || unit || 'одиниць';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        // Required for Gmail — verifies the server certificate
        rejectUnauthorized: true,
    },
});

// Base HTML wrapper for all MediKit emails
const emailLayout = (bodyHtml) => `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F7FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:48px 16px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:520px">
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 36px;border:1px solid #e9ecef">

              <!-- Logo -->
              <div style="text-align:center;margin-bottom:32px">
                <span style="font-size:26px;font-weight:700;color:#0D171C;letter-spacing:-0.5px">
                  <span style="color:#30BDE8">Medi</span>Kit
                </span>
              </div>

              ${bodyHtml}

              <!-- Divider -->
              <hr style="margin:28px 0;border:none;border-top:1px solid #e9ecef">

              <!-- Footer note -->
              <p style="margin:0;font-size:12px;color:#9bb5bc;text-align:center;line-height:1.6">
                Ви отримали цей лист у зв'язку з активністю у вашому акаунті MediKit.<br>
                Якщо це були не ви, просто проігноруйте цей лист.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const actionButton = (url, label) => `
  <div style="text-align:center;margin:28px 0">
    <a href="${url}"
       style="display:inline-block;padding:14px 36px;background:#30BDE8;color:#0D171C;
              text-decoration:none;border-radius:24px;font-size:15px;font-weight:700">
      ${label}
    </a>
  </div>
`;

// ── Send new-account email verification ─────────────────────────────────────
const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
    const body = `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        Підтвердіть вашу адресу email
      </h1>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Вітаємо, <strong>${name}</strong>! Дякуємо за реєстрацію.
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Натисніть кнопку нижче, щоб підтвердити адресу email та активувати акаунт.
      </p>
      ${actionButton(verifyUrl, 'Підтвердити Email')}
      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        Посилання дійсне <strong>24 години</strong>.
      </p>
      <!-- Disclaimer -->
      <div style="margin-top:20px;padding:14px 16px;background:#FFF8E1;border-radius:10px;border-left:3px solid #FFC107">
        <p style="margin:0;font-size:13px;color:#795548;line-height:1.6">
          <strong>⚠️ Важливо:</strong> Поки ви не підтвердите email, ви не будете отримувати
          нагадування про прийом ліків, попередження про терміни придатності та сповіщення
          про низький запас від MediKit. Підтвердіть email зараз, щоб не пропустити важливі сповіщення.
        </p>
      </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Підтвердіть вашу адресу email в MediKit',
        html: emailLayout(body),
    });
};

// ── Send email-change confirmation ───────────────────────────────────────────
const sendEmailChangeEmail = async ({ to, name, verifyUrl }) => {
    const body = `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        Підтвердіть нову адресу email
      </h1>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Вітаємо, <strong>${name}</strong>!
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Натисніть кнопку нижче, щоб підтвердити <strong>${to}</strong>
        як нову адресу email у вашому акаунті MediKit.
      </p>
      ${actionButton(verifyUrl, 'Підтвердити Email')}
      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        Посилання дійсне <strong>24 години</strong>. Якщо ви не запитували цю зміну, просто проігноруйте цей лист.
      </p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Підтвердіть нову адресу email в MediKit',
        html: emailLayout(body),
    });
};

// ── Send password-reset email ────────────────────────────────────────────────
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    const body = `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        Скидання пароля
      </h1>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Вітаємо, <strong>${name}</strong>!
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Ми отримали запит на скидання пароля вашого акаунту MediKit.<br>
        Натисніть кнопку нижче, щоб встановити новий пароль.
      </p>
      ${actionButton(resetUrl, 'Скинути пароль')}
      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        Посилання дійсне <strong>24 години</strong>.<br>
        Якщо ви не запитували скидання пароля, просто проігноруйте цей лист.
      </p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Скидання пароля MediKit',
        html: emailLayout(body),
    });
};

// ── Send medication reminder email ───────────────────────────────────────────
const sendReminderEmail = async ({ to, name, medicineName, note, scheduledTime }) => {
    const body = `
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        💊 Час прийняти ліки
      </h1>
      <p style="margin:0 0 6px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Вітаємо, <strong>${name}</strong>!
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Нагадування про прийом:
      </p>

      <!-- Medicine highlight box -->
      <div style="background:#E8F0F2;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px">
        <div style="font-size:20px;font-weight:700;color:#0D171C;margin-bottom:4px">
          ${medicineName}
        </div>
        <div style="font-size:14px;color:#4F8796">Заплановано на ${scheduledTime}</div>
        ${note ? `<div style="margin-top:10px;font-size:14px;color:#495057;font-style:italic">${note}</div>` : ''}
      </div>

      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        Позначте як прийнято в додатку MediKit після прийому.
      </p>
      ${actionButton((process.env.APP_URL || 'http://localhost:5173') + '/home', 'Відкрити MediKit')}
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: `MediKit: нагадування — ${medicineName}`,
        html: emailLayout(body),
    });
};

// ── Send expiry warning email ────────────────────────────────────────────────
// medicines: [{ name, expirationDate, daysLeft }]
const sendExpiryWarningEmail = async ({ to, name, medicines }) => {
    const rows = medicines.map(m => {
        const dateStr = new Date(m.expirationDate).toLocaleDateString('uk-UA', {
            day: 'numeric', month: 'long', year: 'numeric',
        });
        let urgency;
        if (m.daysLeft === 0)      urgency = 'спливає <strong>сьогодні</strong>';
        else if (m.daysLeft === 1) urgency = 'спливає <strong>завтра</strong>';
        else if (m.daysLeft <= 4)  urgency = `спливає через <strong>${m.daysLeft} дні</strong>`;
        else                       urgency = `спливає через <strong>${m.daysLeft} днів</strong>`;

        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;font-size:14px;color:#212529;font-weight:600">
              ${m.name}
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;font-size:14px;color:#4F8796;text-align:right">
              ${dateStr} — ${urgency}
            </td>
          </tr>`;
    }).join('');

    const count = medicines.length;
    const body = `
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        ⏰ Нагадування про термін придатності
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Вітаємо, <strong>${name}</strong>! Термін придатності наступних ліків у вашій аптечці
        скоро спливає. Будь ласка, перевірте та замініть ${count !== 1 ? 'їх' : 'їх'} за потреби.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border-collapse:collapse;border:1px solid #e9ecef;border-radius:10px;overflow:hidden;margin-bottom:24px">
        <thead>
          <tr style="background:#E8F0F2">
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:left;font-weight:600">Ліки</th>
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:right;font-weight:600">Термін</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      ${actionButton((process.env.APP_URL || 'http://localhost:5173') + '/kit', 'Відкрити аптечку')}
    `;

    await transporter.sendMail({
        from:    process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: count === 1
            ? `MediKit: "${medicines[0].name}" — спливає термін придатності`
            : `MediKit: ${count} ліків зі спливаючим терміном придатності`,
        html: emailLayout(body),
    });
};

// ── Send low-stock alert email ───────────────────────────────────────────────
// medicines: [{ name, quantity, unit }]
const sendLowStockEmail = async ({ to, name, medicines }) => {
    const rows = medicines.map(m => {
        const qty = m.quantity === 0
            ? '<span style="color:#FB5D60;font-weight:700">Немає в наявності</span>'
            : `<span style="color:#e67e22;font-weight:700">залишилось ${m.quantity} ${displayUnit(m.unit)}</span>`;
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;font-size:14px;color:#212529;font-weight:600">
              ${m.name}
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #e9ecef;font-size:14px;text-align:right">
              ${qty}
            </td>
          </tr>`;
    }).join('');

    const count = medicines.length;
    const body = `
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        📦 Сповіщення про низький запас
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Вітаємо, <strong>${name}</strong>! У вас закінчуються наступні ліки. Час поповнити запас!
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border-collapse:collapse;border:1px solid #e9ecef;border-radius:10px;overflow:hidden;margin-bottom:24px">
        <thead>
          <tr style="background:#E8F0F2">
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:left;font-weight:600">Ліки</th>
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:right;font-weight:600">Залишок</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      ${actionButton((process.env.APP_URL || 'http://localhost:5173') + '/kit', 'Відкрити аптечку')}
    `;

    await transporter.sendMail({
        from:    process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: `MediKit: низький запас — ${medicines.map(m => m.name).join(', ')}`,
        html:    emailLayout(body),
    });
};

module.exports = {
    sendVerificationEmail,
    sendEmailChangeEmail,
    sendPasswordResetEmail,
    sendReminderEmail,
    sendExpiryWarningEmail,
    sendLowStockEmail,
};
