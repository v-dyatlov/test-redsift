import IErrorResponse from "./IErrorResponse";
import ISuccessResponse from "./ISuccessResponse";

export default interface IAccessTokenResponse extends ISuccessResponse, IErrorResponse {
	accessToken?: string;
}
