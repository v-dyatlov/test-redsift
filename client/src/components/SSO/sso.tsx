import AuthService from "../../services/AuthService";
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import qs from 'qs';

export default function SSO(props: any) {
	const history = useHistory();
	const [error, setError] = useState();

	const code = qs.parse(props.location.search, { ignoreQueryPrefix: true }).code;

	useEffect(() => {
		if (code) {
		AuthService.verifySSOCode(code as string).then((result: any) => {
			if (result.profile) {
				history.push(AuthService.getPreLoginPath());
			}

			setError(result.message);
			});
		}
	}, [code]);

	return (<div>SSO Callback {error}</div>);
}