import { useEffect } from 'react';
import FunctionalState, { useFunctionalState } from '../FunctionalState';

// ES6 handles cycles just fine, and we need ApiService to verify token
import ApiService from './ApiService';

/**
 * Keys to use for persisting data in localStorage between page loads
 */
const TOKEN_CACHE_KEY = `@redsift/auth-token`;
const PRE_LOGIN_PATH_KEY = `@redsift/pre-login-path`;

/**
 * Where to go after logging in if no previous page requested auth
 */
const DEFAULT_PRE_LOGIN_PATH = '/';

/**
 * NB: If expiration ever changes on the backend, make sure we update this
 */
const TOKEN_EXPIRATION_MINUTES = 60;

/**
 * Refresh tokens at X percent of TOKEN_EXPIRATION_MINUTES
 */
const TOKEN_EXPIRATION_RATIO = 0.9;

export default class AuthService {
	// React state to hold true/false for authorization state
	// Start as undefined so checkAuthorizationStatus knows to verify
	static isAuthorizedState = new FunctionalState(undefined);

	// Authenticated user's information, from the 'profile-service/profile' endpoint
	static profileState = new FunctionalState(undefined);

	// Holds token so other services can use the token as a unique identifier for caching (like CartService)
	static tokenState = new FunctionalState(undefined);

	static preLoginPath = '/';

	/**
	 * Gets the current value of the authorization flag (does not check with the server - use checkAuthorizationStatus for that)
	 * @returns true/false indicating if the user is authorized (logged in)
	 */
	static isAuthorized() {
		return this.isAuthorizedState.getValue();
	}

	/**
	 * Update the authorization state.
	 * @param {bool} loggedIn True/false indicating if user is logged in
	 */
	static setIsAuthorized(loggedIn: boolean) {
		this.isAuthorizedState.setValue(loggedIn);
	}

	/**
	 * Login to the server, get a token, returns { success } or { error }
	 * @param {string} user User name
	 * @param {string} pass Password
	 * @returns { success: true } or { error: Error }
	 */
	static async login(user: string, pass: string) {
		const result = await ApiService.login(user, pass);
		if (result instanceof Error) {
			const { message } = result;

			this.setIsAuthorized(false);
			return { error: message };
		}

		const { token, profile } = result;
		this.setToken(token);
		this.setIsAuthorized(true);
		this.setProfile(profile);

		return {
			success: true,
		};
	}

	static async verifySSOCode(code: string) {
		const result = await ApiService.verifySSOCode(code);
		if (result instanceof Error) {
			const { message } = result;

			this.setIsAuthorized(false);
			return { error: message };
		}

		const { token, profile } = result;
		this.setToken(token);
		this.setIsAuthorized(true);
		this.setProfile(profile);

		return {
			success: true,
		};
	}

	static async logout() {
		this.clearToken();
	}

	/**
	 * Utility to check local storage and if we already have a token, check with the server to see if the token is valid.
	 *
	 * Designed to be called multiple times with no effect - only the first time hits the server,
	 * after that, just returns the same true (assuming token is present and valid). If missing a token,
	 * will always return false. If token present but not valid, will try to verify every time and return false
	 * if token is still invalid until token is removed (via `clearToken` or server returns a valid response.)
	 *
	 * We hit the server every time if we have a token but it's not valid because anything COULD cause a temporary error,
	 * like network down, temporary API problems, etc. So we don't want to clear the token on first error so we
	 * don't force the user to reauth - we want to let them retry (even if that means reloading the page) without
	 * having to go thru the auth flow again - and we do that by preserving the token until we explicitly need to clear it
	 * on log out or some other logic TBD.
	 *
	 * @returns Promise that resolves to true or false. True only if we have a token AND the server has validated the token for this session
	 */
	static async checkAuthorizationStatus() {
		if (this.isAuthorized() === undefined) {
			const token = this.getToken();
			// No token? No need to check with the API, we know we're not authorized
			if (!token) {
				// Set to false instead of undefined so we don't have to wait for a response next time
				this.setIsAuthorized(false);
				return false;
			}

			// Token expires every TOKEN_EXPIRATION_MINUTES minutes, so refresh it if we can.
			// Returns false if token is invalid or any other token problems.
			// Returns null of no token present - but we shouldn't get here anyway if no token.
			const newToken = await this.refreshToken();
			if (!newToken) {
				// Set to false instead of undefined so we don't have to wait for a response next time
				this.setIsAuthorized(false);
				return false;
			}

			// Update the React state var
			this.setIsAuthorized(true);
		}

		// Already authorized...
		return this.getToken();
	}

