const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { app: appConfig, storage } = require("./config/env");
const { connectDatabase } = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicPropertiesRoutes = require("./routes/publicPropertiesRoutes");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: appConfig.frontendUrl,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(
  "/uploads",
  express.static(storage.uploadsRoot, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", appConfig.frontendUrl);
    },
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/properties", publicPropertiesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Rota nao encontrada." });
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(appConfig.port, () => {
      console.log(`API pronta em http://localhost:${appConfig.port}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar a API:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
