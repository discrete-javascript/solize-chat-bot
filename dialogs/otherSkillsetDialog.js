const { WaterfallDialog, ComponentDialog, TextPrompt } = require('botbuilder-dialogs');
const { InputHints, MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';

const { OTHER_SKILLSET_DIALOG, COMMON_JD_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

const OTHER_REQUIRED_SKILLSET = 'OTHER_REQUIRED_SKILLSET';

class OtherSkillset extends ComponentDialog {
    constructor(id, commonJDDialog) {
        super(id || OTHER_SKILLSET_DIALOG);

        this.addDialog(new TextPrompt(OTHER_REQUIRED_SKILLSET));
        this.addDialog(commonJDDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.extraDialogStep.bind(this),
            this.replyExtraDialogStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async extraDialogStep(stepContext) {
        const messageText =
               'Please type in your skillset?';
        const msg = MessageFactory.text(
            messageText,
            messageText,
            InputHints.ExpectingInput
        );
        return await stepContext.prompt(OTHER_REQUIRED_SKILLSET, { prompt: msg });
    }

    async replyExtraDialogStep(stepContext) {
        stepContext.values.extraSkillset = stepContext.result;

        this.payload = {
            ...stepContext.options,
            ...stepContext.values
        };

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        return await stepContext.beginDialog(COMMON_JD_DIALOG, { ...this.payload });
    }
}

module.exports.OtherSkillset = OtherSkillset;
