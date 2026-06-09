class LoadingState {
	private _active = $state(false);

	/**
	 * Reactive getter for the current manual loading state.
	 */
	get active() {
		return this._active;
	}

	/**
	 * Set the manual loading state.
	 */
	set active(value: boolean) {
		this._active = value;
	}

	/**
	 * Shows the loading screen.
	 */
	show() {
		this._active = true;
	}

	/**
	 * Hides the loading screen.
	 */
	hide() {
		this._active = false;
	}
}

/**
 * globalLoading is a Svelte 5 reactive state manager for showing/hiding
 * the global loading indicator during client-side operations (e.g. Supabase fetching).
 */
export const globalLoading = new LoadingState();
export default globalLoading;
