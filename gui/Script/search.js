$(document).ready(function() {
            console.log('Search script loaded');

            $("#search-button").on('click', searchItems);
            $("#search-input").on('keyup', function(e) {
                if (e.key === 'Enter') searchItems();
            });

            function searchItems() {
                const searchTerm = $("#search-input").val();
                const showPrime = $("#show-prime").prop('checked');
                const showWiki = $("#show-wiki").prop('checked');

                if (searchTerm.length < 3) {
                    $("#results").html("<p>Please enter at least 3 characters to search.</p>");
                    return;
                }

                $("#results").html("<p>Searching...</p>");

                $.getJSON(`https://api.warframestat.us/items/search/${searchTerm}`)
                    .done(function(itemData) {
                        let resultsHtml = "";
                        if (itemData.length > 0) {
                            itemData.forEach(item => {
                                if (!showPrime && item.name.toLowerCase().includes('prime')) {
                                    return;
                                }

                                let wikiUrl = item.wikiaUrl || `https://warframe.fandom.com/wiki/${encodeURIComponent(item.name.replace(/ /g, '_'))}`;

                                let dropInfoHtml = getDropInfo(item);
                                let relicInfoHtml = getRelicInfo(item);

                                resultsHtml += `
                                    <div class="result-card">
                                        <div class="result-content">
                                            <div class="result-info">
                                                <h2 class="result-title">${item.name}</h2>
                                                <div class="result-details">Type: ${item.type || 'N/A'}</div>
                                                ${item.description ? `<div class="result-description">${item.description}</div>` : ''}
                                                ${dropInfoHtml}
                                                ${relicInfoHtml}
                                            </div>
                                            <div class="result-image-container">
                                                ${item.wikiaThumbnail ? `<img src="${item.wikiaThumbnail}" alt="${item.name}" class="result-image">` : ''}
                                                ${showWiki ? `<a href="${wikiUrl}" class="wiki-link" target="_blank">Wiki Page</a>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            });
                        }

                        if (resultsHtml === "") {
                            resultsHtml = "<p>No results found for the search term.</p>";
                        }

                        $("#results").html(resultsHtml);
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        console.error("API request failed", textStatus, errorThrown);
                        $("#results").html("<p>Error occurred while searching. Please try again later.</p>");
                    });
            }

            function getDropInfo(item) {
                let dropInfoHtml = '';
                if (item.drops && item.drops.length > 0) {
                    dropInfoHtml += '<div class="drop-info"><h3>Drop Locations:</h3><ul>';
                    item.drops.forEach(drop => {
                        dropInfoHtml += `<li>${drop.location}: ${drop.chance.toFixed(2)}%</li>`;
                    });
                    dropInfoHtml += '</ul></div>';
                }
                return dropInfoHtml;
            }

            function getRelicInfo(item) {
                let relicInfoHtml = '';
                if (item.components) {
                    relicInfoHtml += '<div class="relic-info"><h3>Relic Drops:</h3><ul>';
                    item.components.forEach(component => {
                        if (component.drops) {
                            component.drops.forEach(drop => {
                                if (drop.location.includes('Relic')) {
                                    let rarity = getRarityClass(drop.chance);
                                    relicInfoHtml += `<li><span class="rarity ${rarity}">${component.name}</span>: ${drop.location} (${drop.chance.toFixed(2)}%)</li>`;
                                }
                            });
                        }
                    });
                    relicInfoHtml += '</ul></div>';
                }
                return relicInfoHtml;
            }

            function getRarityClass(chance) {
                if (chance <= 2) return 'rare';
                if (chance <= 11) return 'uncommon';
                return 'common';
            }
        });