	/**
	 * Refreshes the old token and stores the new token
	 * @returns {string} Fresh token
	 */
	static async refreshToken() {
		const token = this.getToken();
		if (!token) {
			return null;
		}

		const refreshResult = await ApiService.verifyToken(token);

		if (refreshResult instanceof Error) {
			const { message } = refreshResult;

			// Not an expired token, log the info to the console
			// do better logging
			console.warn(`Got error from refresh:`, refreshResult);

			return false;
		}

		// Store token in this class and in localStorage (for page reloads)
		const { token: newToken } = refreshResult;
		this.setToken(newToken);
		this.setProfile(refreshResult);

		return newToken;
	}


	/**
	 * Updates profile state
	 */
	static setProfile(profile: any) {
		this.profileState.setValue(profile);
		console.log(`Current User:`, profile);
	}

	/**
	 * Set a cron that runs while page is loaded to keep token up to date, just a few minutes before it expires
	 */
	static startRefreshTimer() {
		setInterval(
			() => AuthService.refreshToken(),
			TOKEN_EXPIRATION_MINUTES * 60 * 1000 * TOKEN_EXPIRATION_RATIO,
		);
	}

	/**
	 * Returns current/stored token. No validity checks done. Use checkAuthorizationStatus() to ensure token is good.
	 * @returns Current token. Assumed to be valid.
	 */
	static getToken() {
		const token = this.tokenState.getValue();
		if (token) {
			return token;
		}

		const cachedToken = window.localStorage.getItem(TOKEN_CACHE_KEY);
		this.tokenState.setValue(cachedToken);
		return cachedToken;
	}

	/**
	 * Update the stored/cached token. Primarily internal use for AuthService
	 * @param {string} token New token
	 */
	static setToken(token: string) {
		window.localStorage.setItem(TOKEN_CACHE_KEY, token);
		this.tokenState.setValue(token);
	}

	/**
	 * Clear/remove the stored/cached token. Use to effect a "logout".
	 */
	static clearToken() {
		window.localStorage.removeItem(TOKEN_CACHE_KEY);
		window.localStorage.removeItem(PRE_LOGIN_PATH_KEY);
		this.tokenState.setValue(null);
		this.profileState.setValue({});
		// Add date to cache bust
		window.location.href = `/#/login?_=${Date.now()}`;
		// Because Jess still sees cache issues..
		window.location.reload();
	}

	/**
	 * Used by <AppRoute> to store path for returning to the private page
	 * upon successful login
	 * @param {string} currentPath Path
	 */
	 static storePreLoginPath(currentPath: string) {
		this.preLoginPath = currentPath;
		window.localStorage.setItem(PRE_LOGIN_PATH_KEY, currentPath);
	}

	/**
	 * Used by LoginPage to know where to go
	 * @returns Last path required for login
	 */
	static getPreLoginPath() {
		if (this.preLoginPath) {
			return this.preLoginPath;
		}

		const cached = window.localStorage.getItem(PRE_LOGIN_PATH_KEY);
		if (cached) {
			return cached;
		}

		return DEFAULT_PRE_LOGIN_PATH;
	}
}

// Export our React hook to get authorization state
export const useIsAuthorized = (checkStatusIfUndefined = false) => {
	const value = useFunctionalState(AuthService.isAuthorizedState);

	useEffect(() => {
		if (checkStatusIfUndefined && value === undefined) {
			// This will change isAuthenticated from `undefined` to true/false, forcing re-render
			AuthService.checkAuthorizationStatus();
		}
	});

	return value;
};

// Export our profile as a state
export const useProfile = () => {
	return useFunctionalState(AuthService.profileState);
};

// Start the timer to keep tokens fresh. NOOP if no token or not logged in
AuthService.startRefreshTimer();

// for debugging
// if (process.env.NODE_ENV === 'development') {
// 	window.AuthService = AuthService;
// }
