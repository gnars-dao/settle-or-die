import "./frames.js";   // kickflip animation easteregg

let auctionEnded = false;
let auctionEndTime = new Date();

function countdown(targetDate) {
  const now = new Date();
  let diff = targetDate.getTime() - now.getTime();

  // Ensure that the target date is in the future
  if (diff < 0) {
    return "00:00";
  }

  let hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  let mins = Math.floor(diff / (1000 * 60));

  hours = hours < 10 ? "0" + hours : hours;
  mins = mins < 10 ? "0" + mins : mins;
  const countdownTime = hours + ":" + mins;

  // Update Chrome badge text
  chrome.action.setBadgeText({ text: countdownTime });

  return countdownTime;
}

function checkSettle() {
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
          chrome.action.setBadgeText({ text: "Settle" });
          return;
        }

        countdown(auctionEndTime);
      })
      .catch((error) =>
        console.log("There has been a problem with your fetch operation: ", error)
      );
  });
}

checkSettle();
setInterval(checkSettle, 1000 * 30); // Check every 30 seconds
setInterval(() => countdown(auctionEndTime), 1000); // Update countdown every second
