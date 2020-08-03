const {
    WaterfallDialog, ComponentDialog,
    ChoicePrompt,
    AttachmentPrompt
} = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'waterfallDialog';

const GET_JD_PROMPT = 'GET_JD_PROMPT';

const UPLOAD_PROMPT = 'UPLOAD_PROMPT';

const { HAS_JD_DIALOG, COMMON_JD_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

class HasJDDialog extends ComponentDialog {
    constructor(id, contactDialog, commonJDDialog) {
        super(id || HAS_JD_DIALOG);

        this.addDialog(new AttachmentPrompt(UPLOAD_PROMPT, this.uploadPromptValidator));
        this.addDialog(new ChoicePrompt(GET_JD_PROMPT));
        this.addDialog(contactDialog);
        this.addDialog(commonJDDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.uploadJDStep.bind(this),
            this.printThanksStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */

    async uploadJDStep(stepContext) {
        var promptOptions = {
            prompt: 'Great! You can either upload the document or you can type in the job description.',
            retryPrompt: 'The attachment must be a pdf/docx/doc file.'
        };

        return await stepContext.prompt(UPLOAD_PROMPT, promptOptions);
    }

    async printThanksStep(stepContext) {
        await stepContext.context.sendActivity('Thanks! We will look into the job description. ');
        await callDB.updateItem({ ...stepContext.options, uploadFileLink: JSON.stringify(stepContext.result.value) });
        return stepContext.beginDialog(COMMON_JD_DIALOG, stepContext.options);
    }

    async uploadPromptValidator(promptContext) {
        if (promptContext.recognized.succeeded) {
            var attachments = promptContext.recognized.value;
            var validDocument = [];

            console.log(attachments);

            attachments.forEach(attachment => {
                if (attachment.contentType === 'application/pdf' ||
                attachment.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                attachment.contentType === 'application/msword') {
                    validDocument.push(attachment);
                }
            });

            promptContext.recognized.value = validDocument;

            // If none of the attachments are valid images, the retry prompt should be sent.
            return !!validDocument.length;
        }
    }
}

module.exports.HasJDDialog = HasJDDialog;
