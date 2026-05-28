import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });   // CWD-based path to root .env from apps/api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });         // CWD-based path to apps/api/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });   // Load local local environment keys
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });   // Directory-based path to root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });         // Directory-based path to apps/api/.env
