const nodemailer = require("nodemailer");
const { mail } = require("../config/env");

let transporter;

function hasSmtpConfig() {
  return Boolean(mail.host && mail.port && mail.user && mail.pass);
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (hasSmtpConfig()) {
    transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: {
        user: mail.user,
        pass: mail.pass,
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
  return transporter;
}

async function sendPropertyContactEmail({ property, messageRecord, agent }) {
  const transport = getTransporter();

  const subject = `[Imobiliaria] Novo contacto para o imovel #${property.id} - ${property.title}`;

  const text = [
    `Recebeste um novo contacto para o imovel #${property.id}: ${property.title}`,
    "",
    `Nome: ${messageRecord.senderName}`,
    `Email: ${messageRecord.senderEmail}`,
    `Telefone: ${messageRecord.senderPhone || "N/A"}`,
    "",
    "Mensagem:",
    messageRecord.messageText,
  ].join("\n");

  const html = `
    <h2>Novo contacto de imovel</h2>
    <p><strong>Imovel:</strong> #${property.id} - ${property.title}</p>
    <p><strong>Nome:</strong> ${messageRecord.senderName}</p>
    <p><strong>Email:</strong> ${messageRecord.senderEmail}</p>
    <p><strong>Telefone:</strong> ${messageRecord.senderPhone || "N/A"}</p>
    <p><strong>Mensagem:</strong></p>
    <p>${String(messageRecord.messageText).replace(/\n/g, "<br>")}</p>
  `;

  const info = await transport.sendMail({
    from: `${mail.fromName} <${mail.fromEmail}>`,
    to: agent.email,
    subject,
    text,
    html,
  });

  return {
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    messageId: info.messageId || null,
    simulated: !hasSmtpConfig(),
  };
}

async function sendPasswordResetEmail({ user, resetUrl }) {
  const transport = getTransporter();

  const subject = "[Imobiliaria] Recuperacao de password";

  const text = [
    `Ola ${user.firstName},`,
    "",
    "Recebemos um pedido para redefinir a tua password.",
    "Se foste tu, usa este link para continuar:",
    resetUrl,
    "",
    "Se nao pediste esta alteracao, ignora este email.",
  ].join("\n");

  const html = `
    <h2>Recuperacao de password</h2>
    <p>Ola ${user.firstName},</p>
    <p>Recebemos um pedido para redefinir a tua password.</p>
    <p>
      <a href="${resetUrl}">Clica aqui para redefinir a password</a>
    </p>
    <p>Se nao pediste esta alteracao, ignora este email.</p>
  `;

  const info = await transport.sendMail({
    from: `${mail.fromName} <${mail.fromEmail}>`,
    to: user.email,
    subject,
    text,
    html,
  });

  return {
    accepted: info.accepted || [],
    rejected: info.rejected || [],
    messageId: info.messageId || null,
    simulated: !hasSmtpConfig(),
  };
}

module.exports = {
  sendPropertyContactEmail,
  sendPasswordResetEmail,
};
