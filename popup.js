// Perform an action when the Settle button is clicked
function handleSettleButtonClick() {
  // Open "https://www.settle.wtf" in a new tab
  window.open("https://www.settle.wtf", "_blank");
}

// Handle toggle switch change event
function handleToggleSwitchChange() {
  const toggleSwitch = document.getElementById("querySwitch");
  const toggleLabels = document.getElementsByClassName("toggle-labels")[0];
  const isChecked = toggleSwitch.checked;

  if (isChecked) {
    // Toggle switch is checked (position = Nouns)
    console.log("Toggle switch is in the Nouns position");
    // Add the custom CSS class for the "nouns" position
    toggleLabels.classList.add("nouns");
  } else {
    // Toggle switch is not checked (position = Gnars)
    console.log("Toggle switch is in the Gnars position");
    // Remove the custom CSS class for the "nouns" position
    toggleLabels.classList.remove("nouns");
  }

  // Retrieve the last saved toggle switch state from chrome.storage
  chrome.storage.sync.get("toggleState", function (data) {
    const lastToggleState = data.toggleState;

    // Compare the last toggle state with the current state
    if (lastToggleState !== isChecked) {
      // Save the new toggle switch state to chrome.storage
      chrome.storage.sync.set({ toggleState: isChecked }, function () {
        // Reload the extension's background page
        chrome.runtime.reload();
      });
    }
  });
}

// Restore the toggle switch state from chrome.storage
function restoreToggleSwitchState() {
  const toggleSwitch = document.getElementById("querySwitch");

  // Retrieve the toggle switch state from chrome.storage
  chrome.storage.sync.get("toggleState", function (data) {
    const isChecked = data.toggleState;
    toggleSwitch.checked = isChecked;

    // Trigger the change event to update the UI
    toggleSwitch.dispatchEvent(new Event("change"));
  });
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", function () {
  const settleButton = document.getElementById("settleButton");
  const toggleSwitch = document.getElementById("querySwitch");

  settleButton.addEventListener("click", handleSettleButtonClick);
  toggleSwitch.addEventListener("change", handleToggleSwitchChange);

  // Restore the toggle switch state when the popup is opened
  restoreToggleSwitchState();
});
