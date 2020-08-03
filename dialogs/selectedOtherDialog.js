const {
    WaterfallDialog, ComponentDialog, ChoicePrompt,
    ChoiceFactory,
    TextPrompt
} = require('botbuilder-dialogs');
const { InputHints, MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';

const { SELECTED_OTHER_DIALOG, CONTACT_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

const CONTACT_LIVE_AGENT = 'CONTACT_LIVE_AGENT';
const PREFERRED_CONTACT_TIME = 'PREFERRED_CONTACT_TIME';

class SelectedOtherDialog extends ComponentDialog {
    constructor(id, contactDialog) {
        super(id || SELECTED_OTHER_DIALOG);

        this.addDialog(new ChoicePrompt(CONTACT_LIVE_AGENT));
        this.addDialog(new TextPrompt(PREFERRED_CONTACT_TIME));
        this.addDialog(contactDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.extraDialogStep.bind(this),
            this.toggleDialogStep.bind(this),
            this.replyPreferredContactStep.bind(this),
            this.replyExtraDialogStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async extraDialogStep(stepContext) {
        const messageText = 'Would you like to talk to our SOLIZE agent directly?';
        return await stepContext.prompt(CONTACT_LIVE_AGENT, {
            prompt: messageText,
            choices: ChoiceFactory.toChoices(['Yes', 'No'])
        });
    }

    async toggleDialogStep(stepContext) {
        stepContext.values.contact = stepContext.result.value;

        switch (stepContext.values.contact) {
        case 'Yes':
            return await this.preferredContactStep(stepContext);

        case 'No':
            this.payload = {
                ...stepContext.options,
                ...stepContext.values
            };

            return await stepContext.beginDialog(CONTACT_DIALOG, { ...this.payload });
        }
    }

    async preferredContactStep(stepContext) {
        stepContext.values.experience = stepContext.result;
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

module.exports.SelectedOtherDialog = SelectedOtherDialog;
