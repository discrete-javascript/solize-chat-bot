const {
    WaterfallDialog, ComponentDialog,
    ChoicePrompt,
    ChoiceFactory,
    TextPrompt
} = require('botbuilder-dialogs');
const { InputHints, MessageFactory } = require('botbuilder');

const WATERFALL_DIALOG = 'waterfallDialog';

const TYPE_OF_ENGINEER = 'TYPE_OF_ENGINEER';
const TYPE_OF_INDUSTRY = 'TYPE_OF_INDUSTRY';
const YEARS_OF_EXPERIENCE = 'YEARS_OF_EXPERIENCE';
const REQUIRED_SKILLSET = 'REQUIRED_SKILLSET';
const WORKPLACE_LOCATION = 'WORKPLACE_LOCATION';
const START_DATE = 'START_DATE';
const OTHER_REQUIREMENTS = 'OTHER_REQUIREMENTS';
const PREFERRED_CONTACT_TIME = 'PREFERRED_CONTACT_TIME';
const EXTRA_DIALOG_PROMPT = 'EXTRA_DIALOG_PROMPT';

const { NO_JD_DIALOG } = require('./dialogConstants');

class NoJDDialog extends ComponentDialog {
    constructor(id) {
        super(id || NO_JD_DIALOG);

        this.addDialog(new ChoicePrompt(TYPE_OF_ENGINEER));
        this.addDialog(new TextPrompt(TYPE_OF_INDUSTRY));
        this.addDialog(new TextPrompt(YEARS_OF_EXPERIENCE));
        this.addDialog(new TextPrompt(REQUIRED_SKILLSET));
        this.addDialog(new TextPrompt(WORKPLACE_LOCATION));
        this.addDialog(new TextPrompt(START_DATE));
        this.addDialog(new TextPrompt(OTHER_REQUIREMENTS));
        this.addDialog(new TextPrompt(PREFERRED_CONTACT_TIME));
        this.addDialog(new TextPrompt(EXTRA_DIALOG_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.typeofEngineerStep.bind(this),
            this.typeofIndustryStep.bind(this),
            this.yearsOfexperienceStep.bind(this),
            this.requiredSkillsetStep.bind(this),
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
            choices: ChoiceFactory.toChoices(['Mechanical engineer', 'IT engineer'])
        });
    }

    async typeofIndustryStep(stepContext) {
        stepContext.values.industry = stepContext.result;
        const messageText = 'Which industry - Automotive, Heavyindustry, offroad vehicles, robotics…';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TYPE_OF_INDUSTRY, { prompt: msg });
    }

    async yearsOfexperienceStep(stepContext) {
        return await stepContext.prompt(TYPE_OF_ENGINEER, {
            prompt: 'How many years of experience is required?',
            choices: ChoiceFactory.toChoices(['0 -3 years', '3- 5 years', '5 - 7 years', '>7 years'])
        });
    }

    async requiredSkillsetStep(stepContext) {
        stepContext.values.experience = stepContext.result;
        const messageText = `What kind of Skillset/Tool Knowledge is required?
        Please select multiple skillsets if needed.
        You can also select "Other" and tell us if you have specific skillsets.`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(REQUIRED_SKILLSET, { prompt: msg });
    }

    async workLocationStep(stepContext) {
        stepContext.values.experience = stepContext.result;
        const messageText = 'Can you tell us the location of the workplace? (Ex. City/State/Zipcode)';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(WORKPLACE_LOCATION, { prompt: msg });
    }

    async startDateStep(stepContext) {
        return await stepContext.prompt(START_DATE, {
            prompt: 'Do you already have a Start Date? When do you need the engineer to start working? - ASAP, within 2 weeks, within 1 month, undecided.',
            choices: ChoiceFactory.toChoices(['ASAP', 'within 2 weeks', 'within 1 month', 'undecided'])
        });
    }

    async otherRequirementStep(stepContext) {
        stepContext.values.experience = stepContext.result;
        const messageText = `Can you tell us if you have any other requirements for the position?
        If not, please type "NA"`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(OTHER_REQUIREMENTS, { prompt: msg });
    }

    async replyOtherRequirementStep(stepContext) {
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
        await stepContext.context.sendActivity('Great!');
        return stepContext.next();
    }

    async extraDialogStep(stepContext) {
        stepContext.values.experience = stepContext.result;
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
