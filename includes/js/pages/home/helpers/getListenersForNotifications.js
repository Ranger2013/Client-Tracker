export default async function getListenersForNotifications(updateUserSettings, userDataStructure){
	const yes = document.getElementById('notify-yes');
	const no = document.getElementById('notify-no');

	if(yes) yes.addEventListener('click', async () => await updateUserSettings('yes', 'notifications', userDataStructure));
	if(no) no.addEventListener('click', async () => await updateUserSettings('no', 'notifications', userDataStructure));
}