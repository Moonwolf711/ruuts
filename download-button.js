function addDownloadButton() {
  // Try to find the artwork container
  let artWork =
    document.querySelector(".listenArtworkWrapper") ||
    document.querySelector(".fullHero__artwork");

  // Check if artwork element exists
  if (!artWork) {
    console.error("Artwork element not found.");
    return;
  }

  // Check if the download button already exists to avoid duplicates
  if (artWork.querySelector(".download-button")) {
    console.log("Download button already exists.");
    return;
  }

  // Download button SVG icon
  let downloadIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
    <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
    <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
  </svg>`;

  // Create a new download button
  let downloadButton = document.createElement("span");
  downloadButton.innerHTML = downloadIcon;
  downloadButton.classList.add("download-button");

  // Add event listener to download cover art
  downloadButton.addEventListener("click", () => {
    console.log("Download button clicked");

    // Try to find the background image URL
    let span = artWork.querySelector("span");

    if (!span) {
      console.error("Span element with cover art not found.");
      return;
    }

    let coverArtUrl = span.style.backgroundImage.split('"')[1];
    if (!coverArtUrl) {
      console.error("Failed to extract cover art URL.");
      return;
    }

    // Send message to background script to download the image
    chrome.runtime.sendMessage({
      action: "downloadFile",
      url: coverArtUrl,
    });
  });

  // Append the button to the artwork container
  artWork.append(downloadButton);
}

// Mutation observer for dynamic content loading
const observer = new MutationObserver(function (mutationsList, observer) {
  addDownloadButton();
});

// Start observing the body for changes (for single-page apps like SoundCloud)
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "navigationCompleted") {
    console.log("Navigation completed, adding download button");
    addDownloadButton();
  }
});// Listen for messages sent from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "downloadFile") {
    // Trigger a file download
    chrome.downloads.download({ url: message.url }, function (downloadId) {
      if (chrome.runtime.lastError) {
        console.error("Download failed: " + chrome.runtime.lastError.message);
        sendResponse({ status: "error", message: chrome.runtime.lastError.message });
      } else {
        console.log("Successfully started download with ID:", downloadId);
        sendResponse({ status: "success", downloadId: downloadId });
      }
    });

    // Required to indicate that we are responding asynchronously
    return true; // Keeps the message channel open for async response
  }
});
// Listen for completed navigation events
chrome.webNavigation.onCompleted.addListener(function (details) {
  // Send a message to the content script in the tab where the navigation occurred
  chrome.tabs.sendMessage(details.tabId, { action: "navigationCompleted" }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to content script:", chrome.runtime.lastError.message);
    } else {
      console.log("Message sent to content script successfully:", response);
    }
  });
});

