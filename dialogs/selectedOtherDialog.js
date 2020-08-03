const {
    WaterfallDialog, ComponentDialog, ChoicePrompt,
    ChoiceFactory,
    TextPrompt
} = require('botbuilder-dialogs');

const WATERFALL_DIALOG = 'waterfallDialog';

const { SELECTED_OTHER_DIALOG, CONTACT_DIALOG, YES_TOGGLE_LIVE } = require('./dialogConstants');

const CONTACT_LIVE_AGENT = 'CONTACT_LIVE_AGENT';
const PREFERRED_CONTACT_TIME = 'PREFERRED_CONTACT_TIME';

class SelectedOtherDialog extends ComponentDialog {
    constructor(id, contactDialog, yesToggleSpeakLive) {
        super(id || SELECTED_OTHER_DIALOG);

        this.addDialog(new ChoicePrompt(CONTACT_LIVE_AGENT));
        this.addDialog(new TextPrompt(PREFERRED_CONTACT_TIME));
        this.addDialog(contactDialog);
        this.addDialog(yesToggleSpeakLive);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.extraDialogStep.bind(this),
            this.toggleDialogStep.bind(this)
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
            this.payload = {
                ...stepContext.options,
                ...stepContext.values
            };

            return await stepContext.beginDialog(YES_TOGGLE_LIVE, { ...this.payload });

        case 'No':
            this.payload = {
                ...stepContext.options,
                ...stepContext.values
            };

            return await stepContext.beginDialog(CONTACT_DIALOG, { ...this.payload });
        }
    }
}

module.exports.SelectedOtherDialog = SelectedOtherDialog;
