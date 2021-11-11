export default function Dashboard(props: any) {
	const { children } = props;
	return (<div>
		<div>Very nice header</div>
		{children}
	</div>);
}