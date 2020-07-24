const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'waterfallDialog';

const { CONTACT_DIALOG } = require('./dialogConstants');

class ContactDialog extends ComponentDialog {
    constructor(id) {
        super(id || CONTACT_DIALOG);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.jobDescriptionStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async jobDescriptionStep(stepContext) {
        return await stepContext.context.sendActivity('Thank you for contacting for Solize - This is our number');
    }
}

module.exports.ContactDialog = ContactDialog;
