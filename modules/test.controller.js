const util = require("util");
const fs = require("fs");

const readDistances = () => {
  const fileToRead = "distances/distance.json";
  const file = fs.readFileSync(fileToRead);
  return JSON.parse(file);
};

/* enable log */
const SHOW_DEBUG_LOG = true;
/* Show log  */
const log = (text) => SHOW_DEBUG_LOG && console.log("Log => ", text);
/* Function to inspect a variable */
const inspectVar = (t, v) =>
  SHOW_DEBUG_LOG && console.log(`${t}:\n`, util.inspect(v, false, null, true));

const identifySameOrigins = (distances) => {
  /* Marking the same origin,same destination distances */
  distances.map((item, index) => {
    const copiedItem = item;
    if (index > 0) {
      copiedItem.elements[index - 1].sameOrigin = true;
    }
    return copiedItem;
  });
};
const meterToMiles = (meter) => {
  return meter / 1609.34;
};
const cleanRouteObject = ({ distance, duration }) => {
  const newObj = {
    distance,
    duration,
  };
  return newObj;
};
const calculateCharges = (routeLength) => {
  /* Distance in miles */
  const dist = parseFloat((routeLength / 1610).toFixed(2));

  let deliveryCharges = 7.0;

  deliveryCharges = parseFloat((dist + 1).toFixed(2));
  if (dist < 2.5) {
    deliveryCharges = 1.0;
  } else if (dist > 2.49 && dist < 5) {
    deliveryCharges = 2.0;
  } else if (dist > 4.99 && dist < 7) {
    deliveryCharges = 3.0;
  } else if (dist < 10.01) {
    deliveryCharges = 5;
  } else {
    deliveryCharges = 10;
  }

  return deliveryCharges;
};

