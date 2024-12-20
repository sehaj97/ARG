javascript: (function () {
    // Function to show a loader while Axe is running
    function showLoader() {
        var loader = document.createElement('div');
        loader.setAttribute(
            'style',
            `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 20px;
            color: #fff;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 5px;
            z-index: 9999;
        `
        );
        loader.id = `axeLoader-${Math.random().toString(36).substr(2, 9)}`; // Random ID
        loader.setAttribute('aria-hidden', 'true'); // Hide from assistive tech
        loader.textContent = 'Running accessibility checks...';
        document.body.appendChild(loader);
    }

    // Function to hide the loader when results are ready
    function hideLoader() {
        var loader = document.querySelector('[id^="axeLoader"]');
        if (loader) {
            loader.remove();
        }
    }

    function injectAxeAndRun() {
        if (typeof axe === 'undefined') {
            var script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.0/axe.min.js';
            script.onload = function () {
                runAxe();
            };
            document.head.appendChild(script);
        } else {
            runAxe();
        }
    }

    function runAxe() {
        showLoader(); // Show loader before running Axe
        axe.run(
            document,
            {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
                },
                resultTypes: ['violations', 'incomplete'],
                iframes: true,
                shadowDom: true,
                exclude: [['[id^="axeLoader"]']], // Use prefix selector to ignore all loaders
            },
            function (error, results) {
                hideLoader(); // Hide loader after results are ready
                if (error) {
                    console.error(error);
                    return;
                }
                displayResults(results);
            }
        );
    }

    function displayResults(results) {
        // Create a container div for the results overlay
        var container = document.createElement('div');
        container.setAttribute(
            'style',
            `
            position: fixed;
            top: 10%;
            left: 25%;
            width: 50%;
            height: 80%;
            background-color: #fff;
            color: #000;
            overflow: auto;
            z-index: 9999;
            padding: 60px 20px 20px 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            font-family: Arial, sans-serif;
            border-radius: 8px;
        `
        );

        // Rest of your code for displaying results
        // Array to keep track of highlighted elements
        var highlightedElements = [];

        // Function to highlight an element
        function highlightElement(targetSelector) {
            var element = document.querySelector(targetSelector);
            if (!element) return;

            // Save the original border style
            var originalBorder = element.getAttribute('data-original-border');
            if (!originalBorder) {
                originalBorder = element.style.border;
                element.setAttribute('data-original-border', originalBorder);
            }
            // Apply highlight style
            element.style.border = '5px solid red';

            // Keep track of highlighted elements
            if (!highlightedElements.includes(element)) {
                highlightedElements.push(element);
            }
        }

        // Create a close button for the overlay
        var closeBtn = document.createElement('button');
        closeBtn.textContent = 'X';
        closeBtn.setAttribute(
            'style',
            `
            position: fixed;
            top: calc(10% + 10px);
            right: calc(25% + 10px);
            padding: 5px 10px;
            background-color: #f44336;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            z-index: 10000;
        `
        );
        closeBtn.onclick = function () {
            document.body.removeChild(container);
            document.body.removeChild(closeBtn);
            document.body.removeChild(highlightAllBtn);
        };
        document.body.appendChild(closeBtn);

        // Create a button to highlight all violations
        var highlightAllBtn = document.createElement('button');
        highlightAllBtn.textContent = 'Highlight All Issues';
        highlightAllBtn.setAttribute(
            'style',
            `
            position: fixed;
            top: calc(10% + 50px);
            right: calc(25% + 10px);
            padding: 5px 10px;
            background-color: #2196F3;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            z-index: 10000;
        `
        );
        highlightAllBtn.onclick = function () {
            highlightAllViolations(results.violations);
        };
        document.body.appendChild(highlightAllBtn);

        // Function to highlight all violation elements
        function highlightAllViolations(violations) {
            violations.forEach(function (violation) {
                violation.nodes.forEach(function (node) {
                    if (node.target && node.target.length > 0) {
                        node.target.forEach(function (targetSelector) {
                            highlightElement(targetSelector);
                        });
                    }
                });
            });
        }

        // Function to create sections for each result type
        function createSection(titleText, items, type) {
            var card = document.createElement('details');
            card.setAttribute('style', 'margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; padding: 10px; background-color: #f9f9f9;');
            var summary = document.createElement('summary');
            summary.textContent = titleText;
            summary.setAttribute('style', 'font-weight: bold; cursor: pointer;');
            card.appendChild(summary);
            var section = document.createElement('div');

            if (items.length > 0) {
                items.forEach(function (item, index) {
                    var details = document.createElement('details');
                    details.setAttribute('style', 'margin-bottom: 10px;');
                    var summary = document.createElement('summary');
                    summary.setAttribute('style', 'cursor: pointer; font-weight: bold;');
                    summary.textContent = (index + 1) + '. ' + item.description;
                    details.appendChild(summary);

                    var contentDiv = document.createElement('div');
                    contentDiv.setAttribute('style', 'margin-left: 20px; margin-top: 5px;');
                    var explanation = document.createElement('p');
                    explanation.textContent = getFriendlyExplanation(item, type);
                    contentDiv.appendChild(explanation);

                    var learnMoreLink = document.createElement('a');
                    learnMoreLink.href = item.helpUrl;
                    learnMoreLink.textContent = 'Learn more about this issue';
                    learnMoreLink.target = '_blank';
                    learnMoreLink.setAttribute('style', 'display: block; margin-bottom: 10px; color: #2196F3; text-decoration: none;');
                    contentDiv.appendChild(learnMoreLink);

                    if (item.nodes && item.nodes.length > 0) {
                        var nodesList = document.createElement('ul');
                        item.nodes.forEach(function (node) {
                            var nodeItem = document.createElement('li');
                            var codeBlock = document.createElement('code');
                            codeBlock.textContent = node.html.trim();
                            codeBlock.setAttribute('style', 'display: block; background-color: #f5f5f5; padding: 5px; border-radius: 3px; margin-bottom: 5px; white-space: pre-wrap;');
                            var highlightLink = document.createElement('a');
                            highlightLink.href = '#';
                            highlightLink.textContent = 'Highlight Element on Page';
                            highlightLink.style.color = '#2196F3';
                            highlightLink.style.textDecoration = 'none';

                            if (node.target && node.target.length > 0) {
                                var targetSelector = node.target[0];
                                highlightLink.onclick = function (e) {
                                    e.preventDefault();
                                    var element = document.querySelector(targetSelector);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        highlightElement(targetSelector);
                                    }
                                };
                            } else {
                                highlightLink.style.color = 'gray';
                                highlightLink.onclick = function (e) {
                                    e.preventDefault();
                                };
                            }

                            nodeItem.appendChild(codeBlock);
                            nodeItem.appendChild(highlightLink);
                            nodesList.appendChild(nodeItem);
                        });
                        contentDiv.appendChild(nodesList);
                    }
                    details.appendChild(contentDiv);
                    section.appendChild(details);
                });
            } else {
                var noItems = document.createElement('p');
                noItems.textContent = 'No issues found in this category.';
                section.appendChild(noItems);
            }

            card.appendChild(section);
            container.appendChild(card);
        }

        // Function to provide user-friendly explanations
        function getFriendlyExplanation(item, type) {
            switch (type) {
                case 'violations':
                    return 'Issue: ' + item.description + ' This needs to be fixed to improve accessibility.';
                case 'incomplete':
                    return 'This item requires manual review to determine if there is an accessibility issue.';
                default:
                    return '';
            }
        }

        // Display Violations
        createSection('Accessibility Issues to Fix:', results.violations, 'violations');
        // Display Incomplete
        createSection('Accessibility Issues Needing Manual Review:', results.incomplete, 'incomplete');
        // Append the results container to the body
        document.body.appendChild(container);
    }

    // Wait for the page to fully load before running the accessibility checks
    if (document.readyState === 'complete') {
        injectAxeAndRun();
    } else {
        window.addEventListener('load', injectAxeAndRun);
    }
})();
