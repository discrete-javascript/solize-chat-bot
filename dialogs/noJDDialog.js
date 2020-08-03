const {
    WaterfallDialog, ComponentDialog,
    ChoicePrompt,
    ChoiceFactory,
    TextPrompt
} = require('botbuilder-dialogs');
const { InputHints, MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';

const TYPE_OF_ENGINEER = 'TYPE_OF_ENGINEER';
const OTHER_TYPE_OF_ENGINEER = 'OTHER_TYPE_OF_ENGINEER';
const TYPE_OF_INDUSTRY = 'TYPE_OF_INDUSTRY';
const OTHER_TYPE_OF_INDUSTRY = 'OTHER_TYPE_OF_INDUSTRY';
const YEARS_OF_EXPERIENCE = 'YEARS_OF_EXPERIENCE';
const REQUIRED_SKILLSET = 'REQUIRED_SKILLSET';
const OTHER_REQUIRED_SKILLSET = 'OTHER_REQUIRED_SKILLSET';
const TYPING_OTHER_SKILLSET = 'TYPING_OTHER_SKILLSET';

const { NO_JD_DIALOG, COMMON_JD_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

class NoJDDialog extends ComponentDialog {
    constructor(id, commonJDDialog) {
        super(id || NO_JD_DIALOG);

        this.addDialog(new ChoicePrompt(TYPE_OF_ENGINEER));
        this.addDialog(new TextPrompt(OTHER_TYPE_OF_ENGINEER));
        this.addDialog(new ChoicePrompt(TYPE_OF_INDUSTRY));
        this.addDialog(new TextPrompt(OTHER_TYPE_OF_INDUSTRY));
        this.addDialog(new ChoicePrompt(YEARS_OF_EXPERIENCE));
        this.addDialog(new ChoicePrompt(REQUIRED_SKILLSET));
        this.addDialog(new TextPrompt(OTHER_REQUIRED_SKILLSET));
        this.addDialog(new TextPrompt(TYPING_OTHER_SKILLSET));
        this.addDialog(new TextPrompt(OTHER_TYPE_OF_INDUSTRY));
        this.addDialog(commonJDDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.typeofEngineerStep.bind(this),
            this.otherTypeofEngineerStep.bind(this),
            this.typeofIndustryStep.bind(this),
            this.otherTypeofIndustryStep.bind(this),
            this.yearsOfexperienceStep.bind(this),
            this.requiredSkillsetStep.bind(this),
            this.otherRequiredSkillSetStep.bind(this),
            this.startCommonDialog.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
        this.payload = {};
    }

    async typeofEngineerStep(stepContext) {
        return await stepContext.prompt(TYPE_OF_ENGINEER, {
            prompt: 'What type of engineer are you looking for?',
            choices: ChoiceFactory.toChoices(['Mechanical engineer', 'IT engineer', 'Other'])
        });
    }

    async otherTypeofEngineerStep(stepContext) {
        if (stepContext.result.value === 'Other') {
            const messageText =
               'Please type what type what type of engineer are you looking for?';
            const msg = MessageFactory.text(
                messageText,
                messageText,
                InputHints.ExpectingInput
            );
            return await stepContext.prompt(OTHER_TYPE_OF_ENGINEER, { prompt: msg });
        } else {
            stepContext.values.typeOfEngineer = stepContext.result.value;

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
            return await stepContext.next();
        }
    }

    async typeofIndustryStep(stepContext) {
        if (!Object.prototype.hasOwnProperty.call(stepContext.values, 'typeOfEngineer')) {
            stepContext.values.typeOfEngineer = stepContext.result;

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
        }

        return await stepContext.prompt(TYPE_OF_INDUSTRY, {
            prompt: 'Which type of industry?',
            choices: ChoiceFactory.toChoices(['Automotive', 'Heavyindustry', 'Offroad vehicles', 'Robotics', 'Other'])
        });
    }

    async otherTypeofIndustryStep(stepContext) {
        if (stepContext.result.value === 'Other') {
            const messageText =
               'Please type what type of industry you\'re looking for?';
            const msg = MessageFactory.text(
                messageText,
                messageText,
                InputHints.ExpectingInput
            );
            return await stepContext.prompt(OTHER_TYPE_OF_INDUSTRY, { prompt: msg });
        } else {
            stepContext.values.typeOfIndustry = stepContext.result.value;

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });

            return stepContext.next();
        }
    }

    async yearsOfexperienceStep(stepContext) {
        if (!Object.prototype.hasOwnProperty.call(stepContext.values, 'typeOfIndustry')) {
            stepContext.values.typeOfIndustry = stepContext.result;

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
        }
        return await stepContext.prompt(YEARS_OF_EXPERIENCE, {
            prompt: 'How many years of experience is required?',
            choices: ChoiceFactory.toChoices(['0 -3 years', '3- 5 years', '5 - 7 years', '>7 years'])
        });
    }

    async requiredSkillsetStep(stepContext) {
        stepContext.values.yearsExp = stepContext.result.value;
        console.log(stepContext.result);

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        const messageText = `What kind of Skillset/Tool Knowledge is required?
        Please select multiple skillsets if needed.
        You can also select "Other" and tell us if you have specific skillsets.`;

        if (stepContext.values.typeOfEngineer === 'Mechanical engineer') {
            return await stepContext.prompt(REQUIRED_SKILLSET, {
                prompt: messageText,
                choices: ChoiceFactory.toChoices(['CAE', 'CATIA', 'Other'])
            });
        } else if (stepContext.values.typeOfEngineer === 'IT engineer') {
            return await stepContext.prompt(REQUIRED_SKILLSET, {
                prompt: messageText,
                choices: ChoiceFactory.toChoices(['Java', 'Python', 'Other'])
            });
        } else {
            const otherMessageText = 'What kind of Skillset/Tool Knowledge is required?';
            const msg = MessageFactory.text(otherMessageText, otherMessageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TYPING_OTHER_SKILLSET, { prompt: msg });
        }
    }

    async otherRequiredSkillSetStep(stepContext) {
        console.log(typeof stepContext.result, stepContext.result);
        if (stepContext.result.value === 'Other') {
            const messageText =
               'Please type in your skillset?';
            const msg = MessageFactory.text(
                messageText,
                messageText,
                InputHints.ExpectingInput
            );
            return await stepContext.prompt(OTHER_REQUIRED_SKILLSET, { prompt: msg });
        } else if (stepContext.result.value !== 'Other' && (typeof stepContext.result === 'object')) {
            stepContext.values.extraSkillset = stepContext.result.value;

            this.payload = {
                ...stepContext.options,
                ...stepContext.values
            };

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
            return await stepContext.beginDialog(COMMON_JD_DIALOG, { ...this.payload });
        } else {
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

    async startCommonDialog(stepContext) {
        if (!Object.prototype.hasOwnProperty.call(stepContext.options, 'extraSkillset')) {
            stepContext.values.extraSkillset = stepContext.result;

            this.payload = {
                ...stepContext.options,
                ...stepContext.values
            };

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
        }
        return await stepContext.beginDialog(COMMON_JD_DIALOG, { ...this.payload });
    }
}

module.exports.NoJDDialog = NoJDDialog;
