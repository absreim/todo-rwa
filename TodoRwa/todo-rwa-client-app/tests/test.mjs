import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const url = `${process.env.NEXT_PUBLIC_API_PATH}/TodoItems/ping`;

const confirmWebApiRunning = async (
  url,
  retryIntervalMs = 2000,
  retryAttempts = 5,
) => {
  console.log(url);
  for (let i = 0; i < retryAttempts; i++) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
      });
      if (response.ok) {
        console.log("success");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    } catch (e) {
      console.error(e);
      if (e instanceof TypeError && e.cause instanceof AggregateError) {
        e.cause.errors.forEach((err) => console.error("suberror", err));
      }
    }
  }
};

confirmWebApiRunning(url);
