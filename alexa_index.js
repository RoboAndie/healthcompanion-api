s sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = "amzn1.ask.skill.ac025004-1bb1-4f94-a7d7-8b2fd3b5f4da";  // TODO replace with your app ID (OPTIONAL).

var speechOutput;
 var reprompt;
 var welcomeOutput = '<audio src="https://s3.amazonaws.com/healthcompanionangelhack/hello_care.mp3" />';
 var welcomeReprompt = "Let me know who you would like to help?";
 var stop_message = "I hope you are satisfied with your care.";
var careIntro = [
    "That's all we need. "  
];
var slotNames = ["Condition", "Medication", "Quantity", "Nickname", "Period"];

var prompts = {
    Condition: function(name,med){ return "Of course! What is bothering you, " + name + " ?"},
    Quantity: function(name,med) {return "How much <break /> " + med + " is available?"},
    Medication: function(name,med){ return "What is the name of <break /> " + name + "'s medication?"},
    Nickname: function(name, med) { return "What is another name for <break />" + med + " ?"},
    Period: function(name, med){return "How often should <break />" + name + " <break /> take <break /> " + med + " ? "}
};

var patientPrompts = {
    Medication: "Hello Rose, what medication are you taking?",
    Feeling: 'Ok, go ahead and take your <break strength="strong"/> Aricept. Have a good day!',
    Story: "Thank you for telling me. Also, do you have any stories to tell me today, or maybe something you are looking forward to?"
    
}

var patientSlots = ["Medication", "Feeling","Story"];

var medicationTaken = false;

