export async function updateAllSelectElements(evt) {
    try {
        const selectedElement = evt.target;
        const { previousValue } = selectedElement.dataset;
        const currentValue = selectedElement.value;

        // Use Set for unique values
        const selectElements = new Set(
            document.querySelectorAll('select[id^="horse-list-"]')
        );

        for (const select of selectElements) {
            if (select.id === selectedElement.id) continue;

            // More efficient option removal
            select.querySelector(`option[value="${currentValue}"]`)?.remove();

            // Add back previous value if it exists
            if (previousValue) {
                const previousOption = selectedElement
                    .querySelector(`option[value="${previousValue}"]`);
                if (previousOption) {
                    select.add(
                        new Option(previousOption.text, previousValue)
                    );
                }
            }
        }

        selectedElement.dataset.previousValue = currentValue;
    } catch (err) {
        const { handleError } = await import("../../../../../utils/error-messages/handleError.js");
        await handleError(
            'updateAllSelectElementsError',
            'Update all select elements error: ',
            err,
            'We encountered an error while updating the horse list select elements. Please refresh the page and try again.',
            'form-msg',
        );
    }
}