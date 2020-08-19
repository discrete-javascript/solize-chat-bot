const {
    WaterfallDialog, ComponentDialog,
    TextPrompt
} = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'waterfallDialog';

const TEXT_PROMPT = 'TEXT_PROMPT';

const { WRITE_JD_DIALOG, COMMON_JD_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

class WriteJDDialog extends ComponentDialog {
    constructor(id, commonJDDialog) {
        super(id || WRITE_JD_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(commonJDDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.writeOrPasteJD.bind(this),
            this.printThanksStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async writeOrPasteJD(step) {
        console.log(step.values, step.result);
        const promptOptions = { prompt: 'Please write/paste in your description', retryPrompt: 'Please write a valid description.' };
        return await step.prompt(TEXT_PROMPT, promptOptions);
    }

    async printThanksStep(stepContext) {
        await stepContext.context.sendActivity('Thanks! We will look into the job description. ');
        await callDB.updateItem({ ...stepContext.options, jobDescription: stepContext.result });
        return stepContext.beginDialog(COMMON_JD_DIALOG, stepContext.options);
    }
}

module.exports.WriteJDDialog = WriteJDDialog;
