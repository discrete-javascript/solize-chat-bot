class SchemaDB {
    constructor(
        name,
        email,
        phoneNumber,
        serviceDetails,
        hasJd = 'NA',
        typeOfEngineer = 'NA',
        typeOfIndustry = 'NA',
        yearsExp = 'NA',
        extraSkillset = 'NA',
        workplaceLocation = 'NA',
        startDate = 'NA',
        otherRequirement = 'NA',
        preferredContact = 'NA',
        uploadFileLink = 'NA',
        employeeName = 'NA',
        nameOfCompany = 'NA',
        timeframeFeedback = 'NA',
        knowledgeAndCompetence = 'NA',
        analyticsSkills = 'NA',
        selfManagement = 'NA',
        teamwork = 'NA',
        overall = 'NA',
        otherComments = 'NA') {
        this.id = '';
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.serviceDetails = serviceDetails;
        this.hasJd = hasJd;
        this.typeOfEngineer = typeOfEngineer;
        this.typeOfIndustry = typeOfIndustry;
        this.yearsExp = yearsExp;
        this.extraSkillset = extraSkillset;
        this.workplaceLocation = workplaceLocation;
        this.startDate = startDate;
        this.otherRequirement = otherRequirement;
        this.preferredContact = preferredContact;
        this.uploadFileLink = uploadFileLink;
        this.employeeName = employeeName;
        this.nameOfCompany = nameOfCompany;
        this.timeframeFeedback = timeframeFeedback;
        this.knowledgeAndCompetence = knowledgeAndCompetence;
        this.analyticsSkills = analyticsSkills;
        this.selfManagement = selfManagement;
        this.teamwork = teamwork;
        this.overall = overall;
        this.otherComments = otherComments;
    }
}

module.exports.SchemaDB = SchemaDB;
