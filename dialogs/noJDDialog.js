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
const WORKPLACE_LOCATION = 'WORKPLACE_LOCATION';
const START_DATE = 'START_DATE';
const OTHER_REQUIREMENTS = 'OTHER_REQUIREMENTS';
const PREFERRED_CONTACT_TIME = 'PREFERRED_CONTACT_TIME';
const EXTRA_DIALOG_PROMPT = 'EXTRA_DIALOG_PROMPT';

const { NO_JD_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

class NoJDDialog extends ComponentDialog {
    constructor(id) {
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
        this.addDialog(new TextPrompt(WORKPLACE_LOCATION));
        this.addDialog(new ChoicePrompt(START_DATE));
        this.addDialog(new TextPrompt(OTHER_REQUIREMENTS));
        this.addDialog(new TextPrompt(PREFERRED_CONTACT_TIME));
        this.addDialog(new TextPrompt(EXTRA_DIALOG_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.typeofEngineerStep.bind(this),
            this.otherTypeofEngineerStep.bind(this),
            this.typeofIndustryStep.bind(this),
            this.otherTypeofIndustryStep.bind(this),
            this.yearsOfexperienceStep.bind(this),
            this.requiredSkillsetStep.bind(this),
            this.otherRequiredSkillSetStep.bind(this),
            this.workLocationStep.bind(this),
            this.startDateStep.bind(this),
            this.otherRequirementStep.bind(this),
            this.replyOtherRequirementStep.bind(this),
            this.preferredContactStep.bind(this),
            this.replyPreferredContactStep.bind(this),
            this.extraDialogStep.bind(this),
            this.replyExtraDialogStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
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

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
            return await stepContext.next();
        } else {
            stepContext.values.extraSkillset = stepContext.result;

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
            return await stepContext.next();
        }
    }

    async workLocationStep(stepContext) {
        if (!Object.prototype.hasOwnProperty.call(stepContext.values, 'extraSkillset')) {
            stepContext.values.extraSkillset = stepContext.result;

            await callDB.updateItem({
                ...stepContext.options,
                ...stepContext.values
            });
        }
        const messageText = 'Can you tell us the location of the workplace? (Ex. City/State/Zipcode)';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(WORKPLACE_LOCATION, { prompt: msg });
    }

    async startDateStep(stepContext) {
        stepContext.values.workplaceLocation = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        return await stepContext.prompt(START_DATE, {
            prompt: 'Do you already have a Start Date? When do you need the engineer to start working?',
            choices: ChoiceFactory.toChoices(['ASAP', 'within 2 weeks', 'within 1 month', 'undecided'])
        });
    }

    async otherRequirementStep(stepContext) {
        stepContext.values.otherRequirement = stepContext.result.value;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });

        const messageText = `Can you tell us if you have any other requirements for the position?
        If not, please type "NA"`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(OTHER_REQUIREMENTS, { prompt: msg });
    }

    async replyOtherRequirementStep(stepContext) {
        stepContext.values.otherRequirement = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        await stepContext.context.sendActivity(`OK! That's all the questions. 
        We'll look into the information you have provided, and our SOLIZE agent will contact you shortly.`);
        return stepContext.next();
    }

    async preferredContactStep(stepContext) {
        stepContext.values.experience = stepContext.result;
        const messageText = `Do you have any preference on Date and Time for our agent to contact you, if you have provided us your phone number?
        If you have only provided us your email address, please type "NA".`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(PREFERRED_CONTACT_TIME, { prompt: msg });
    }

    async replyPreferredContactStep(stepContext) {
        stepContext.values.preferredContact = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        await stepContext.context.sendActivity('Great!');
        return stepContext.next();
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
        return await stepContext.context.sendActivity(`OK! Thank you ${ stepContext.options.name }. Have a great day!`);
    }
}

module.exports.NoJDDialog = NoJDDialog;
