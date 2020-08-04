const {
    WaterfallDialog, ComponentDialog,
    ChoicePrompt,
    ChoiceFactory,
    TextPrompt
} = require('botbuilder-dialogs');
const { InputHints, MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';

const WORKPLACE_LOCATION = 'WORKPLACE_LOCATION';
const START_DATE = 'START_DATE';
const OTHER_REQUIREMENTS = 'OTHER_REQUIREMENTS';
const PREFERRED_CONTACT_TIME = 'PREFERRED_CONTACT_TIME';
const EXTRA_DIALOG_PROMPT = 'EXTRA_DIALOG_PROMPT';

const { COMMON_JD_DIALOG, CONTACT_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');
const { dateValidator } = require('./validators');

class CommonJDDialog extends ComponentDialog {
    constructor(id, contactDialog, selectedOtherDialog) {
        super(id || COMMON_JD_DIALOG);
        this.addDialog(new TextPrompt(WORKPLACE_LOCATION));
        this.addDialog(new ChoicePrompt(START_DATE));
        this.addDialog(new TextPrompt(OTHER_REQUIREMENTS));
        this.addDialog(new TextPrompt(PREFERRED_CONTACT_TIME, dateValidator));
        this.addDialog(new TextPrompt(EXTRA_DIALOG_PROMPT));
        this.addDialog(selectedOtherDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.workLocationStep.bind(this),
            this.startDateStep.bind(this),
            this.otherRequirementStep.bind(this),
            this.replyOtherRequirementStep.bind(this),
            this.preferredContactStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async workLocationStep(stepContext) {
        const messageText = 'Can you tell us the location of the workplace? (Ex. City/State/Zipcode)';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(WORKPLACE_LOCATION, { prompt: msg });
    }

    async startDateStep(stepContext) {
        console.log(stepContext.result, stepContext.options);
        stepContext.values.workplaceLocation = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        return await stepContext.prompt(START_DATE, {
            prompt: 'Do you already have a Start Date? When do you need the engineer to start working?',
            choices: ChoiceFactory.toChoices(['ASAP', 'within 2 weeks', 'within 1 month', 'undecided'])
        });
    }

    async otherRequirementStep(stepContext) {
        stepContext.values.startDate = stepContext.result.value;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });

        const messageText = `Can you tell us if you have any other requirements for the position?
        If not, please type "NA"`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(OTHER_REQUIREMENTS, { prompt: msg });
    }

    async replyOtherRequirementStep(stepContext) {
        stepContext.values.otherRequirement = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        await stepContext.context.sendActivity(`OK! That's all the questions. 
        We'll look into the information you have provided, and our SOLIZE agent will contact you shortly.`);
        return stepContext.next();
    }

    async preferredContactStep(stepContext) {
        const messageText = `Do you have any preference on Date and Time for our agent to contact you, if you have provided us your phone number?
        If you have only provided us your email address, please type "NA". Format should like dd/mm/YYYY hh:mm AM/PM`;
        const retryPrompt = 'Please type in a valid date and time and it should be like dd/mm/YYYY hh:mm AM/PM and should not be older time';

        const promptOptions = { prompt: messageText, retryPrompt: retryPrompt };
        return await stepContext.prompt(PREFERRED_CONTACT_TIME, promptOptions);
    }

    async replyPreferredContactStep(stepContext) {
        stepContext.values.preferredContact = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });

        this.payload = {
            ...stepContext.options,
            ...stepContext.values
        };
        await stepContext.context.sendActivity('Great!');
        return stepContext.beginDialog(CONTACT_DIALOG, { ...this.payload });
    }
}

module.exports.CommonJDDialog = CommonJDDialog;
