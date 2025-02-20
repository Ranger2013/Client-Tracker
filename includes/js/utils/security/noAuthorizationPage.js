import openModal from "../modal/openModal";

export default async function noAuthorizationPage() {
	try{
		const html = `<div class="w3-container">
			<div class="w3-center">
				<h4 class="w3-text-red">Authorization Error</h4>
			</div>
			<p>
				We could not validate your credentials. All server based operations are suspended until you login again.
				You will not be able to backup any of your data until you get this issue fixed. 
			</p>
			<p>Please try to <a class="w3-text-blue" href="/login/">Login</a> again to resolve the issue.</p>
			<p>
				If this issue persists, please contact the administrator of this site.
			</p>
		</div>`;

		openModal({content: html});
	}
	catch(err){
		console.error('No Authorization Page Error: ', err);
	}
}