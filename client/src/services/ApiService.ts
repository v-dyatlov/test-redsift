/* eslint-disable no-console */
import axios from 'axios';

// ES6 handles cycles just fine, and we need AuthService to verify authorization status
// eslint-disable-next-line import/no-cycle
import AuthService from './AuthService';

/**
 * The base of our API calls.
 */
const API_ROOT = `http://localhost:3000/api`;

/**
 * Contains all the API requests wrapped in convenient functions to process data to/from the backend.
 */
export default class ApiService {
	/**
	 * Login to the server
	 * @param {string} email Email
	 * @param {string} password Pa
	 * @returns Object shaped like { data: "<token>" } or Error instance
	 */
	static login = async (email: string, password: string) =>
		// request() will fail this request if requireToken is not set to false because
		// obviously the user needs to login to have a token
		this.post(
			'auth/login',
			{
				email,
				password,
			},
			{ requireToken: false },
		);


	static verifySSOCode = async (code: string) =>
		this.post(
			'sso/verify',
			{
				code,
			},
			{ requireToken: false },
		);

	/**
	 * Verifies the given token is valid and not expired
	 * @param {string} token Token to verify
	 * @returns {object} like `{
	 *	"userId": "string",
	 *	"role": {}
	 *	}`
	 */
	static verifyToken = async (token: string) =>
		// NOTE: VERY important that requireToken is false here,
		// because otherwise this will cause a cyclical loop because request() calls AuthService.checkAuthorizationStatus() internally,
		// which then calls this method verifyToken(), which calls request() - which calls checkAuthorizationStatus if requireToken is true
		this.post(
			'auth/verify',
			{ token },
			{ requireToken: false },
		);

	/**
	 * This is a simple generic requestor that wraps axios so we can encode the query string for GET requests and catch errors.
	 * TODO: Once we establish our auth method with backend, we can also auto-add the token here from the AuthService.
	 *
	 * @param {string} method Standard HTTP Method like GET/PUT/POST/PATCH/DELETE etc
	 * @param {string} endpoint [required] API endpoint (don't include anything from API_ROOT, like '/api/v1', etc)
	 * @param {object} data [optional] Object containing values to GET or POST, etc. request() will URL-encode for GET
	 * @param {object} options [optional] Options to pass to the underlying axios request - see axios docs for valid options
	 * @param {boolean} options.requireToken [optional] Defaults to `true`. This option is not passed to axios. It's enforced in request(),
	 * 	and if set to `true`, it will wait for AuthService to validate and check the token and error out if AuthService doesn't return a success response.
	 * @returns The `data` property from the axios response or an `Error` object if there was an exception. TBD if we want different error handling
	 */
	static async request(
		method: string,
		endpoint: string,
		data = {},
		{ requireToken = true, ...options }: any = {},
	) {
		let url = `${API_ROOT}/${endpoint}`;
		if (method === 'GET' && Object.keys(data).length) {
			url += `?${new URLSearchParams(data).toString()}`;
		}
		try {
			if (requireToken) {
				// Note as docs for checkAuthorizationStatus say, this only hits the backend
				// once to validate the token if we have a token. If no token stored,
				// or the token is invalid, it returns false every time until valid token (login)
				const token = await AuthService.checkAuthorizationStatus();
				if (!token) {
					// eslint-disable-next-line no-console
					console.error(`No token/not authorized, cannot request ${url}`);
					return new Error(`Not authorized`);
				}

				// TBD expected backend header for token
				const headers = { Authorization: `${token}` };

				// Add our auth header OVER TOP OF any headers given in options
				const { headers: userHeaders } = options;
				Object.assign(options, {
					headers: { ...(userHeaders || {}), ...headers },
				});
			}

			const { data: result } = await axios({
				method,
				url,
				data: method === 'GET' ? undefined : data,
				...options,
			});
			return result;
		} catch (ex) {
			// TBD: Better error logging/handling
			// eslint-disable-next-line no-console
			console.error(
				`Error requesting ${url}`,
				ex,
				// ex && ex.response && ex.response.data,
			);
			return ex;
		}
	}

	/**
	 * Alias to `request()` with method set to GET
	 * @param {string} endpoint See request docs
	 * @param {object} data See request docs
	 * @param {object} options See request docs
	 * @returns See request docs
	 * Note: This code explicitly calls out args so IntelliSense in VSCode can derive expected args for code completion
	 */
	static get = (
		endpoint: string,
		data = {},
		{ requireToken = true, ...options } = {},
	) => this.request('GET', endpoint, data, { requireToken, ...options });

	/**
	 * Alias to `request()` with method set to POST
	 * @param {string} endpoint See request docs
	 * @param {object} data See request docs
	 * @param {object} options See request docs
	 * @returns See request docs
	 * Note: This code explicitly calls out args so IntelliSense in VSCode can derive expected args for code completion
	 */
	static post = (
		endpoint: string,
		data = {},
		{ requireToken = true, ...options } = {},
	) => this.request('POST', endpoint, data, { requireToken, ...options });

	/**
	 * Alias to `request()` with method set to PUT
	 * @param {string} endpoint See request docs
	 * @param {object} data See request docs
	 * @param {object} options See request docs
	 * @returns See request docs
	 * Note: This code explicitly calls out args so IntelliSense in VSCode can derive expected args for code completion
	 */
	static put = (
		endpoint: string,
		data = {},
		{ requireToken = true, ...options } = {},
	) => this.request('PUT', endpoint, data, { requireToken, ...options });
}
