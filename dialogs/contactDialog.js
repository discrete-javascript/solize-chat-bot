const { WaterfallDialog, ComponentDialog, TextPrompt } = require('botbuilder-dialogs');
const { InputHints, MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';

const { CONTACT_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

const EXTRA_DIALOG_PROMPT = 'EXTRA_DIALOG_PROMPT';

class ContactDialog extends ComponentDialog {
    constructor(id, timer) {
        super(id || CONTACT_DIALOG);

        this.addDialog(new TextPrompt(EXTRA_DIALOG_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.extraDialogStep.bind(this),
            this.replyExtraDialogStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;

        this.timer = timer;
    }

    async extraDialogStep(stepContext) {
        const messageText = `Are there anything else we can assist you today?
        If you wish to start from the beginning, type "Start".
        If you wish to end session, type "End".
        Don't forget, there's always an option to call our SOLIZE agent if you would like to talk directly.`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(EXTRA_DIALOG_PROMPT, { prompt: msg });
    }

    async replyExtraDialogStep(stepContext) {
        stepContext.values.extraDialogStep = stepContext.result;
        this.timer.stop();
        console.log('this.timer.seconds()', this.timer.seconds());
        const timeSpent = `${ this.timer.seconds() } seconds`;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values,
            timeSpent
        });
        return await stepContext.context.sendActivity(`OK! Thank you ${ stepContext.options.name }. Have a great day!`);
    }
}

module.exports.ContactDialog = ContactDialog;
