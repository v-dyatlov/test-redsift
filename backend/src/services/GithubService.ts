import { config } from '../config';
import axios from 'axios';
import IAccessTokenResponse from '../types/IAccessTokenResponse';
import { IGithubResponse, IGithubUser } from '../types/IGithubUser';

export default class GithubService {
	// Build authorizatio URL for the Github
	public static buildAuthorizeUrl(): string {
		const { url, client, callback } = config.github;
		const params = {
			client_id: client,
			redirect_uri: callback,
		};

		return `${url}/authorize?${new URLSearchParams(params).toString()}`;
	}

	// Based on the received code return an access_token
	public static async getAccessToken(code: string): Promise<IAccessTokenResponse> {
		const { url, client, secret } = config.github;

		return axios.post(`${url}/access_token`, {
			code,
			client_id: client,
			client_secret: secret,
		}, {
			headers: {
				// set return format
				'Accept': 'application/json',
			},
		}).then((response: any) => {
			if (response.status === 200) {
				return {
					success: true,
					accessToken: response.data.access_token
				};
			} else {
				return {
					message: 'Error during code convertion to the token',
				}
			}
		}).catch((err: Error) => {
			throw Error('Error during authentication');
		});
	}

	// get user profile
	public static async getUserProfile(token: string): Promise<IGithubResponse> {
		if (!token) {
			throw Error('Please, provide a user token');
		}

		const { apiUserUrl } = config.github;

		return axios.get(`${apiUserUrl}`, {
			headers: {
				'Authorization': `token ${token}`,
			},
		}).then((response: any) => {
			if (response.status === 200) {
				
				const {
					id,
					login,
					email,
				} = response.data;

				const user: IGithubUser = {
					id,
					login,
					email,
				};
				return {
					success: true,
					user,
				};
			} else {
				return {
					message: 'Cant get user profile',
				}
			}
		}).catch((err: Error) => {
			throw Error('Error during authentication');
		});
	}
}