let cheatsheetData = null; // Store the fetched JSON data globally

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function clearAllHighlightsAndRestore() {
    document.querySelectorAll('.card').forEach(card => {
        Array.from(card.querySelectorAll('[data-original-html]')).forEach(el => {
            if (el.dataset.originalHtml !== undefined) {
                el.innerHTML = el.dataset.originalHtml;
            }
        });
    });
}

function highlightText(element, filter) {
    const highlightToggle = document.getElementById('highlightToggle');
    if (!highlightToggle.checked || !filter) {
        return;
    }

    const escapedFilter = escapeRegExp(filter);
    const regex = new RegExp(`(${escapedFilter})`, 'gi');

    element.querySelectorAll('.card-title, .section-title, .description, .code-line, .table td').forEach(textContainer => {
        // Step 1: Ensure we have the ORIGINAL HTML stored.
        // This is crucial for subsequent searches/toggles to work correctly.
        if (textContainer.dataset.originalHtml === undefined) {
            textContainer.dataset.originalHtml = textContainer.innerHTML;
        }

        // Step 2: Restore to original before applying new highlights.
        // This clears previous highlights from *this* specific container.
        textContainer.innerHTML = textContainer.dataset.originalHtml;

        // Step 3: Now, iterate through text nodes to apply highlights safely.
        const walker = document.createTreeWalker(
            textContainer,
            NodeFilter.SHOW_TEXT,
            null, // No custom filter
            false // Not expandEntityReferences
        );

        let node;
        const textNodesToProcess = [];
        while ((node = walker.nextNode())) {
            // Ensure we are not inside a previously created highlight span
            // This check is important if you process elements multiple times
            if (node.parentNode.classList && node.parentNode.classList.contains('highlight-text')) {
                continue;
            }
            textNodesToProcess.push(node);
        }

        // Process collected text nodes in reverse order to avoid issues with node replacement
        // (replacing a node changes the DOM structure, which can affect nextNode() behavior)
        textNodesToProcess.reverse().forEach(textNode => {
            const originalText = textNode.nodeValue;
            if (originalText.toUpperCase().includes(filter.toUpperCase())) {
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(originalText)) !== null) {
                    // Add text before the match
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(originalText.substring(lastIndex, match.index)));
                    }
                    // Add the highlighted span
                    const span = document.createElement('span');
                    span.classList.add('highlight-text');
                    span.textContent = match[0]; // Use textContent to avoid HTML injection
                    fragment.appendChild(span);
                    lastIndex = regex.lastIndex;
                }

                // Add any remaining text after the last match
                if (lastIndex < originalText.length) {
                    fragment.appendChild(document.createTextNode(originalText.substring(lastIndex)));
                }

                // Replace the original text node with the fragment
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    });
}

