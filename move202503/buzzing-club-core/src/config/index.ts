import winston from "winston";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Environment configuration
export const isDevelopment = process.env.NODE_ENV === "development";

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp as string}] ${level}: ${message} `;
});

// Logger configuration
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Path configuration
export const paths = {
  start: process.env.MOVE_START_PATH || "./move",
  logs: process.env.MOVE_LOGS_PATH || "./logs",
};

// Create necessary directories
export function ensureDirectories(): void {
  const requiredPaths = Object.values(paths);
  for (const dir of requiredPaths) {
    if (!path.isAbsolute(dir)) {
      const absolutePath = path.resolve(process.cwd(), dir);
      try {
        require("fs").mkdirSync(absolutePath, { recursive: true });
        logger.info(`Ensured directory exists: ${absolutePath}`);
      } catch (error) {
        logger.error(`Failed to create directory ${absolutePath}:`, error);
        process.exit(1);
      }
    }
  }
}

// Mock functions for development
export function mockAsyncOperation(ms: number = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Validation utilities
export function validateRequiredParams(
  params: Record<string, any>,
  requiredFields: string[]
): void {
  for (const field of requiredFields) {
    if (!params[field]) {
      throw new Error(`Missing required parameter: ${field}`);
    }
  }
}

export function validateNumber(
  value: any,
  fieldName: string,
  options: { min?: number; max?: number } = {}
): void {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (options.min !== undefined && num < options.min) {
    throw new Error(
      `${fieldName} must be greater than or equal to ${options.min}`
    );
  }
  if (options.max !== undefined && num > options.max) {
    throw new Error(
      `${fieldName} must be less than or equal to ${options.max}`
    );
  }
}

export const network = process.env.SUI_NETWORK as any;

export const buzzingConfig = {
  package: process.env.BUZZING_PACKAGE_ID as any,
  globalObject: process.env.BUZZING_GLOBAL_OBJECT as any,
};

// this is only for test
export const userPriaveKey = process.env.SUI_PRIVATE_KEY as any;
