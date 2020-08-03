const {
    ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog,
    ChoiceFactory,
    ChoicePrompt,
    ConfirmPrompt
} = require('botbuilder-dialogs');
const { callDB } = require('../db/db');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

const EMAIL_PROMPT = 'EMAIL_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const PHONENUMBER_PROMPT = 'PHONENUMBER_PROMPT';

const { emailValidator, nameValidator, phoneNumberValidator } = require('./validators');
const { FEEDBACK_DIALOG, STAFFING_DIALOG, SELECTED_OTHER_DIALOG } = require('./dialogConstants');
const { SchemaDB } = require('../db/dbschema');

class MainDialog extends ComponentDialog {
    constructor(luisRecognizer, feedbackDialog, staffingDialog, contactDialog, selectedOtherDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!feedbackDialog) throw new Error('[MainDialog]: Missing parameter \'feedbackDialog\' is required');

        if (!staffingDialog) throw new Error('[MainDialog]: Missing parameter \'staffingDialog\' is required');

        this.addDialog(new TextPrompt(NAME_PROMPT, nameValidator));
        this.addDialog(new TextPrompt(EMAIL_PROMPT, emailValidator));
        this.addDialog(new TextPrompt(PHONENUMBER_PROMPT, phoneNumberValidator));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new TextPrompt('TextPrompt'));
        this.addDialog(feedbackDialog);
        this.addDialog(staffingDialog);
        this.addDialog(contactDialog);
        this.addDialog(selectedOtherDialog);

        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.startStep.bind(this),
            this.nameStep.bind(this),
            this.emailStep.bind(this),
            this.phoneNumberStep.bind(this),
            this.nameAndEmailConfirmStep.bind(this),
            this.selectSolizeServices.bind(this)
        ])
        );

        this.payload = new SchemaDB();

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async startStep(step) {
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'You can start chatting by pressing \'Start\' button below',
            choices: ChoiceFactory.toChoices(['Start'])
        });
    }

    async nameStep(step) {
        console.log(step.values, step.result);
        // step.values.transport = step.result.value;
        const promptOptions = { prompt: 'Please enter your name.', retryPrompt: 'Please enter a valid name.' };
        return await step.prompt(NAME_PROMPT, promptOptions);
    }

    async emailStep(step) {
        step.values.name = step.result;
        console.log(step.values);
        const promptOptions = { prompt: 'Please enter your email id.', retryPrompt: 'Please enter a valid email.' };
        return await step.prompt(EMAIL_PROMPT, promptOptions);
    }

    async phoneNumberStep(step) {
        step.values.email = step.result;
        console.log(step.values);
        const promptOptions = { prompt: 'Please enter your phone number.', retryPrompt: 'Please enter a valid phone number.' };
        return await step.prompt(PHONENUMBER_PROMPT, promptOptions);
    }

    async nameAndEmailConfirmStep(step) {
        // step.values.name = step.result;
        step.values.phoneNumber = step.result;

        // We can send messages to the user at any point in the WaterfallStep.
        await step.context.sendActivity(`Thanks ${ step.values.name } and your email id is ${ step.values.email }.`);
        this.payload = {
            ...this.payload,
            ...step.values
        };

        this.payload.id = '';

        // await callDB.createItem(this.payload);
        const getDBId = await callDB.createItem({
            ...this.payload
        });
        this.payload = {
            ...this.payload,
            id: getDBId.id
        };

        await step.context.sendActivity(`OK! Before we get you started, here are few rules.
        If you wish to start from the beginning, type "Start".
        If you wish to end session, type "End".
        Don't forget, there's always an option to call our SOLIZE agent if you would like to talk directly.`);

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please choose which SOLIZE service you are interested in.',
            choices: ChoiceFactory.toChoices(['Staffing', 'Feedback', 'Other'])
        });
    }

    async selectSolizeServices(step) {
        step.values.serviceDetails = step.result.value;

        this.payload = {
            ...this.payload,
            ...step.values
        };

        await callDB.updateItem({
            ...this.payload
        });

        switch (step.result.value) {
        case 'Staffing':
            return await step.beginDialog(STAFFING_DIALOG, { ...this.payload });

        case 'Feedback':
            return await step.beginDialog(FEEDBACK_DIALOG, { ...this.payload });

        case 'Other':
            return await step.beginDialog(SELECTED_OTHER_DIALOG, { ...this.payload });
        }
    }
}

module.exports.MainDialog = MainDialog;
