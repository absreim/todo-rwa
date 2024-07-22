import { confirmWebApiRunning } from "./util";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const url = `${process.env.NEXT_PUBLIC_API_PATH!}/TodoItems/ping`

confirmWebApiRunning(url)
