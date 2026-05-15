const nodemailer = require('nodemailer');

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
<html lang="en">
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
                You received this email because of activity on your MediKit account.<br>
                If this wasn't you, please ignore this email.
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
        Verify your email address
      </h1>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Hi <strong>${name}</strong>, thanks for signing up!
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Click the button below to confirm your email address and activate your account.
      </p>
      ${actionButton(verifyUrl, 'Verify Email')}
      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        This link expires in <strong>24 hours</strong>.
      </p>
      <!-- Disclaimer -->
      <div style="margin-top:20px;padding:14px 16px;background:#FFF8E1;border-radius:10px;border-left:3px solid #FFC107">
        <p style="margin:0;font-size:13px;color:#795548;line-height:1.6">
          <strong>⚠️ Important:</strong> Until you verify your email, you will not receive
          medication reminders, expiry warnings, or low-stock alerts from MediKit.
          Verify now to make sure you never miss an important notification.
        </p>
      </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify your MediKit email address',
        html: emailLayout(body),
    });
};

// ── Send email-change confirmation ───────────────────────────────────────────
const sendEmailChangeEmail = async ({ to, name, verifyUrl }) => {
    const body = `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        Confirm your new email address
      </h1>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Hi <strong>${name}</strong>,
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Click the button below to confirm <strong>${to}</strong>
        as your new MediKit email address.
      </p>
      ${actionButton(verifyUrl, 'Confirm New Email')}
      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        This link expires in <strong>24 hours</strong>. If you didn't request this change, you can safely ignore this email.
      </p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Confirm your new MediKit email address',
        html: emailLayout(body),
    });
};

// ── Send password-reset email ────────────────────────────────────────────────
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
    const body = `
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        Reset your password
      </h1>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Hi <strong>${name}</strong>,
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        We received a request to reset your MediKit password.<br>
        Click the button below to choose a new one.
      </p>
      ${actionButton(resetUrl, 'Reset Password')}
      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        This link expires in <strong>24 hours</strong>.<br>
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset your MediKit password',
        html: emailLayout(body),
    });
};

// ── Send medication reminder email ───────────────────────────────────────────
const sendReminderEmail = async ({ to, name, medicineName, note, scheduledTime }) => {
    const body = `
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        💊 Time to take your medicine
      </h1>
      <p style="margin:0 0 6px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Hi <strong>${name}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        This is your reminder to take:
      </p>

      <!-- Medicine highlight box -->
      <div style="background:#E8F0F2;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px">
        <div style="font-size:20px;font-weight:700;color:#0D171C;margin-bottom:4px">
          ${medicineName}
        </div>
        <div style="font-size:14px;color:#4F8796">Scheduled for ${scheduledTime}</div>
        ${note ? `<div style="margin-top:10px;font-size:14px;color:#495057;font-style:italic">${note}</div>` : ''}
      </div>

      <p style="margin:0;font-size:13px;color:#9bb5bc;text-align:center">
        Mark it as taken in your MediKit app once done.
      </p>
      ${actionButton((process.env.APP_URL || 'http://localhost:5173') + '/home', 'Open MediKit')}
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: `MediKit Reminder: ${medicineName}`,
        html: emailLayout(body),
    });
};

// ── Send expiry warning email ────────────────────────────────────────────────
// medicines: [{ name, expirationDate, daysLeft }]
const sendExpiryWarningEmail = async ({ to, name, medicines }) => {
    const rows = medicines.map(m => {
        const dateStr  = new Date(m.expirationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const urgency  = m.daysLeft === 0 ? 'expires <strong>today</strong>'
                       : m.daysLeft === 1 ? 'expires <strong>tomorrow</strong>'
                       : `expires in <strong>${m.daysLeft} day${m.daysLeft !== 1 ? 's' : ''}</strong>`;
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

    const body = `
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        ⏰ Medicine expiry reminder
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Hi <strong>${name}</strong>, the following medicine${medicines.length !== 1 ? 's' : ''} in your kit
        will expire soon. Please check and replace ${medicines.length !== 1 ? 'them' : 'it'} if needed.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border-collapse:collapse;border:1px solid #e9ecef;border-radius:10px;overflow:hidden;margin-bottom:24px">
        <thead>
          <tr style="background:#E8F0F2">
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:left;font-weight:600">Medicine</th>
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:right;font-weight:600">Expiry</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      ${actionButton((process.env.APP_URL || 'http://localhost:5173') + '/kit', 'Open My Kit')}
    `;

    await transporter.sendMail({
        from:    process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: `MediKit: ${medicines.length === 1 ? `"${medicines[0].name}" expires soon` : `${medicines.length} medicines expiring soon`}`,
        html:    emailLayout(body),
    });
};

// ── Send low-stock alert email ───────────────────────────────────────────────
// medicines: [{ name, quantity, unit }]
const sendLowStockEmail = async ({ to, name, medicines }) => {
    const rows = medicines.map(m => {
        const qty = m.quantity === 0
            ? '<span style="color:#FB5D60;font-weight:700">Out of stock</span>'
            : `<span style="color:#e67e22;font-weight:700">${m.quantity} ${m.unit || 'units'} left</span>`;
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

    const body = `
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#212529;text-align:center">
        📦 Low stock alert
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#495057;line-height:1.65;text-align:center">
        Hi <strong>${name}</strong>, you're running low on the following
        medicine${medicines.length !== 1 ? 's' : ''}. Time to restock!
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="border-collapse:collapse;border:1px solid #e9ecef;border-radius:10px;overflow:hidden;margin-bottom:24px">
        <thead>
          <tr style="background:#E8F0F2">
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:left;font-weight:600">Medicine</th>
            <th style="padding:10px 12px;font-size:13px;color:#4F8796;text-align:right;font-weight:600">Stock</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      ${actionButton((process.env.APP_URL || 'http://localhost:5173') + '/kit', 'Open My Kit')}
    `;

    await transporter.sendMail({
        from:    process.env.EMAIL_FROM || `"MediKit" <${process.env.EMAIL_USER}>`,
        to,
        subject: `MediKit: Low stock — ${medicines.map(m => m.name).join(', ')}`,
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
