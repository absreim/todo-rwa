import { promisify } from "node:util";
import { exec } from "node:child_process";

export const execPromise = promisify(exec);

export const sleep = promisify(setTimeout);
