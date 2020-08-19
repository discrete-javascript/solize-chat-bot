const {
    WaterfallDialog, ComponentDialog,
    ChoicePrompt,
    AttachmentPrompt,
    ChoiceFactory,
    ListStyle
} = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'waterfallDialog';

const GET_JD_PROMPT = 'GET_JD_PROMPT';

const UPLOAD_PROMPT = 'UPLOAD_PROMPT';

const { HAS_JD_DIALOG, UPLOAD_JD_DIALOG, WRITE_JD_DIALOG } = require('./dialogConstants');

class HasJDDialog extends ComponentDialog {
    constructor(id, contactDialog, commonJDDialog, uploadJDDialog, writeJDDialog) {
        super(id || HAS_JD_DIALOG);

        this.addDialog(new AttachmentPrompt(UPLOAD_PROMPT, this.uploadPromptValidator));
        this.addDialog(new ChoicePrompt(GET_JD_PROMPT));
        this.addDialog(uploadJDDialog);
        this.addDialog(writeJDDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.toggleUploadAndWrite.bind(this),
            this.switchUploadAndWriteJD.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async toggleUploadAndWrite(stepContext) {
        return await stepContext.prompt(GET_JD_PROMPT, {
            prompt: 'Do you want to upload or write/paste the description.',
            retryPrompt: 'Please select from the below',
            choices: ChoiceFactory.toChoices(['Upload', 'Write/Paste']),
            style: ListStyle.suggestedAction
        });
    }

    async switchUploadAndWriteJD(stepContext) {
        console.log(stepContext.result.value);
        switch (stepContext.result.value) {
        case 'Upload':
            return stepContext.beginDialog(UPLOAD_JD_DIALOG, stepContext.options);
        case 'Write/Paste':
            return stepContext.beginDialog(WRITE_JD_DIALOG, stepContext.options);
        }
    }
}

module.exports.HasJDDialog = HasJDDialog;
