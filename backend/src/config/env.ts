import dotenv from 'dotenv';
import { validateEnv, EnvConfig } from '../validators/env.validator.js';

// Load local environment variables if available
dotenv.config();

export const env: EnvConfig = validateEnv();