const handlers = {
    'LaunchRequest': function () {
        this.emit(":tell",welcomeOutput);
    },
    'GetMedicationIntent': function () {
        this.emit('GetMedication');
    },
    "MedicationClassifier": function(){
      this.emit("GetMedication");  
    },
    "GetMedication": function() {
        this.emit(":tell","Let me collect your medical data.");
    },
    "Caretaker": function() {
        //delegate to Alexa to collect all the required slot values
        var filledSlots = delegateSlotCollection.call(this);
         console.log('event: ', JSON.stringify(this.event));

        //compose speechOutput that simply reads all the collected slot values
        try{
        var speechOutput = randomPhrase(careIntro);

        //activity is optional so we'll add it to the output
        //only when we have a valid activity
        var Name = isSlotValid(this.event.request, "Name");
        if (Name) {
          speechOutput += ("I'll take care of " + Name + "'s ");
        } else {
          speechOutput += "I'll take care of your ";
        }

        //Now let's recap the trip
        var Condition=this.event.request.intent.slots.Condition.value;
        var Quantity=this.event.request.intent.slots.Quantity.value;
        var Medication=this.event.request.intent.slots.Medication.value;
        var Nickname=this.event.request.intent.slots.Nickname.value;
        var Period=this.event.request.intent.slots.Period.value;
        speechOutput+=  Condition + " by reminding her to take <break />" +
                        Medication + ' or <break strength="strong"/>' + Nickname + "<break />" + Period + 
                        ". <break /> I'll refill your " + Quantity + ' pills when they run low. <break strength="strong"/>' +
                        "Dagerous drug interactions include Metoprolol and Amlodipine. I hope you are satisfied with your care." +
                        '<audio src="https://s3.amazonaws.com/healthcompanionangelhack/goodbye_care.mp3" />';

        //say the results
        this.emit(":tell",speechOutput);
        }
        catch(e){
            console.log('error : ', e);
        }
    },
    "Patient": function(){
        if(medicationTaken){
            medicationTaken = true;
            this.emit(":tell", "[Rose], you have already taken <break /> Aricept today. Do not take <break /> the red pill again for another <break /> day.")
        }
      var response = delegatePatient.call(this);
      
      
      this.emit(":tell", "Thank you, Rose. You've been wonderful today!");
      
    },
    "SayText": function(){
        var text = this.event.request.intent.slots.Phrase.value;
        this.emit(":tell", '<amazon:effect name="whispered">' + text + '</amazon:effect>');
    },
    "ExclaimText": function(){
        var text = this.event.request.intent.slots.Phrase.value;
        this.emit(":tell", text + ' and <break /> <say-as interpret-as="interjection">'+ 'Wow' +'</say-as>');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', welcomeOutput, welcomeReprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'SessionEndedRequest': function () {
        var speechOutput = "";
        this.emit(':tell', speechOutput);
    },
    'Unhandled': function () {
        this.emit(':ask', welcomeOutput, welcomeReprompt);
    }
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function delegatePatient(){
    if (this.event.request.dialogState === "STARTED" || this.event.request.dialogState === undefined) {
      console.log("in Beginning");
      var updatedIntent=this.event.request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      var response = patientResponse.call(this);
      if(typeof response === 'object'){
          console.log('returning object back to delegate.');
          this.emit(":delegate");
      }
      console.log('emiting started', this.event.request.intent.slots);
      this.emit(":elicitSlot", response, patientPrompts[response]);
    } else if (this.event.request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      // return a Dialog.Delegate directive with no updatedIntent property.
      var response = patientResponse.call(this);
      if(typeof response === 'object'){
          console.log('returning object back to delegate.');
          this.emit(":delegate");
      }
      console.log('emiting not completed');
      this.emit(":elicitSlot", response, patientPrompts[response]);
    } else {
      console.log("in completed");
      console.log("returning: "+ JSON.stringify(this.event.request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return this.event.request.intent;
    }
}

function patientResponse(){
    for(var j = 0; j < patientSlots.length; j++){
        var valid = isSlotValid(this.event.request, patientSlots[j]);
        if(!valid){
            console.log('emmiting ' + patientSlots[j]);
            return patientSlots[j];
        }
    }
    return this.event.request.intent;
}

function delegateSlotCollection(){
  console.log("in delegateSlotCollection");
  console.log("current dialogState: "+ this.event.request.dialogState);
  console.log('event: ', JSON.stringify(this.event));
    if (this.event.request.dialogState === "STARTED" || this.event.request.dialogState === undefined) {
      console.log("in Beginning");
      var updatedIntent=this.event.request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      var response = returnElicitPrompt.call(this);
      if(typeof response === 'object'){
          console.log('returning object back to delegate.');
          this.emit(":delegate");
      }
      console.log('emiting started', this.event.request.intent.slots);
      console.log('response: ', prompts[response].call(this,this.event.request.intent.slots['Name'].value, this.event.request.intent.slots['Medication'].value));
      this.emit(":elicitSlot", response, prompts[response].call(this,this.event.request.intent.slots['Name'].value, this.event.request.intent.slots['Medication'].value));
    } else if (this.event.request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      // return a Dialog.Delegate directive with no updatedIntent property.
      var response = returnElicitPrompt.call(this);
      if(typeof response === 'object'){
          console.log('returning object back to delegate.');
          this.emit(":delegate");
      }
      console.log('emiting not completed');
      this.emit(":elicitSlot", response, prompts[response].call(this,this.event.request.intent.slots['Name'].value, this.event.request.intent.slots['Medication'].value));
    } else {
      console.log("in completed");
      console.log("returning: "+ JSON.stringify(this.event.request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return this.event.request.intent;
    }
}

function returnElicitPrompt(){
    for(var i = 0; i < slotNames.length; i++){
        var valid = isSlotValid(this.event.request, slotNames[i]);
        console.log("" + slotNames[i] + " is valid: ", valid, "for prompt: ", prompts[slotNames[i]].call(this,this.event.request.intent.slots['Name'].value, this.event.request.intent.slots['Medication'].value));
        if(!valid){
            console.log('emmiting ' + slotNames[i]);
            //this.emit(":elicitSlot", prompts[slotNames[i]], this.event.request.intent);
            return slotNames[i];
        }
    }
    console.log('returning event intent meaning end of intent');
    return this.event.request.intent;
}

function randomPhrase(array) {
    // the argument is an array [] of words or phrases
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]);
}
function isSlotValid(request, slotName){
        var slot = request.intent.slots[slotName];
        //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
        var slotValue;

        //if we have a slot, get the text and store it into speechOutput
        if (slot && slot.value) {
            //we have a value in the slot
            slotValue = slot.value.toLowerCase();
            return slotValue;
        } else {
            //we didn't get a value in the slot.
            return false;
        }
}
