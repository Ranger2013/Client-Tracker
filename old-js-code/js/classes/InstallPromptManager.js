class InstallPromptManager {
	#prompt = null;
	static #instance = null;

	constructor() {
		if(InstallPromptManager.#instance){
			return InstallPromptManager.#instance;
		}
		InstallPromptManager.#instance = this;
	}

	setPrompt(prompt){
		this.#prompt = prompt;
	}

	getPrompt(){
		return this.#prompt;
	}

	clearPrompt(){
		this.#prompt = null;
	}
}

export const installPromptState = new InstallPromptManager();