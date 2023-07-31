const BingMapsKey = "***************";

const priceNodes = document.querySelectorAll("[class*='StationDisplayPrice-module__price___']")
const prices = [];
priceNodes.forEach((node) => {
	let priceFloat = parseFloat(node.innerHTML.replace("$", ""));
	prices.push(priceFloat);
})

const dataNodes = document.querySelectorAll("[type='application/ld+json']")
const dataJSON = JSON.parse(dataNodes[0].innerHTML);
const destinations = [];
for (var i = 0; i < prices.length; i++) {
	let dest = dataJSON["@graph"][3].itemListElement[i];
	destinations.push({
		"latitude": dest.geo.latitude,
		"longitude": dest.geo.longitude,
		"address": dest.address,
		"price": prices[i]
	})
}

const kmToMi = (km) => {return km*0.6213712;}

const getPrices = async (origins, destinations, gallons, mileage) => {
	const distData = await getDists(origins, destinations);
	if (!distData.success)
			return;
	let results = [];
	for (var i = 0; i < destinations.length; i++) {
		let distance = kmToMi(distData.data[i].travelDistance);
		let gallonsToDest = distance / mileage;
		let priceToDest = gallonsToDest * destinations[i].price;
		let priceToFill = gallons * destinations[i].price;
		results.push({"distance": distance, "priceTo": priceToDest, "priceFill": priceToFill});
	}
	return results;
}

const getDists = async (origins, destinations) => {
	const response = await fetch(`https://dev.virtualearth.net/REST/v1/Routes/DistanceMatrix?key=${BingMapsKey}`,
		{
			method: "POST",
			body: JSON.stringify(
				{
					"origins": origins,
					"destinations": destinations,
					"travelMode": "driving"
				}
			),
	  		headers: {
	    		"Content-type": "application/json; charset=UTF-8"
	  		}
	  	}
	);

	if (!response.ok)
		return {
			"success": false,
			"data": []
		};

	const data = await response.json();
	return {
		"success": true,
		"data": data.resourceSets[0].resources[0].results
	};
}

function onInjection(lat, long, gallons, mileage) {
	let origins = [{"latitude": lat, "longitude": long}]
	getPrices(origins, destinations, gallons, mileage).then((results) => {
		const divsToInject = document.querySelectorAll("[class*='StationDisplayPrice-module__bordered___']")
		for (var i = 0; i < divsToInject.length; i++) {
			let injectedDiv = document.createElement("div");
	    	injectedDiv.innerHTML = `Distance: ${results[i].distance.toFixed(1)} mi<br>Price To: $${results[i].priceTo.toFixed(2)}<br>Price To Fill: $${results[i].priceFill.toFixed(2)}<br>Price Back: $${results[i].priceTo.toFixed(2)}<br>Total: $${(2*results[i].priceTo + results[i].priceFill).toFixed(2)}`;
	    	divsToInject[i].appendChild(injectedDiv);
		}
	})
}

