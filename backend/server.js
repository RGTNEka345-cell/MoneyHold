
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = require("./index");
const { testDatabaseConnection } = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await testDatabaseConnection();
    app.listen(PORT, () => console.log(`Money Hold API running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Unable to start Money Hold API. Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
