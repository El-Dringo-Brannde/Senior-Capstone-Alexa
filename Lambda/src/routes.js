var baseRoute = require('./models/baseRoutes');
const axios = require('axios')

module.exports = class routes extends baseRoute {
   constructor() {
      super();
   }

   goToRoute(intent, userID, callback) {
      this.parseRoute(intent, userID, callback);
   }

   // entry point to parsing routes
   parseRoute(intent, userID, callback) {
      const intentName = intent.name;
      let response = this.changeView(intent, userID, intentName, callback)
      if (intent.slots.suggestion && intent.slots.suggestion.value == 'yes') {
         this.checkSuggestion(intent, userID)
            .then(resp => {
               delete intent.slots.view
               delete intent.slots.suggestion
               let route = this.buildQueryString(intent.slots)
               let sessionQuery = 'userID' + '=' + userID
               this.sendBackReturnedData(intentName, resp, callback)
            })
      } else {
         delete intent.slots.view
         delete intent.slots.suggestion
         let route = this.buildQueryString(intent.slots)
         let sessionQuery = 'userID' + '=' + userID

         this.sendRequest(route, sessionQuery, intentName, callback)
      }
   }

   changeView(intents, userID, intentName, callback) {
      if (intents.slots.view.value == 'map') {
         let query = this.pullMapViewParams(intents, userID)
         axios.get(this.serverURL + query)
            .then(resp => {
               query = query.replace('mapView', 'map')
               axios.get(this.serverURL + query + `&group=${intents.slots.group.value}`)
                  .then(resp => {
                     this.sendBackReturnedData(intentName, resp, callback)
                  })
            });
      } else
         axios.get(this.serverURL + 'sales/home')
            .then(resp => console.log(resp.data));
   }

   pullMapViewParams(intents, userID) {
      let url = 'sales/mapView/name/'
      url += intents.slots.location.value + '/'
      delete intents.slots.location
      url += 'state/' + intents.slots.state.value + '/'
      url += 'city/' + intents.slots.city.value + '/'
      url += `?userID=${userID}`
      return url
   }

}