function renderCards(data) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ''; // Clear existing content

    data.cards.forEach(cardData => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        // Card Header
        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header');

        const cardIcon = document.createElement('div');
        cardIcon.classList.add('card-icon');
        cardIcon.innerHTML = cardData['card-header']['card-icon'];
        cardHeader.appendChild(cardIcon);

        const cardTitle = document.createElement('h2');
        cardTitle.classList.add('card-title');
        cardTitle.innerText = cardData['card-header']['card-title']; // Use innerText initially
        cardHeader.appendChild(cardTitle);
        cardElement.appendChild(cardHeader);


        // Content Blocks
        cardData['content-blocks'].forEach(block => {
            if (block.type === 'section-title') {
                const sectionTitle = document.createElement('div');
                sectionTitle.classList.add('section-title');
                sectionTitle.innerText = block.text; // Use innerText initially
                cardElement.appendChild(sectionTitle);
            } else if (block.type === 'code-block') {
                const codeBlock = document.createElement('div');
                codeBlock.classList.add('code-block');
                block.lines.forEach(line => {
                    const codeLine = document.createElement('div');
                    codeLine.classList.add('code-line');
                    codeLine.innerHTML = line; // line might contain spans for syntax highlighting
                    codeBlock.appendChild(codeLine);
                });
                cardElement.appendChild(codeBlock);
            } else if (block.type === 'highlight') {
                const highlightDiv = document.createElement('div');
                highlightDiv.classList.add('highlight');

                const tagSpan = document.createElement('span');
                tagSpan.classList.add('tag');
                tagSpan.innerText = block.tag;
                highlightDiv.appendChild(tagSpan);

                if (block.content.type === 'code-block') {
                    const codeBlock = document.createElement('div');
                    codeBlock.classList.add('code-block');
                    block.content.lines.forEach(line => {
                        const codeLine = document.createElement('div');
                        codeLine.classList.add('code-line');
                        codeLine.innerHTML = line;
                        codeBlock.appendChild(codeLine);
                    });
                    highlightDiv.appendChild(codeBlock);
                } else if (block.content.type === 'description') {
                    const description = document.createElement('div');
                    description.classList.add('description');
                    description.innerHTML = block.content.content; // Use innerHTML
                    highlightDiv.appendChild(description);
                }
                cardElement.appendChild(highlightDiv);
            } else if (block.type === 'table') {
                const table = document.createElement('table');
                table.classList.add('table');
                const tbody = document.createElement('tbody'); // Add tbody for proper table structure
                block.rows.forEach(row => {
                    const tr = document.createElement('tr');
                    const td1 = document.createElement('td');
                    td1.innerHTML = row.cell1; // Use innerHTML for table cells, can contain spans
                    const td2 = document.createElement('td');
                    td2.innerHTML = row.cell2;
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                cardElement.appendChild(table);
            } else if (block.type === 'description') {
                const description = document.createElement('div');
                description.classList.add('description');
                description.innerHTML = block.content; // Use innerHTML
                cardElement.appendChild(description);
            }
        });
        cardsContainer.appendChild(cardElement);
    });
}

// Main DOMContentLoaded logic
document.addEventListener('DOMContentLoaded', () => {
    const containerElement = document.querySelector('.container'); // Get container element

    fetch('javascript_cheatsheet_data.json')
        .then(response => response.json())
        .then(data => {
            cheatsheetData = data; // Store data globally
            // Update Header
            document.getElementById('main-title').innerText = cheatsheetData.header.h1;
            document.getElementById('sub-title').innerHTML = cheatsheetData.header.p;
            renderCards(cheatsheetData); // Initial render of all cards
            containerElement.style.opacity = '1'; // Fade in the container after content is rendered
        })
        .catch(error => console.error('Error loading JSON data:', error));

    const searchInput = document.getElementById('searchInput');
    const highlightToggle = document.getElementById('highlightToggle');
    const cardsContainer = document.getElementById('cards-container');

    // Function to run the search and highlighting logic
    function applySearchAndHighlight() {
        let filter = searchInput.value.trim();
        let cards = cardsContainer.getElementsByClassName('card');

        clearAllHighlightsAndRestore(); // Always clear highlights and restore original content first

        if (filter.length === 0) {
            Array.from(cards).forEach(card => {
                card.style.display = ""; // Show all cards
            });
            return; // No highlighting needed if filter is empty
        }

        for (let i = 0; i < cards.length; i++) {
            let card = cards[i];
            // Get the text content for filtering purposes from the original HTML
            // Create a temporary element to safely get text content without interference from existing (hidden) highlight spans
            const tempDivForFiltering = document.createElement('div');
            // Create a clone of the card's original HTML
            tempDivForFiltering.innerHTML = card.innerHTML; // Use card.innerHTML directly because originalHtml is restored by clearAllHighlightsAndRestore

            // To accurately get textContent for filtering, remove any highlight spans from this temporary copy
            // (This is redundant if clearAllHighlightsAndRestore works perfectly but adds robustness)
            Array.from(tempDivForFiltering.querySelectorAll('.highlight-text')).forEach(span => {
                span.outerHTML = span.textContent;
            });

            let content = tempDivForFiltering.textContent || tempDivForFiltering.innerText;


            if (content.toUpperCase().indexOf(filter.toUpperCase()) > -1) {
                card.style.display = "";
                highlightText(card, filter); // Highlight if toggle is on
            } else {
                card.style.display = "none";
            }
        }
    }

    searchInput.addEventListener('keyup', applySearchAndHighlight);
    highlightToggle.addEventListener('change', applySearchAndHighlight); // Re-run search/highlight on toggle change
});
