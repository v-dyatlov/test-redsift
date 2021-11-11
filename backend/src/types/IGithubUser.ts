import IErrorResponse from "./IErrorResponse";
import ISuccessResponse from "./ISuccessResponse";

interface IGithubUser {
	id?: number;
	login?: string;
	name?: string;
	email?: string;
}

interface IGithubResponse extends ISuccessResponse, IErrorResponse {
	user?: IGithubUser,
}

export { IGithubUser, IGithubResponse };
