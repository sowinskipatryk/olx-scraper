async function scrapeOffers() {
    const offerCards = $("div[data-cy='l-card']").toArray();
    const offers = offerCards.map(card => {
        const title = $(card).find("div[data-cy='ad-card-title'] a").text().trim();
        const price = $(card).find("p[data-testid='ad-price']").text().trim();
        const locationAndDate = $(card).find("p[data-testid='location-date']").text().trim();
        const condition = $(card).find("div[data-cy='ad-card-title']").next().text().trim();
        return { title, price, locationAndDate, condition };
    });

    console.log(`Scraped ${offers.length} offers.`);
    return offers;
}

async function saveToFile(data, fileName) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

async function runScraper() {
    console.log('Scraper started.');

    let nextPageAnchor;
    let allOffers = [];
    let page = 0;

    try {
        while ((nextPageAnchor = $("a[data-cy='pagination-forward']")[0])) {
            console.log(`Scraping page ${page + 1}...`);
            const offers = await scrapeOffers();
            allOffers = allOffers.concat(offers);
            await saveToFile(allOffers, 'all_offers.json');
            nextPageAnchor.click();
            await waitForElement('div[data-testid="listing-grid"]');
            await timeout();
            page++;
        }

        console.log(`Scraping last page ${page}...`);
        const lastPageOffers = await scrapeOffers();
        allOffers = allOffers.concat(lastPageOffers);
        await saveToFile(allOffers, 'all_offers.json');

        console.log(`Scraped a total of ${allOffers.length} offers. Saving to file...`);
    } catch (error) {
        console.error('Error occurred during scraping:', error);
        console.log('Saving collected data so far...');
        await saveToFile(allOffers, 'all_offers.json');
    } finally {
        console.log('Scraper task completed.');
    }
}

function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
}

async function timeout() {
    return new Promise(resolve =>
        setTimeout(resolve, Math.floor(Math.random() * 1000) + 3000)
    );
}

(() => {
    const jqueryScript = document.createElement('script');
    jqueryScript.type = 'text/javascript';
    jqueryScript.async = false;
    jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    document.getElementsByTagName('head')[0].appendChild(jqueryScript);

    jqueryScript.addEventListener('load', runScraper);
})();
