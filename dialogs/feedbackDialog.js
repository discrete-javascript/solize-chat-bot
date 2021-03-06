// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const { InputHints, MessageFactory } = require('botbuilder');
const {
    ConfirmPrompt, TextPrompt, WaterfallDialog, ComponentDialog,
    ChoiceFactory,
    ChoicePrompt,
    ListStyle
} = require('botbuilder-dialogs');

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

const { FEEDBACK_DIALOG, SELECTED_OTHER_DIALOG } = require('./dialogConstants');
const { callDB } = require('../db/db');

class FeedbackDialog extends ComponentDialog {
    constructor(id, contactDialog, selectedOtherDialog) {
        super(id || FEEDBACK_DIALOG);

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
        this.addDialog(selectedOtherDialog);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.employeeNameStep.bind(this),
            this.companyNameStep.bind(this),
            this.timeFrameStep.bind(this),
            this.introStep.bind(this),
            this.KnowledgeAndCompetenceStep.bind(this),
            this.AnalyticalSkillStep.bind(this),
            this.selfManagementStep.bind(this),
            this.teamWorkStep.bind(this),
            this.overallStep.bind(this),
            this.leaveCommentStep.bind(this),
            this.consolationStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a destination city has not been provided, prompt for one.
     */

    async employeeNameStep(stepContext) {
        const messageText = `Thank your for participating in our Feedback.
        Can you tell us the employee's name?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(EMPLOYEE_NAME_PROMPT, { prompt: msg });
    }

    async companyNameStep(stepContext) {
        stepContext.values.employeeName = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        const messageText = 'Can you tell us the name of your company?';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(COMPANY_NAME_PROMPT, { prompt: msg });
    }

    async timeFrameStep(stepContext) {
        stepContext.values.nameOfCompany = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        const messageText = `Can you tell us the time frame of 
        which your answers will be based on? (ex. January to February, last quarter, etc.)`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TIME_FRAME_PROMPT, { prompt: msg });
    }

    async introStep(stepContext) {
        stepContext.values.timeframeFeedback = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        const messageText = `Thanks.
        There will be 5 feedback questions in total, followed by a free comment section.
        Please rate and answer on the employee's skills, competency, and behaviors`;
        console.log(stepContext.values);
        await stepContext.context.sendActivity(messageText);
        return await stepContext.next();
    }

    async KnowledgeAndCompetenceStep(stepContext) {
        return await stepContext.prompt(KNOWLEDGE_COMPETENCE_PROMPT, {
            prompt: '**1. Knowledge and Competence** \n\n Does the employee show degrees of knowledge & skills necessary for the assigned job duties?',
            retryPrompt: 'Please select answers from below',
            choices: ChoiceFactory.toChoices(['Exceeeds Expectations', 'Meets Standards', 'Needs Improvement', 'Unsatisfactory']),
            style: ListStyle.suggestedAction
        });
    }

    async AnalyticalSkillStep(stepContext) {
        stepContext.values.knowledgeAndCompetence = stepContext.result.value;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        return await stepContext.prompt(ANALYTICAL_PROMPT, {
            prompt: '**2. Analytical Skills** \n\n Does the employee show degrees of skills necessary for solving problems or coming up with alternate solutions? \n Does the employee exercise the ability to observe, forecast and apply logic?',
            retryPrompt: 'Please select answers from below',
            choices: ChoiceFactory.toChoices(['Exceeeds Expectations', 'Meets Standards', 'Needs Improvement', 'Unsatisfactory']),
            style: ListStyle.suggestedAction
        });
    }

    async selfManagementStep(stepContext) {
        stepContext.values.analyticsSkills = stepContext.result.value;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        return await stepContext.prompt(SELF_MANAGEMENT_PROMPT, {
            prompt: '**3. Self Management** \n\n' +
            'Does the employee exercise the ability to perform work with minimal supervision, while fulfilling goals, task priorities, and feedback requirements?',
            retryPrompt: 'Please select answers from below',
            choices: ChoiceFactory.toChoices(['Exceeeds Expectations', 'Meets Standards', 'Needs Improvement', 'Unsatisfactory']),
            style: ListStyle.suggestedAction
        });
    }

    async teamWorkStep(stepContext) {
        stepContext.values.selfManagement = stepContext.result.value;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        return await stepContext.prompt(TEAM_WORK_PROMPT, {
            prompt: '**4. Teamwork**' +
            '\n\n Does the employee show degree of cooperation, support and understanding of co-workers, ' +
            'and promotes synergy and a productive environment?',
            retryPrompt: 'Please select answers from below',
            choices: ChoiceFactory.toChoices(['Exceeeds Expectations', 'Meets Standards', 'Needs Improvement', 'Unsatisfactory']),
            style: ListStyle.suggestedAction
        });
    }

    async overallStep(stepContext) {
        stepContext.values.teamwork = stepContext.result.value;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        return await stepContext.prompt(OVERALL_PROMPT, {
            prompt: '**5. Overall*** \n\n' +
            'Overall, how would you rate the employee\'s placement/performance/…?',
            retryPrompt: 'Please select answers from below',
            choices: ChoiceFactory.toChoices(['Exceeeds Expectations', 'Meets Standards', 'Needs Improvement', 'Unsatisfactory']),
            style: ListStyle.suggestedAction
        });
    }

    async leaveCommentStep(stepContext) {
        stepContext.values.overall = stepContext.result.value;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        const messageText = 'If you have other comments, please leave us a comment.';
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(LEAVE_COMMENT_PROMPT, { prompt: msg });
    }

    async consolationStep(stepContext) {
        stepContext.values.otherComments = stepContext.result;

        await callDB.updateItem({
            ...stepContext.options,
            ...stepContext.values
        });
        await stepContext.context.sendActivity(`OK! That's all the questions. 
        We'll send you your feedback content in the email you have provided us.`);
        return await stepContext.next();
    }

    async finalStep(stepContext) {
        this.payload = {
            ...stepContext.options,
            ...stepContext.values
        };
        return await stepContext.beginDialog(SELECTED_OTHER_DIALOG, { ...this.payload });
    }
}

module.exports.FeedbackDialog = FeedbackDialog;
