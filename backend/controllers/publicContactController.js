const { Property, User, Message } = require("../models");
const { sendPropertyContactEmail } = require("../services/emailService");
const { verifyRecaptchaToken } = require("../services/recaptchaService");

const CONTACT_OBJECTIVES = new Set(["pedir_informacoes", "agendar_visita", "outro"]);

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function defaultMessageForObjective(objective) {
  if (objective === "agendar_visita") {
    return "Ola, gostaria de agendar uma visita a este imovel.";
  }

  if (objective === "pedir_informacoes") {
    return "Ola, gostaria de obter mais informacoes sobre este imovel.";
  }

  return "Ola, tenho interesse neste imovel e gostaria de ser contactado.";
}

async function sendPropertyContact(req, res) {
  try {
    const propertyId = Number.parseInt(req.params.propertyId, 10);

    if (!Number.isInteger(propertyId)) {
      return res.status(400).json({ message: "propertyId invalido." });
    }

    const property = await Property.findByPk(propertyId, {
      include: [
        {
          model: User,
          as: "agent",
          required: false,
          attributes: ["id", "firstName", "lastName", "email", "role"],
        },
      ],
    });

    if (!property) {
      return res.status(404).json({ message: "Imovel nao encontrado." });
    }

    const senderName = normalizeText(req.body.senderName);
    const senderEmail = normalizeEmail(req.body.senderEmail);
    const senderPhone = normalizeText(req.body.senderPhone);
    const objective = normalizeText(req.body.objective || "pedir_informacoes");
    const recaptchaToken = normalizeText(req.body.recaptchaToken);
    const acceptPrivacyPolicy = req.body?.acceptPrivacyPolicy === true;

    let messageText = normalizeText(req.body.messageText);
    if (!messageText) {
      messageText = defaultMessageForObjective(objective);
    }

    if (!senderName || !senderEmail || !messageText) {
      return res.status(400).json({ message: "Nome, email e mensagem sao obrigatorios." });
    }

    if (!acceptPrivacyPolicy) {
      return res.status(400).json({ message: "Consentimento RGPD obrigatorio para enviar o contacto." });
    }

    if (!isValidEmail(senderEmail)) {
      return res.status(400).json({ message: "Email invalido." });
    }

    if (senderName.length < 2) {
      return res.status(400).json({ message: "Nome invalido." });
    }

    if (!CONTACT_OBJECTIVES.has(objective)) {
      return res.status(400).json({ message: "Objetivo de contacto invalido." });
    }

    if (messageText.length < 10) {
      return res.status(400).json({ message: "Mensagem demasiado curta." });
    }

    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, req.ip);
    if (!recaptchaResult.ok) {
      return res.status(400).json({
        message: "Falha na validacao anti-spam (reCAPTCHA).",
        reason: recaptchaResult.reason,
      });
    }

    const messageRecord = await Message.create({
      propertyId: property.id,
      senderName,
      senderEmail,
      senderId: req.authUser ? req.authUser.id : null,
      messageText,
      senderPhone: senderPhone || null,
      isRead: false,
    });

    if (!property.agent || !property.agent.email) {
      return res.status(201).json({
        message: "Mensagem guardada, mas este imovel ainda nao tem agente associado.",
        emailSent: false,
        messageId: messageRecord.id,
      });
    }

    try {
      const emailInfo = await sendPropertyContactEmail({
        property,
        messageRecord,
        agent: property.agent,
      });

      return res.status(201).json({
        message: "Mensagem enviada com sucesso.",
        emailSent: true,
        emailSimulated: emailInfo.simulated,
        messageId: messageRecord.id,
      });
    } catch (emailError) {
      return res.status(201).json({
        message: "Mensagem guardada, mas falhou o envio de email ao agente.",
        emailSent: false,
        messageId: messageRecord.id,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Erro ao enviar contacto." });
  }
}

module.exports = {
  sendPropertyContact,
};