const solution = () => {
  log("start of solution");
  const data = readDistances();
  const {
    origin_addresses: originAddresses,
    destination_addresses: destinationAddresses,
    rows: distances,
    customers,
  } = data;
  const solution = [];
  identifySameOrigins(distances);
  /* 5 miles */
  const maxRouteLength = 8046 + 8046 * 0.3; // meters
  /* Parent Object */
  const calculations = {
    /* Distances of store from each customer */
    dosfec: distances[0].elements,
    /* Number of destinations */
    nod: destinationAddresses.length,
    /* Number of origins */
    nOrigins: originAddresses.length,
    /* All customers ready to be assigned to rider(s), default: no of destinations */
    customersRemaining: destinationAddresses.length,
    /* Number of riders currently allocated */
    routeNumber: 1,
    /* Previous total distance */
    prevDistance: 0,
    /* index for the last allocated customer */
    lastAllocated: 0,
    /* Delivery routes calculated */
    deliveryRoutes: [],
    /* Current Route */
    currentRoute: [],
  };
  while (calculations.customersRemaining > 0) {
    if (calculations.prevDistance === 0) {
      /* Find the customer closest to the store */
      // Set the first customer to be the closest by default
      let closest = 0;
      for (let i = 0; i < calculations.nod; i += 1) {
        /* If there is only one customer remaining
            and the is not allocated a route */
        if (
          calculations.customersRemaining < 2 &&
          !calculations.dosfec[i].allocated
        ) {
          /* Set this customer to be closest to the store */
          closest = i;
        } else if (
          /* If the distance of the last selected closest customer
              is greater than or equal to the current customer */
          calculations.dosfec[closest].distance.value >=
            calculations.dosfec[i].distance.value &&
          /* And of the the current customer is not allocated a route */
          calculations.dosfec[i].allocated !== true
        ) {
          /* Set the current customer in the loop to be the closest */
          closest = i;
        }
      }
      log(closest);
      /* Set the route status for  customer that was found
          to be the closest to the store to be true i.e. A route
          was found found for this individual customer */
      calculations.dosfec[closest].allocated = true;
      /* Set the route number to this customer */
      calculations.dosfec[closest].routeNumber = calculations.routeNumber;
      /* Set the total distance of the current route to be distance of this route just created  */
      calculations.prevDistance = calculations.dosfec[closest].distance.value;
      /* Create a route object and remove any extra fields */
      const routeObject = {};
      /* Set the customer to the route */
      routeObject.customer = customers[closest];
      /* Get the charges for the customer using calculate charges method */
      routeObject.deliveryCharges = calculateCharges(
        calculations.dosfec[closest].distance.value
      );
      routeObject.path = `${calculations.dosfec[closest].distance.value} meters from Store to ${customers[closest]}.`;

      calculations.currentRoute.push(routeObject);
      /* Decremtnt the customers remaining to be assigned a route */
      calculations.customersRemaining -= 1;

      calculations.lastAllocated = closest;
    } else if (calculations.prevDistance > 0) {
      /* If the current route has at least one customer in it */
      /*
            and there are customers remaining
         */
      /* MAKE THIS VALUE FALSE BEFORE SOLVING. THIS MAKES SURE THAT THE LOOP DOES NOT RUN INFINITELY */
      const skipForTest = false;

      if (
        !skipForTest &&
        // If total distance of the route calcuated previously is less than maxlen
        calculations.prevDistance < maxRouteLength &&
        // Then check if there are customers remaining
        calculations.customersRemaining
      ) {
        // this is for finding customer close to the store
        if (calculations.deliveryRoutes.length === 0) {
          var minimumDistance = 0;
          var index = 0;

          // find minimum distance of the customer close to the store
          data.rows[0].elements.forEach((item, i) => {
            if (minimumDistance === 0) {
              minimumDistance = item.distance.value;
            } else if (minimumDistance > item.distance.value) {
              minimumDistance = item.distance.value;
              // closest customer's index from store
              index = i;
            }
          });

          calculations.currentRoute[0].path = `${data.rows[0].elements[index].distance.text} from store to ${data.customers[index]}`;
          calculations.prevDistance =
            data.rows[0].elements[index].distance.value;

          calculations.deliveryRoutes.push({
            totalLength: `${data.rows[0].elements[index].distance.text} from store`,
            route: calculations.currentRoute,
          });
        } else {
          // finding customer close to the previous customer
          var minimumDistance_item = 0;
          var index_item = 0;
          // ignore the index(customer) already present in delivery routes lets say C for first time
          const ignoreIndex = data.customers.indexOf(
            calculations.deliveryRoutes[calculations.deliveryRoutes.length - 1]
              .route[calculations.deliveryRoutes[0].route.length - 1].customer
          );
          // finding closest customer to previous customer
          data.rows[
            // finding already present customer's index to later iterate that customer to find the closest cus to him
            data.customers.indexOf(
              calculations.deliveryRoutes[
                calculations.deliveryRoutes.length - 1
              ].route[calculations.deliveryRoutes[0].route.length - 1].customer
            ) + 1
          ].elements.forEach((item, index_small) => {
            // finding closest customer to previous customer that is alreday in delivery route path
            if (ignoreIndex !== index_small) {
              if (minimumDistance_item === 0) {
                minimumDistance_item = item.distance.value;
                index_item = index_small;
              } else if (item.distance.value < minimumDistance_item) {
                minimumDistance_item = item.distance.value;
                index_item = index_small;
              }
            }
          });
          const newDistance =
            data.rows[
              data.customers.indexOf(
                calculations.deliveryRoutes[
                  calculations.deliveryRoutes.length - 1
                ].route[calculations.deliveryRoutes[0].route.length - 1]
                  .customer
              ) + 1
            ].elements[index_item].distance.value;
          const newPath = `${
            // finding path for that new customer
            data.rows[
              data.customers.indexOf(
                calculations.deliveryRoutes[
                  calculations.deliveryRoutes.length - 1
                ].route[calculations.deliveryRoutes[0].route.length - 1]
                  .customer
              ) + 1
            ].elements[index_item].distance.text
          } From ${
            calculations.deliveryRoutes[calculations.deliveryRoutes.length - 1]
              .route[calculations.deliveryRoutes[0].route.length - 1].customer
          } to ${data.customers[index_item]}`;

          // updating total route length for the delivery route
          calculations.deliveryRoutes[
            calculations.deliveryRoutes.length - 1
          ].route.push({
            customer: data.customers[index_item],
            deliveryCharges: `${newDistance !== 0 ? 2 : 1}`,
            path: newPath,
          });

          calculations.prevDistance += newDistance;
          calculations.deliveryRoutes[0].totalLength = `${meterToMiles(
            calculations.prevDistance
          ).toFixed(1)} meters from store`;
        }

        calculations.customersRemaining -= 1;
      } else {
        // Increment the number of routes assigned
        calculations.routeNumber += 1;

        // Push the route calculated to the all deliveryRoutes
        calculations.deliveryRoutes.push({
          totalLength: `${calculations.prevDistance} meters from Store.`,
          route: calculations.currentRoute,
        });

        // Set the total distance of the route to be zero
        calculations.prevDistance = 0;
        // set the current route be empty
        calculations.currentRoute = [];
      }
    }
    /* If there a no more customers remaining */

    if (calculations.customersRemaining < 1) {
      var maxDistance = 0;
      var index = 0;

      data.rows[0].elements.forEach((item, i) => {
        if (maxDistance === 0) {
          maxDistance = item.distance.value;
        } else if (maxDistance < item.distance.value) {
          maxDistance = item.distance.value;
          index = i;
        }
      });
      /* Push the current route in all deliveryRoutes in calculations */

      calculations.deliveryRoutes.push({
        totalLength: `${
          calculations.prevDistance / 1609.34
        } meters from Store.`,
        route: {
          customer: data.customers[index],
          deliveryCharges: 2,
          path: `${data.rows[0].elements[index].distance.text} From Store to ${data.customers[index]}`,
        },
      });
      calculations.deliveryRoutes[
        calculations.deliveryRoutes.length - 1
      ].totalLength = `${data.rows[0].elements[index].distance.text} From Store to ${data.customers[index]}`;
      /* Set the current route be empty */
      calculations.currentRoute = [];
    }
  }
  inspectVar("solution", calculations.deliveryRoutes);
  log("end of solution");
};

module.exports = {
  solution,
};
