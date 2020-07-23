// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const {
    ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog, AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ConfirmPrompt,
    NumberPrompt,
    ThisMemoryScope
} = require('botbuilder-dialogs'); ;

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

const EMAIL_PROMPT = 'EMAIL_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';

const { emailValidator, nameValidator } = require('./validators');

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, bookingDialog, feedbackDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!bookingDialog) throw new Error('[MainDialog]: Missing parameter \'bookingDialog\' is required');

        if (!feedbackDialog) throw new Error('[MainDialog]: Missing parameter \'feedbackDialog\' is required');

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt(NAME_PROMPT, nameValidator));
        this.addDialog(new TextPrompt(EMAIL_PROMPT, emailValidator));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt('TextPrompt'));
        this.addDialog(bookingDialog);
        this.addDialog(feedbackDialog);

        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            // this.nameStep.bind(this),
            // this.emailStep.bind(this),
            this.nameAndEmailConfirmStep.bind(this),
            this.selectSolizeServices.bind(this)
            // this.introStep.bind(this),
            // this.actStep.bind(this),
            // this.finalStep.bind(this)
        ])
        );

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    async nameStep(step) {
        console.log(step.values, step.result);
        // step.values.transport = step.result.value;
        const promptOptions = { prompt: 'Please enter your name.', retryPrompt: 'Please enter a valid name' };
        return await step.prompt(NAME_PROMPT, promptOptions);
    }

    async nameValidator(promptContext) {
        var regex = /^[a-zA-Z ]{2,30}$/;
        return promptContext.recognized.succeeded && regex.test(promptContext.recognized.value);
    }

    async emailStep(step) {
        step.values.name = step.result;
        console.log(step.values);
        const promptOptions = { prompt: 'Please enter your email id.', retryPrompt: 'Please enter a valid email' };
        return await step.prompt(EMAIL_PROMPT, promptOptions);
    }

    // async emailValidator(promptContext) {
    //     var regex = /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    //     return promptContext.recognized.succeeded && regex.test(promptContext.recognized.value);
    // }

    async nameAndEmailConfirmStep(step) {
        // step.values.name = step.result;
        step.values.email = step.result;

        // We can send messages to the user at any point in the WaterfallStep.
        await step.context.sendActivity(`Thanks ${ step.values.name } and your email id is ${ step.values.email }.`);

        await step.context.sendActivity(`OK! Before we get you started, here are few rules.
        If you wish to start from the beginning, type "Start".
        If you wish to end session, type "End".
        Don't forget, there's always an option to call our SOLIZE agent if you would like to talk directly.`);

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please choose which SOLIZE service you are interested in.',
            choices: ChoiceFactory.toChoices(['Staffing', 'Feedback', 'Other'])
        });
    }

    async selectSolizeServices(step) {
        step.values.service = step.result.value;

        switch (step.result.value) {
        case 'Staffing':
            await step.beginDialog('bookingDialog', {});
            break;
        case 'Feedback':
            await step.context.sendActivity('Do you already have a Feedbckd?');
            return await step.beginDialog('feedbackDialog', {});
            // break;

        default:
            break;
        }

        return await step.next();
    }

    async nameConfirmStep(step) {
        // step.values.name = step.result;

        // We can send messages to the user at any point in the WaterfallStep.
        await step.context.sendActivity(`Thanks ${ step.result }.`);

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(CONFIRM_PROMPT, 'Do you want to give your age?', ['yes', 'no']);
    }

    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'What can I help you with today?\nSay something like "Book a flight from Paris to Berlin on March 22, 2020"';
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(NAME_PROMPT, { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const bookingDetails = {};

        if (!this.luisRecognizer.isConfigured) {
            // LUIS is not configured, we just run the BookingDialog path.
            return await stepContext.beginDialog('bookingDialog', bookingDetails);
        }

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'BookFlight': {
            // Extract the values for the composite entities from the LUIS result.
            const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
            const toEntities = this.luisRecognizer.getToEntities(luisResult);

            // Show a warning for Origin and Destination if we can't resolve them.
            await this.showWarningForUnsupportedCities(stepContext.context, fromEntities, toEntities);

            // Initialize BookingDetails with any entities we may have found in the response.
            bookingDetails.destination = toEntities.airport;
            bookingDetails.origin = fromEntities.airport;
            bookingDetails.travelDate = this.luisRecognizer.getTravelDate(luisResult);
            console.log('LUIS extracted these booking details:', JSON.stringify(bookingDetails));

            // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
            return await stepContext.beginDialog('bookingDialog', bookingDetails);
        }

        case 'GetWeather': {
            // We haven't implemented the GetWeatherDialog so we just display a TODO message.
            const getWeatherMessageText = 'TODO: get weather flow here';
            await stepContext.context.sendActivity(getWeatherMessageText, getWeatherMessageText, InputHints.IgnoringInput);
            break;
        }

        default: {
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
        }
        }

        return await stepContext.next();
    }

    /**
     * Shows a warning if the requested From or To cities are recognized as entities but they are not in the Airport entity list.
     * In some cases LUIS will recognize the From and To composite entities as a valid cities but the From and To Airport values
     * will be empty if those entity values can't be mapped to a canonical item in the Airport.
     */
    async showWarningForUnsupportedCities(context, fromEntities, toEntities) {
        const unsupportedCities = [];
        if (fromEntities.from && !fromEntities.airport) {
            unsupportedCities.push(fromEntities.from);
        }

        if (toEntities.to && !toEntities.airport) {
            unsupportedCities.push(toEntities.to);
        }

        if (unsupportedCities.length) {
            const messageText = `Sorry but the following airports are not supported: ${ unsupportedCities.join(', ') }`;
            await context.sendActivity(messageText, messageText, InputHints.IgnoringInput);
        }
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "book a flight" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        // If the child dialog ("bookingDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;
            // Now we have all the booking details.

            // This is where calls to the booking AOU service or database would go.

            // If the call to the booking service was successful tell the user.
            const timeProperty = new TimexProperty(result.travelDate);
            const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
            const msg = `I have you booked to ${ result.destination } from ${ result.origin } on ${ travelDateMsg }.`;
            await stepContext.context.sendActivity(msg, msg, InputHints.IgnoringInput);
        }

        // Restart the main dialog with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
}

module.exports.MainDialog = MainDialog;
