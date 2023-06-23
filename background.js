import "./frames.js";

let auctionEnded = false;
let auctionEndTime = new Date();
let blinkIntervalId;  // Define the blinkIntervalId variable

function startBlinking() {
  // Clear existing blinking if any
  if (blinkIntervalId) {
    clearInterval(blinkIntervalId);
  }

  // Set badge text to 'Settle'
  chrome.action.setBadgeText({ text: "Settle" });
  chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });

  let blinkState = false;

  blinkIntervalId = setInterval(() => {
    chrome.action.setBadgeText({ text: blinkState ? "Settle" : "" });
    blinkState = !blinkState;
  }, 500);
}

function stopBlinking() {
  // Clear blinking
  if (blinkIntervalId) {
    clearInterval(blinkIntervalId);
    blinkIntervalId = null;
  }
  // Clear badge text
  chrome.action.setBadgeText({ text: "" });
}

function countdown(targetDate) {
  let intervalId; // Define the intervalId variable

  const updateBadge = () => {
    const now = new Date();
    let diff = targetDate.getTime() - now.getTime();

    // Ensure that the target date is in the future
    if (diff < 0) {
      clearInterval(intervalId);
      chrome.action.setBadgeText({ text: "waxxing" });
      return;
    }

    let hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    let mins = Math.floor(diff / (1000 * 60));
    let secs = Math.floor(((diff / 1000) + 1) % 60);

    hours = hours < 10 ? "0" + hours : hours;
    mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;

    const countdownTime = hours > 0 ? hours + ":" + mins : mins + ":" + secs;

    // Update Chrome badge text
    chrome.action.setBadgeText({ text: countdownTime });
  };

  // Initial update
  updateBadge();

  // Update the badge every second
  intervalId = setInterval(updateBadge, 1000);
}

function performCountdown(countdownTime) {
  // Perform actions based on the countdown time
  // ...

  // Example: Show alert when countdown reaches 2 minutes
  if (countdownTime === "02:00") {
    console.log("Auction has 2 minutes left!");
  }
}

function fetchCountdownTime() {
  // Check the state of the toggle switch
  chrome.storage.sync.get("toggleState", function (data) {
    const isChecked = data.toggleState;
    let query;
    let url;

    if (isChecked) {
      // Nouns position - Use NOUNS query and URL
      url = "https://api.thegraph.com/subgraphs/name/nounsdao/nouns-subgraph";
      query = `
        {
          auctions(first: 1, orderBy: endTime, orderDirection: desc) {
            settled
            id
            noun {
              id
            }
            endTime
          }
        }
      `;
    } else {
      // Gnars position - Use GNARS query and URL
      url = "https://api.thegraph.com/subgraphs/name/gnarsdao/gnars";
      query = `
        {
          auctions(first: 1, orderBy: endTime, orderDirection: desc) {
            settled
            id
            gnar {
              id
            }
            endTime
          }
        }
      `;
    }

    // Request options
    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
      }),
    };

    // Send the request
    fetch(url, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => data.data.auctions[0])
      .then((auction) => {
        const { endTime } = auction;
        const now = new Date();
        const lastAuctionDate = new Date(Number(`${endTime}000`));
        auctionEnded = now > lastAuctionDate;
        auctionEndTime = lastAuctionDate;

        if (auctionEnded) {
          startBlinking();
          return;
        }

        stopBlinking();
        countdown(auctionEndTime);
        performCountdown(auctionEndTime);
      })
      .catch((error) => {
        console.error("There has been a problem with your fetch operation:", error);
      });
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("background.js")
      .then(() => {
        console.log("Service worker registered successfully");
        fetchCountdownTime();
      })
      .catch((error) => {
        console.error("Error registering service worker:", error);
      });
  }
}

// Register service worker on browser startup
chrome.runtime.onStartup.addListener(registerServiceWorker);

// Call fetchCountdownTime initially and at intervals of 30 seconds
fetchCountdownTime();
setInterval(fetchCountdownTime, 30000);
