const test = require("node:test");
const assert = require("node:assert/strict");

const adminMessagesController = require("../controllers/adminMessagesController");
const { Message } = require("../models");
const { createMockRes, mockMethod } = require("./helpers/httpMock");

test("admin listMessages devolve paginacao e mensagens", async () => {
  const restoreFindAndCountAll = mockMethod(Message, "findAndCountAll", async () => ({
    rows: [{ id: 1, isRead: false }],
    count: 1,
  }));

  const req = {
    query: {
      page: "1",
      pageSize: "15",
      isRead: "false",
    },
    authUser: {
      id: 10,
    },
  };

  const res = createMockRes();

  try {
    await adminMessagesController.listMessages(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.messages.length, 1);
    assert.equal(res.payload.pagination.total, 1);
    assert.equal(res.payload.filters.isRead, false);
  } finally {
    restoreFindAndCountAll();
  }
});

test("admin updateMessageReadStatus valida payload isRead", async () => {
  const req = {
    params: { messageId: "12" },
    body: { isRead: "talvez" },
    authUser: { id: 10 },
  };
  const res = createMockRes();

  await adminMessagesController.updateMessageReadStatus(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.message, /isRead deve ser true ou false/i);
});

test("admin updateMessageReadStatus atualiza estado da mensagem", async () => {
  const message = {
    id: 77,
    isRead: false,
    async update(values) {
      this.isRead = values.isRead;
      return this;
    },
  };

  const restoreFindOne = mockMethod(Message, "findOne", async () => message);

  const req = {
    params: { messageId: "77" },
    body: { isRead: true },
    authUser: { id: 10 },
  };
  const res = createMockRes();

  try {
    await adminMessagesController.updateMessageReadStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.message.id, 77);
    assert.equal(res.payload.message.isRead, true);
  } finally {
    restoreFindOne();
  }
});
