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


   sendRequest(route, sessionQuery, intentName, callback) {
      console.log(this.serverURL + route.toLowerCase() + sessionQuery)
      axios.get(this.serverURL + route.toLowerCase() + sessionQuery)
         .then(resp => this.sendBackReturnedData(intentName, resp, callback))
         .catch(err => {
            console.log(err)
            this.handleErr(err, callback)
         });
   }

   logRoute() { } // implement logic to log route here
}
