const {
    WaterfallDialog, ComponentDialog,
    ChoiceFactory,
    ChoicePrompt,
    AttachmentPrompt
} = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'waterfallDialog';

const GET_JD_PROMPT = 'GET_JD_PROMPT';

const UPLOAD_PROMPT = 'UPLOAD_PROMPT';

const { STAFFING_DIALOG, HAS_JD_DIALOG, NO_JD_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

class StaffingDialog extends ComponentDialog {
    constructor(id, hasJDDialog, contactDialog, noJDDialog) {
        super(id || STAFFING_DIALOG);

        this.addDialog(new AttachmentPrompt(UPLOAD_PROMPT, this.picturePromptValidator));
        this.addDialog(new ChoicePrompt(GET_JD_PROMPT));
        this.addDialog(hasJDDialog);
        this.addDialog(noJDDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.jobDescriptionStep.bind(this),
            this.toggleJDSteps.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;

        this.payload = {};
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */

    async jobDescriptionStep(stepContext) {
        return await stepContext.prompt(GET_JD_PROMPT, {
            prompt: 'Do you already have a job description?',
            choices: ChoiceFactory.toChoices(['Yes', 'No'])
        });
    }

    async toggleJDSteps(stepContext) {
        stepContext.values.hasJd = stepContext.result.value;

        this.payload = {
            ...stepContext.options,
            ...stepContext.values
        };

        await callDB.updateItem({ ...this.payload });

        switch (stepContext.values.hasJd) {
        case 'Yes':
            return stepContext.beginDialog(HAS_JD_DIALOG, { ...this.payload });
            // return stepContext.context.sendActivity('Thanks! We will look into the job description.');

        case 'No':
            return stepContext.beginDialog(NO_JD_DIALOG, { ...this.payload });
        }
    }
}

module.exports.StaffingDialog = StaffingDialog;
