// Globális változók
let pyotherside;
const API_BASE_URL = 'https://api.warframestat.us/items/search/';
const PLACEHOLDER_IMAGE_URL = '/path/to/your/placeholder-image.png'; // Frissítse ezt a valós elérési úttal

// QWebChannel inicializálás
function initWebChannel() {
    if (typeof QWebChannel === "undefined") {
        console.log("QWebChannel not available yet, retrying...");
        setTimeout(initWebChannel, 100);
        return;
    }
    new QWebChannel(qt.webChannelTransport, function (channel) {
        pyotherside = channel.objects.pyotherside;
        console.log("QWebChannel initialized");
        initSearch();
    });
}

// DOM betöltés eseménykezelő
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded");
    initWebChannel();
});

// Keresés inicializálás
function initSearch() {
    console.log("Search initialization started");

    $("#search-button").on('click', searchDrops);
    $("#search-input").on('keyup', function(e) {
        if (e.key === 'Enter') {
            searchDrops();
        }
    });

    $(document).on('click', '.wiki-link', function(e) {
        e.preventDefault();
        let url = $(this).attr('href');
        if (pyotherside && pyotherside.open_url) {
            pyotherside.open_url(url);
        } else {
            window.open(url, '_blank');
        }
    });

    console.log("Search initialization completed");
}

// Ritkaság meghatározása
function getRarity(chance) {
    if (chance < 5) return "Rare";
    if (chance < 15) return "Uncommon";
    return "Common";
}

// Fő keresési funkció
function searchDrops() {
    console.log("Search function called");
    const searchTerm = $("#search-input").val();
    const showPrime = $("#show-prime").prop('checked');
    const showWiki = $("#show-wiki").prop('checked');

    if (searchTerm.length < 3) {
        $("#results").html("<p>Please enter at least 3 characters to search.</p>");
        return;
    }

    $("#results").html("<p>Searching...</p>");

    $.ajax({
        url: API_BASE_URL + encodeURIComponent(searchTerm),
        method: 'GET',
        dataType: 'json',
        timeout: 10000, // 10 másodperces timeout
        success: function(itemData) {
            processSearchResults(itemData, showPrime, showWiki);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $("#results").html("<p>Error occurred while searching. Please try again later. Error: " + textStatus + "</p>");
            console.error("API call failed:", errorThrown);
        }
    });
}

// Keresési eredmények feldolgozása
function processSearchResults(itemData, showPrime, showWiki) {
    let resultsHtml = "";

    if (itemData.length > 0) {
        itemData.forEach(item => {
            if (!showPrime && item.name.toLowerCase().includes('prime')) {
                return;
            }

            resultsHtml += createItemCard(item, showWiki);
        });
    }

    if (resultsHtml === "") {
        resultsHtml = "<p>No results found for the search term.</p>";
    }

    $("#results").html(resultsHtml);
    setTimeout(checkImages, 1000);
}

// Elem kártya létrehozása
function createItemCard(item, showWiki) {
    let statsHtml = createStatsHtml(item);
    let acquisitionHtml = createAcquisitionHtml(item);
    let wikiUrl = item.wikiaUrl || `https://warframe.fandom.com/wiki/${encodeURIComponent(item.name.replace(/ /g, '_'))}`;

    return `
        <div class="result-card">
            <div class="result-content">
                <div class="result-info">
                    <h2 class="result-title">${item.name}</h2>
                    <div class="result-details">Type: ${item.type || 'N/A'}</div>
                    ${item.description ? `<div class="result-description">${item.description}</div>` : ''}
                    ${statsHtml}
                    ${acquisitionHtml}
                </div>
                <div class="result-image-container">
                    ${item.wikiaThumbnail ? `<img src="${item.wikiaThumbnail}" alt="${item.name}" class="result-image">` : ''}
                    ${showWiki ? `<a href="${wikiUrl}" class="wiki-link">Wiki Page</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Statisztikák HTML létrehozása
function createStatsHtml(item) {
    let statsHtml = '';
    if (item.type && item.type.toLowerCase().includes('mod')) {
        if (item.levelStats) {
            statsHtml += '<div class="result-stats"><strong>Level Stats:</strong><table class="level-stats-table">';
            item.levelStats.forEach((stat, index) => {
                statsHtml += `<tr><td>Rank ${index}</td><td>${stat.stats.join(', ')}</td></tr>`;
            });
            statsHtml += '</table></div>';
        }
        if (item.polarity) statsHtml += `<div class="result-stats"><strong>Polarity:</strong> ${item.polarity}</div>`;
        if (item.rarity) statsHtml += `<div class="result-stats"><strong>Rarity:</strong> ${item.rarity}</div>`;
        if (item.fusionLimit) statsHtml += `<div class="result-stats"><strong>Max Rank:</strong> ${item.fusionLimit}</div>`;
    }
    return statsHtml;
}

// Beszerzési információk HTML létrehozása
function createAcquisitionHtml(item) {
    let acquisitionHtml = '';
    if (item.drop && item.drop.length > 0) {
        acquisitionHtml += '<div class="result-acquisition"><strong>Drops:</strong><ul>';
        item.drop.forEach(drop => {
            acquisitionHtml += `<li>${drop.location}: ${drop.chance}% (${getRarity(drop.chance)})</li>`;
        });
        acquisitionHtml += '</ul></div>';
    }
    return acquisitionHtml;
}

// Képek ellenőrzése
function checkImages() {
    console.log("Checking images");
    $('.result-image').each(function() {
        if (!this.complete || this.naturalWidth === 0) {
            console.warn("Image failed to load:", this.src);
            $(this).attr('src', PLACEHOLDER_IMAGE_URL);
        }
    });
}

// Képbetöltés eseményfigyelők
$(document).on('load', '.result-image', function() {
    console.log('Image loaded successfully:', this.src);
}).on('error', '.result-image', function() {
    console.error('Image failed to load:', this.src);
    $(this).attr('src', PLACEHOLDER_IMAGE_URL);
});