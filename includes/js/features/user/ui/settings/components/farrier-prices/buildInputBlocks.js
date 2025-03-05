import { buildEle } from "../../../../../../core/utils/dom/elements.js";

export default function buildInputBlocks(numBlocks, inputName, form, display, value = null) {
    try {
        // Resolve display element
        const displayEle = typeof display === 'string'
            ? document.getElementById(display)
            : display;

        if (!displayEle) {
            throw new Error(`Display element not found: ${display}`);
        }

        const currentBlocks = displayEle.children.length;

        if (numBlocks > currentBlocks) {
            // Add new blocks
            for (let i = currentBlocks; i < numBlocks; i++) {
                const blockValue = value?.[i] ?? null;
                displayEle.appendChild(buildBlock(i + 1, inputName, blockValue));
            }
        }
        else if (numBlocks < currentBlocks && numBlocks !== 0 && numBlocks !== '') {
            // Remove excess blocks
            while (displayEle.children.length > numBlocks) {
                displayEle.removeChild(displayEle.lastChild);
            }
        }
        else if (numBlocks === 0) {
            displayEle.innerHTML = '';
        }
    }
    catch (err) {
        import("../../../../../../core/errors/models/AppError.js")
            .then(({ AppError }) => {
                AppError.handleError(err, {
                    errorCode: AppError.Types.RENDER_ERROR,
                    userMessage: 'Error building accessory inputs',
                    displayTarget: display
                });
            })
            .catch(err => console.error('Error handler failed:', err));
    }
}

function buildBlock(index, name, value = null) {
    const blockConfig = {
        container: {
            type: 'div',
            attributes: { id: `${name}-block-${index}` },
            myClass: ['w3-margin-top-small', 'w3-padding-small']
        },
        nameLabel: {
            type: 'label',
            myClass: ['w3-margin-top-small', 'w3-small'],
            text: 'Product Name:'
        },
        nameInput: {
            type: 'input',
            attributes: {
                id: `${name}-name-${index}`,
                type: 'text',
                name: `${name}_name_${index}`,
                required: 'required',
                placeholder: 'Name of Product',
                title: 'Name of Product'
            },
            myClass: ['w3-input', 'w3-border', 'w3-medium']
        },
        costLabel: {
            type: 'label',
            myClass: ['w3-small'],
            text: 'Product Cost'
        },
        costInput: {
            type: 'input',
            attributes: {
                id: `${name}-cost-${index}`,
                type: 'number',
                name: `${name}_cost_${index}`,
                required: 'required',
                placeholder: 'Cost of Product',
                title: 'Cost of Product'
            },
            myClass: ['w3-input', 'w3-border', 'w3-medium']
        }
    };

    // Build all elements in one go using map
    const [block, nameLabel, nameInput, costLabel, costInput] =
        Object.entries(blockConfig).map(([_, config]) => buildEle(config));

    // Set values and build structure
    if (value) {
        nameInput.value = value.name ?? '';
        costInput.value = value.cost ?? '';
    }

    // Append in correct order
    nameLabel.appendChild(nameInput);
    costLabel.appendChild(costInput);
    block.append(nameLabel, costLabel);

    return block;
}