const statusElem = document.getElementById("status");

const getCurrentTab = async () => {
  let queryOptions = { active: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

const callInject = (tab, lat, long, gallons, mileage) => {
  const {id, url} = tab;
  chrome.scripting.executeScript({target: {tabId: id}, files: ['scripts/content.js']}, () => {
  chrome.scripting.executeScript({
    target: {tabId: id},
    args: [lat, long, gallons, mileage],
    func: (...args) => onInjection(...args)
  }, () => {statusElem.innerHTML = "Done!";});
});
}

const prepareInject = (gallons, mileage) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      let lat = position.coords.latitude;
      let long = position.coords.longitude;
      getCurrentTab().then((tab) => {
        statusElem.innerHTML = "Working on calculation...";
        callInject(tab, lat, long, gallons, mileage);
      })
    });
  }
}

const onClickSubmit = () => {
  if (parseFloat(document.getElementById('gallons').value) <= 0 || parseFloat(document.getElementById('mileage').value) <= 0) {
    statusElem.innerHTML = "Must Enter Gallons and Mileage!";
    console.log("Must Enter Gallons and Mileage");
    return;
  }
  statusElem.innerHTML = "Getting Location...";
  prepareInject(parseFloat(document.getElementById('gallons').value), parseFloat(document.getElementById('mileage').value));
}

document.getElementById("button-submit").addEventListener("click", onClickSubmit);