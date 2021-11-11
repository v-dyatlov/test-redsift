import jwt from 'jsonwebtoken';
import { config } from './config';

export default class TokenHelper {
	public static generateToken(username: string): string {
		const secret = config.jwt.secret;
		return jwt.sign(username, secret, { expiresIn: '3600s' });
	}
}