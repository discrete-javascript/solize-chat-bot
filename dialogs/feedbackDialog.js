// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const {
    ConfirmPrompt, TextPrompt, WaterfallDialog, ComponentDialog,
    ChoiceFactory,
    ChoicePrompt
} = require('botbuilder-dialogs');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

const EMPLOYEE_NAME_PROMPT = 'EMPLOYEE_NAME_PROMPT';
const COMPANY_NAME_PROMPT = 'COMPANY_NAME_PROMPT';
const TIME_FRAME_PROMPT = 'TIME_FRAME_PROMPT';
const LEAVE_COMMENT_PROMPT = 'LEAVE_COMMENT_PROMPT';
const FINAL_STEP_PROMPT = 'FINAL_STEP_PROMPT';
const KNOWLEDGE_COMPETENCE_PROMPT = 'KNOWLEDGE_COMPETENCE_PROMPT';
const ANALYTICAL_PROMPT = 'ANALYTICAL_PROMPT';
const SELF_MANAGEMENT_PROMPT = 'ANALYTICAL_PROMPT';
const TEAM_WORK_PROMPT = 'TEAM_WORK_PROMPT';
const OVERALL_PROMPT = 'ANALYTICAL_PROMPT';

class FeedbackDialog extends ComponentDialog {
    constructor(id) {
        super(id || 'feedbackDialog');

        this.addDialog(new TextPrompt(EMPLOYEE_NAME_PROMPT));
        this.addDialog(new TextPrompt(COMPANY_NAME_PROMPT));
        this.addDialog(new TextPrompt(TIME_FRAME_PROMPT));
        this.addDialog(new ChoicePrompt(KNOWLEDGE_COMPETENCE_PROMPT));
        this.addDialog(new ChoicePrompt(ANALYTICAL_PROMPT));
        this.addDialog(new ChoicePrompt(SELF_MANAGEMENT_PROMPT));
        this.addDialog(new ChoicePrompt(TEAM_WORK_PROMPT));
        this.addDialog(new ChoicePrompt(OVERALL_PROMPT));
        this.addDialog(new TextPrompt(LEAVE_COMMENT_PROMPT));
        this.addDialog(new ConfirmPrompt(FINAL_STEP_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.employeeNameStep.bind(this),
            this.companyNameStep.bind(this),
            this.timeFrameStep.bind(this),
            this.introStep.bind(this),
            this.knowledgeAndCompetenceStep.bind(this),
            this.AnalyticalSkillStep.bind(this),
            this.selfManagementStep.bind(this),
            this.teamWorkStep.bind(this),
            this.overallStep.bind(this),
            this.leaveCommentStep.bind(this),
            this.consolationStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;

        this.choices = ['Exceeeds Expectations', 'Meets Standards', 'Needs Improvement', 'Unsatisfactory'];
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */
    async employeeNameStep(stepContext) {
        stepContext.values.employeeName = stepContext.result;
        const messageText = `Thank your for participating in our Feedback.
        Can you tell us the employee's name?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(EMPLOYEE_NAME_PROMPT, { prompt: msg });
    }

    async companyNameStep(stepContext) {
        stepContext.values.companyName = stepContext.result;
        const messageText = 'Can you tell us the name of your company?';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(COMPANY_NAME_PROMPT, { prompt: msg });
    }

    async timeFrameStep(stepContext) {
        stepContext.values.timeFrame = stepContext.result;
        const messageText = `Can you tell us the time frame of 
        which your answers will be based on? (ex. January to February, last quarter, etc.)`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TIME_FRAME_PROMPT, { prompt: msg });
    }

    async introStep(stepContext) {
        const messageText = `Thanks.
        There will be 5 feedback questions in total, followed by a free comment section.
        Please rate and answer on the employee's skills, competency, and behaviors from range of 1(unsatisfactory) to 4(exceeds expectations).`;
        console.log(stepContext.values);
        await stepContext.context.sendActivity(messageText);
        return await stepContext.next();
    }

    async knowledgeAndCompetenceStep(stepContext) {
        return await stepContext.prompt(KNOWLEDGE_COMPETENCE_PROMPT, {
            prompt: `<b>Knowledge and Competence</b>
            Does the employee show degrees of knowledge & skills necessary for the assigned job duties?`,
            choices: ChoiceFactory.toChoices(this.choices)
        });
    }

    async AnalyticalSkillStep(stepContext) {
        return await stepContext.prompt(ANALYTICAL_PROMPT, {
            prompt: `Analytical Skills
            Does the employee show degrees of skills necessary for solving problems or coming up with alternate solutions? 
            Does the employee exercise the ability to observe, forecast and apply logic?`,
            choices: ChoiceFactory.toChoices(this.choices)
        });
    }

    async selfManagementStep(stepContext) {
        return await stepContext.prompt(ANALYTICAL_PROMPT, {
            prompt: `Self Management
            Does the employee exercise the ability to perform work with 
            minimal supervision, while fulfilling goals, task priorities, and feedback requirements?`,
            choices: ChoiceFactory.toChoices(this.choices)
        });
    }

    async teamWorkStep(stepContext) {
        return await stepContext.prompt(ANALYTICAL_PROMPT, {
            prompt: `Teamwork
            Does the employee show degree of cooperation, support and understanding of co-workers, 
            and promotes synergy and a productive environment?`,
            choices: ChoiceFactory.toChoices(this.choices)
        });
    }

    async overallStep(stepContext) {
        return await stepContext.prompt(ANALYTICAL_PROMPT, {
            prompt: `Overall
            Overall, how would you rate the employee's placement/performance/…?`,
            choices: ChoiceFactory.toChoices(this.choices)
        });
    }

    async leaveCommentStep(stepContext) {
        const messageText = 'If you have other comments, please leave us a comment.';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(LEAVE_COMMENT_PROMPT, { prompt: msg });
    }

    async consolationStep(stepContext) {
        await stepContext.context.sendActivity(`OK! That's all the questions. 
        We'll send you your feedback content in the email you have provided us.`);
        return await stepContext.next();
    }

    async finalStep(stepContext) {
        return await stepContext.prompt(FINAL_STEP_PROMPT,
            'Would you like to talk to a SOL agent about the feedback?', ['yes', 'no']);
    }

    async destinationStep(stepContext) {
        const bookingDetails = stepContext.options;

        if (!bookingDetails.destination) {
            const messageText = 'To what city would you like to travel?';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(bookingDetails.destination);
    }

    /**
     * If an origin city has not been provided, prompt for one.
     */
    async originStep(stepContext) {
        const bookingDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        bookingDetails.destination = stepContext.result;
        if (!bookingDetails.origin) {
            const messageText = 'From what city will you be travelling?';
            const msg = MessageFactory.text(messageText, 'From what city will you be travelling?', InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(bookingDetails.origin);
    }

    /**
     * If a travel date has not been provided, prompt for one.
     * This will use the DATE_RESOLVER_DIALOG.
     */
    async travelDateStep(stepContext) {
        const bookingDetails = stepContext.options;

        // Capture the results of the previous step
        bookingDetails.origin = stepContext.result;
        if (!bookingDetails.travelDate || this.isAmbiguous(bookingDetails.travelDate)) {
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: bookingDetails.travelDate });
        }
        return await stepContext.next(bookingDetails.travelDate);
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const bookingDetails = stepContext.options;

        // Capture the results of the previous step
        bookingDetails.travelDate = stepContext.result;
        const messageText = `Please confirm, I have you traveling to: ${ bookingDetails.destination } from: ${ bookingDetails.origin } on: ${ bookingDetails.travelDate }. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    // async finalStep(stepContext) {
    //     if (stepContext.result === true) {
    //         const bookingDetails = stepContext.options;
    //         return await stepContext.endDialog(bookingDetails);
    //     }
    //     return await stepContext.endDialog();
    // }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.FeedbackDialog = FeedbackDialog;
