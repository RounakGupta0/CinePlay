const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Universal email sender:
 * 1. If RESEND_API_KEY is configured, sends via HTTPS (Port 443 - never blocked by cloud hosts like Render)
 * 2. Otherwise falls back to SMTP (Nodemailer) with strict 4s timeouts so it never hangs
 */
const sendEmail = async ({ to, subject, html }) => {
  // Option 1: HTTP API (Resend) - immune to cloud host SMTP port blocking
  if (process.env.RESEND_API_KEY) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        from: process.env.EMAIL_FROM || 'CinePlay <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      });

      const req = https.request('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 8000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data || '{}'));
          } else {
            reject(new Error(`Resend API error (${res.statusCode}): ${data}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Resend HTTP request timed out'));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  // Option 2: SMTP via Nodemailer
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials (EMAIL_USER / EMAIL_PASS) are not configured.');
  }

  const port = Number(process.env.EMAIL_PORT) || 465;
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  const mailOptions = {
    from: `"CinePlay" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
