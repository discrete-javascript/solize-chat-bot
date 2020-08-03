const {
    WaterfallDialog, ComponentDialog, ChoicePrompt,
    TextPrompt
} = require('botbuilder-dialogs');
const { InputHints, MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';

const { YES_TOGGLE_LIVE, CONTACT_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

const CONTACT_LIVE_AGENT = 'CONTACT_LIVE_AGENT';
const PREFERRED_CONTACT_TIME = 'PREFERRED_CONTACT_TIME';

class YesToggleSpeakLive extends ComponentDialog {
    constructor(id, contactDialog) {
        super(id || YES_TOGGLE_LIVE);

        this.addDialog(new ChoicePrompt(CONTACT_LIVE_AGENT));
        this.addDialog(new TextPrompt(PREFERRED_CONTACT_TIME));
        this.addDialog(contactDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.preferredContactStep.bind(this),
            this.replyPreferredContactStep.bind(this),
            this.replyExtraDialogStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async preferredContactStep(stepContext) {
        const messageText = `Do you have any preference on Date and Time for our agent to contact you, if you have provided us your phone number?
        If you have only provided us your email address, please type "NA".`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(PREFERRED_CONTACT_TIME, { prompt: msg });
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
        return await stepContext.next();
    }

    async replyExtraDialogStep(stepContext) {
        this.payload = {
            ...stepContext.options,
            ...stepContext.values
        };
        return await stepContext.beginDialog(CONTACT_DIALOG, { ...this.payload });
    }
}

module.exports.YesToggleSpeakLive = YesToggleSpeakLive;
