const axios = require('axios')

module.exports = class baseRoutes {
   constructor() {
      this.serverURL = 'http://35.169.224.183:3105/';
      this.sessionAttributes = {};

      this.buildResponse = require('./../buildResponse');
   }

   checkSuggestion(intent, userID) {
      return new Promise((res, rej) => {
         axios.get(this.serverURL + 'sales/last/user/' + userID)
            .then(data => res(data))
            .catch(data => res(data))
      })
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
               this.sendBackReturnedData(intentName, resp.data[0], callback)
            })
      }
      else if (intent.slots.view.value == 'map')
         return
      else {
         delete intent.slots.view
         delete intent.slots.suggestion
         let route = this.buildQueryString(intent.slots)
         let sessionQuery = 'userID' + '=' + userID

         this.sendRequest(route, sessionQuery, intentName, callback)
      }
   }

   handleErr(err, callback) {
      let speechOutput = "What was that? I couldn't understand you, please try again";
      let repromptText = err;
      callback(this.sessionAttributes, this.buildResponse('Error', speechOutput, repromptText, false));
   }

   buildQueryString(intentSlots) {
      var route = '';
      var query = intentSlots.type.value + '/';
      var reset = '';
      delete intentSlots.type

      for (var i in intentSlots) {
         let cur = intentSlots[i];
         if (cur && cur.value && cur.name == 'reset') {
            reset = cur.value.toLowerCase();
         }
         else if (cur && cur.value && cur.name != 'group' && cur.name != 'reset')
            query += cur.name.toLowerCase() + '/' + cur.value.toLowerCase() + '/'
         else if (cur && cur.value && cur.name == 'group')
            query += '?' + cur.name.toLowerCase() + '=' + cur.value.toLowerCase() + '&';
      }

      if (reset != '')
         query += reset + '&';

      return query;
   }

   sendBackReturnedData(intentName, response, callback) {
      response = JSON.parse(JSON.stringify(response.data));
      let speechOutput = response.speechlet
      let repromptText = "Oh noes, Something went wrong, please try again.";
      callback(this.sessionAttributes, this.buildResponse(intentName, speechOutput, repromptText, false));
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

   sendRequest(route, sessionQuery, intentName, callback) {
      axios.get(this.serverURL + route.toLowerCase() + sessionQuery)
         .then(resp => this.sendBackReturnedData(intentName, resp, callback))
         .catch(err => {
            this.handleErr(err, callback)
         });
   }

   logRoute() { } // implement logic to log route here
}
