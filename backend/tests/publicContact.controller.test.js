const test = require("node:test");
const assert = require("node:assert/strict");

const publicContactController = require("../controllers/publicContactController");
const { Property } = require("../models");
const { createMockRes, mockMethod } = require("./helpers/httpMock");

test("contacto publico exige consentimento RGPD", async () => {
  const restoreFindByPk = mockMethod(Property, "findByPk", async () => ({
    id: 123,
    title: "Imovel teste",
    agent: null,
  }));

  const req = {
    params: { propertyId: "123" },
    body: {
      senderName: "Cliente Exemplo",
      senderEmail: "cliente@example.com",
      senderPhone: "910000000",
      objective: "pedir_informacoes",
      messageText: "Gostava de saber mais detalhes sobre este imovel.",
      recaptchaToken: "fake-token",
      acceptPrivacyPolicy: false,
    },
  };
  const res = createMockRes();

  try {
    await publicContactController.sendPropertyContact(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.payload.message, /Consentimento RGPD obrigatorio/i);
  } finally {
    restoreFindByPk();
  }
});
