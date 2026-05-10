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

module.exports = { sendVerificationEmail, sendEmailChangeEmail };
