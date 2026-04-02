const { recaptcha } = require("../config/env");

async function verifyRecaptchaToken(token, remoteIp) {
  if (!recaptcha.enabled) {
    return { ok: true, reason: "disabled" };
  }

  if (!recaptcha.secretKey) {
    return { ok: false, reason: "missing_secret" };
  }

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  const body = new URLSearchParams();
  body.set("secret", recaptcha.secretKey);
  body.set("response", token);

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(recaptcha.verifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return { ok: false, reason: "verification_http_error" };
  }

  const data = await response.json();

  if (!data.success) {
    return {
      ok: false,
      reason: "verification_failed",
      errorCodes: data["error-codes"] || [],
    };
  }

  if (typeof data.score === "number" && data.score < recaptcha.minScore) {
    return { ok: false, reason: "score_too_low", score: data.score };
  }

  return { ok: true, reason: "verified", score: data.score };
}

module.exports = {
  verifyRecaptchaToken,
};
