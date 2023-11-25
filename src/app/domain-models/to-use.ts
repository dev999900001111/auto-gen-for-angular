export class ModelControlClass {

    constructor(
        public services: { [key: string]: ServiceClass },
        public models: { [key: string]: ModelClass },
    ) {
    }

    pickUp(services: string[]): { serviceDef: string, modelDef: string } {
        const modelSet = new Set<string>();
        let serviceDef = '';
        let modelDef = '';
        services.forEach(serviceName => {
            serviceDef += `- ${serviceName}\n`;
            if (this.services[serviceName]) {
                this.services[serviceName].methods.forEach(method => {
                    serviceDef += `   - ${this.methodToString(method)}\n`;
                    Array.from(this.getModelSet(method)).forEach(modelName => modelSet.add(modelName));
                });
            } else { }
        });
        Array.from(modelSet).forEach((modelName: string) => {
            modelDef += `- ${modelName}: { ${this.modelToString(this.models[modelName])} }\n`;
        });
        return { serviceDef, modelDef };
    }

    methodToString(method: ServiceClassMethod): string {
        const args = method.params.map((param: ClassProp) => `${param.name}: ${param.type}`).join(', ');
        const desc = method.description ? (` // ${method.description}`) : '';
        return `${method.name}(${args}): ${method.return}${desc}`;
    }

    modelToString(model: ModelClass) {
        // console.log(modelName);
        if (model.props) {
            return model.props?.map(prop => {
                return `${prop.name}: ${prop.type}`;
            }).join(', ');
        } else {
            return model.values?.join(', ');
        }
    }

    getModelSet(method: ServiceClassMethod): Set<string> {
        const set = new Set<string>();
        const returnModel = method.return.replace('Promise<', '').replace('>', '').replace('[]', '');
        this.recur(returnModel, set);
        method.params.forEach(param => {
            const paramModel = param.type.replace('[]', '');
            this.recur(paramModel, set);
        });
        // リテラルを削除
        ['void', 'number', 'string', 'Date',].forEach(literal => set.delete(literal));
        return set;
    }

    recur(modelName: string, set: Set<string>): void {
        if (this.models[modelName]) {
        } else {
            // console.log(`XXXXXXXXXXXXXXXX:${modelName}`);
            return;
        }
        set.add(modelName);
        // console.log(`Model: ${modelName}: `);
        if (this.models[modelName].props) {
        } else {
            // console.log(`${modelName}: [${models[modelName].values}]`);
            return;
        }
        this.models[modelName].props?.forEach(prop => {
            // console.log(`   - ${prop.name}: ${prop.type}`);
            const cls = prop.type.replace('[]', '');
            this.recur(cls, set);
        });
    }
}

export interface ModelClass {
    desc: string,
    props?: ClassProp[],
    values?: string[],
}
export interface ClassProp {
    name: string;
    type: string;
    validation?: string;
}

export interface ServiceClass {
    path: string;
    models: string[];
    methods: ServiceClassMethod[]
}
export interface ServiceClassMethod {
    name: string;
    params: ClassProp[],
    return: string;
    description?: string;
}


// const models: { [key: string]: ModelClass } = {
//     "Employee": {
//         "desc": "Represents an employee in the company",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "firstName", "type": "string", "validation": "1-50 characters" },
//             { "name": "lastName", "type": "string", "validation": "1-50 characters" },
//             { "name": "email", "type": "string", "validation": "valid email format" },
//             { "name": "phone", "type": "string", "validation": "10-15 characters" },
//             { "name": "position", "type": "Position", "validation": "" },
//             { "name": "department", "type": "Department", "validation": "" },
//             { "name": "team", "type": "Team", "validation": "" },
//             { "name": "employmentType", "type": "EmploymentType", "validation": "" },
//             { "name": "hireDate", "type": "Date", "validation": "" }]
//     },
//     "EmployeeRequest": {
//         "desc": "Represents a request to create a new employee",
//         "props": [
//             { "name": "firstName", "type": "string", "validation": "1-50 characters" },
//             { "name": "lastName", "type": "string", "validation": "1-50 characters" },
//             { "name": "email", "type": "string", "validation": "valid email format" },
//             { "name": "phone", "type": "string", "validation": "10-15 characters" },
//             { "name": "positionId", "type": "number", "validation": "" },
//             { "name": "departmentId", "type": "number", "validation": "" },
//             { "name": "teamId", "type": "number", "validation": "" },
//             { "name": "employmentTypeId", "type": "number", "validation": "" },
//             { "name": "hireDate", "type": "Date", "validation": "" }
//         ]
//     },
//     "Attendance": {
//         "desc": "Represents an attendance record for an employee",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "employee", "type": "Employee", "validation": "" },
//             { "name": "checkIn", "type": "Date", "validation": "" },
//             { "name": "checkOut", "type": "Date", "validation": "" },
//             { "name": "status", "type": "AttendanceStatus", "validation": "" },
//             { "name": "date", "type": "Date", "validation": "" }
//         ]
//     },
//     "AttendanceRequest": {
//         "desc": "Represents a request to create a new attendance record for an employee",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "checkIn", "type": "Date", "validation": "" },
//             { "name": "checkOut", "type": "Date", "validation": "" },
//             { "name": "status", "type": "AttendanceStatus", "validation": "" },
//             { "name": "date", "type": "Date", "validation": "" }
//         ]
//     },
//     "Salary": {
//         "desc": "Represents a salary record for an employee",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "employee", "type": "Employee", "validation": "" },
//             { "name": "baseSalary", "type": "number", "validation": ">=0" },
//             { "name": "bonus", "type": "number", "validation": ">=0" },
//             { "name": "deductions", "type": "number", "validation": ">=0" },
//             { "name": "effectiveDate", "type": "Date", "validation": "" }
//         ]
//     },
//     "SalaryRequest": {
//         "desc": "Represents a request to create a new salary record for an employee",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "baseSalary", "type": "number", "validation": ">=0" },
//             { "name": "bonus", "type": "number", "validation": ">=0" },
//             { "name": "deductions", "type": "number", "validation": ">=0" },
//             { "name": "effectiveDate", "type": "Date", "validation": "" }
//         ]
//     },
//     "SalaryPayment": {
//         "desc": "Represents a salary payment record for an employee",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "employee", "type": "Employee", "validation": "" },
//             { "name": "paymentDate", "type": "Date", "validation": "" },
//             { "name": "amount", "type": "number", "validation": ">=0" },
//             { "name": "description", "type": "string", "validation": "0-200 characters" }
//         ]
//     },
//     "Performance": {
//         "desc": "Represents a performance record for an employee",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "employee", "type": "Employee", "validation": "" },
//             { "name": "goals", "type": "PerformanceGoal[]", "validation": "" },
//             { "name": "evaluations", "type": "PerformanceEvaluation[]", "validation": "" },
//             { "name": "reviews", "type": "PerformanceReview[]", "validation": "" },
//             { "name": "feedback", "type": "PerformanceFeedback[]", "validation": "" },
//             { "name": "growthPlans", "type": "GrowthPlan[]", "validation": "" }
//         ]
//     },
//     "PerformanceGoalRequest": {
//         "desc": "Represents a request to create a new performance goal for an employee",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "title", "type": "string", "validation": "1-100 characters" },
//             { "name": "description", "type": "string", "validation": "0-500 characters" },
//             { "name": "targetDate", "type": "Date", "validation": "" }
//         ]
//     },
//     "PerformanceReviewRequest": {
//         "desc": "Represents a request to create a new performance review for an employee",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "reviewerId", "type": "number", "validation": "" },
//             { "name": "rating", "type": "number", "validation": "1-5" },
//             { "name": "comments", "type": "string", "validation": "0-500 characters" },
//             { "name": "reviewDate", "type": "Date", "validation": "" }
//         ]
//     },
//     "TrainingProgram": {
//         "desc": "Represents a training program",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "title", "type": "string", "validation": "1-100 characters" },
//             { "name": "description", "type": "string", "validation": "0-500 characters" },
//             { "name": "startDate", "type": "Date", "validation": "" },
//             { "name": "endDate", "type": "Date", "validation": "" },
//             { "name": "participants", "type": "Employee[]", "validation": "" }
//         ]
//     },
//     "TrainingProgramRequest": {
//         "desc": "Represents a request to create a new training program",
//         "props": [
//             { "name": "title", "type": "string", "validation": "1-100 characters" },
//             { "name": "description", "type": "string", "validation": "0-500 characters" },
//             { "name": "startDate", "type": "Date", "validation": "" },
//             { "name": "endDate", "type": "Date", "validation": "" },
//             { "name": "participantIds", "type": "number[]", "validation": "" }
//         ]
//     },
//     "TrainingHistory": {
//         "desc": "Represents an employee's training history",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "employee", "type": "Employee", "validation": "" },
//             { "name": "trainingProgram", "type": "TrainingProgram", "validation": "" },
//             { "name": "completionDate", "type": "Date", "validation": "" },
//             { "name": "status", "type": "TrainingStatus", "validation": "" }
//         ]
//     },
//     "TrainingScheduleRequest": {
//         "desc": "Represents a request to schedule a training program for an employee",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "trainingProgramId", "type": "number", "validation": "" },
//             { "name": "startDate", "type": "Date", "validation": "" },
//             { "name": "endDate", "type": "Date", "validation": "" }
//         ]
//     },
//     "EmployeeReportRequest": {
//         "desc": "Represents a request for an employee report",
//         "props": [
//             { "name": "departmentId", "type": "number", "validation": "" },
//             { "name": "teamId", "type": "number", "validation": "" },
//             { "name": "employmentTypeId", "type": "number", "validation": "" },
//             { "name": "hireDateRange", "type": "DateRange", "validation": "" }
//         ]
//     },
//     "AttendanceReportRequest": {
//         "desc": "Represents a request for an attendance report",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "dateRange", "type": "DateRange", "validation": "" },
//             { "name": "status", "type": "AttendanceStatus", "validation": "" }
//         ]
//     },
//     "SalaryReportRequest": {
//         "desc": "Represents a request for a salary report",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "paymentDateRange", "type": "DateRange", "validation": "" }
//         ]
//     },
//     "PerformanceReportRequest": {
//         "desc": "Represents a request for a performance report",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "goalCompletionRange", "type": "DateRange", "validation": "" },
//             { "name": "reviewDateRange", "type": "DateRange", "validation": "" }
//         ]
//     },
//     "TrainingReportRequest": {
//         "desc": "Represents a request for a training report",
//         "props": [
//             { "name": "employeeId", "type": "number", "validation": "" },
//             { "name": "trainingProgramId", "type": "number", "validation": "" },
//             { "name": "completionDateRange", "type": "DateRange", "validation": "" }
//         ]
//     },
//     "Dashboard": {
//         "desc": "Represents a dashboard",
//         "props": [
//             { "name": "id", "type": "number", "validation": "" },
//             { "name": "title", "type": "string", "validation": "1-100 characters" },
//             { "name": "description", "type": "string", "validation": "0-200 characters" },
//             { "name": "widgets", "type": "Widget[]", "validation": "" }
//         ]
//     },
//     "DashboardRequest": {
//         "desc": "Represents a request to create a new dashboard",
//         "props": [
//             { "name": "title", "type": "string", "validation": "1-100 characters" },
//             { "name": "description", "type": "string", "validation": "0-200 characters" },
//             { "name": "widgetIds", "type": "number[]", "validation": "" }
//         ]
//     },
//     "AttendanceStatus": {
//         "desc": "Represents the status of an attendance record",
//         "values": ["PRESENT", "ABSENT", "LEAVE"]
//     },
//     "TrainingStatus": {
//         "desc": "Represents the status of a training program",
//         "values": ["COMPLETED", "IN_PROGRESS", "NOT_STARTED"]
//     },
//     "DateRange": {
//         "desc": "Represents a date range",
//         "props": [
//             { "name": "startDate", "type": "Date", "validation": "" },
//             { "name": "endDate", "type": "Date", "validation": ">= startDate" }
//         ]
//     }
// };

// const services: { [key: string]: ServiceClass } = {
//     "EmployeeService": {
//         "path": "./src/app/services/EmployeeService.ts",
//         "models": [
//             "Employee",
//             "EmployeeRequest"
//         ],
//         "methods": [
//             { "name": "getAllEmployees", "params": [], "return": "Promise<Employee[]>" },
//             { "name": "getEmployeeById", "params": [{ "name": "id", "type": "number" }], "return": "Promise<Employee>" },
//             { "name": "createEmployee", "params": [{ "name": "employee", "type": "EmployeeRequest" }], "return": "Promise<Employee>" },
//             { "name": "updateEmployee", "params": [{ "name": "id", "type": "number" }, { "name": "employee", "type": "EmployeeRequest" }], "return": "Promise<Employee>" },
//             { "name": "deleteEmployee", "params": [{ "name": "id", "type": "number" }], "return": "Promise<void>" }
//         ]
//     },
//     "AttendanceService": {
//         "path": "./src/app/services/AttendanceService.ts",
//         "models": ["Attendance", "AttendanceRequest"],
//         "methods": [
//             { "name": "getAttendanceByEmployeeId", "params": [{ "name": "employeeId", "type": "number" }], "return": "Promise<Attendance[]>" },
//             { "name": "createAttendance", "params": [{ "name": "attendance", "type": "AttendanceRequest" }], "return": "Promise<Attendance>" },
//             { "name": "updateAttendance", "params": [{ "name": "id", "type": "number" }, { "name": "attendance", "type": "AttendanceRequest" }], "return": "Promise<Attendance>" },
//             { "name": "deleteAttendance", "params": [{ "name": "id", "type": "number" }], "return": "Promise<void>" }
//         ]
//     },
//     "SalaryService": {
//         "path": "./src/app/services/SalaryService.ts",
//         "models": ["Salary", "SalaryRequest", "SalaryPayment"],
//         "methods": [
//             { "name": "getSalaryByEmployeeId", "params": [{ "name": "employeeId", "type": "number" }], "return": "Promise<Salary>" },
//             { "name": "createSalary", "params": [{ "name": "salary", "type": "SalaryRequest" }], "return": "Promise<Salary>" },
//             { "name": "updateSalary", "params": [{ "name": "id", "type": "number" }, { "name": "salary", "type": "SalaryRequest" }], "return": "Promise<Salary>" },
//             { "name": "getSalaryPaymentHistory", "params": [{ "name": "employeeId", "type": "number" }], "return": "Promise<SalaryPayment[]>" }
//         ]
//     },
//     "PerformanceService": {
//         "path": "./src/app/services/PerformanceService.ts",
//         "models": ["Performance", "PerformanceGoalRequest", "PerformanceReviewRequest"],
//         "methods": [
//             { "name": "getPerformanceByEmployeeId", "params": [{ "name": "employeeId", "type": "number" }], "return": "Promise<Performance>" },
//             { "name": "createPerformanceGoal", "params": [{ "name": "goal", "type": "PerformanceGoalRequest" }], "return": "Promise<PerformanceGoal>" },
//             { "name": "updatePerformanceGoal", "params": [{ "name": "id", "type": "number" }, { "name": "goal", "type": "PerformanceGoalRequest" }], "return": "Promise<PerformanceGoal>" },
//             { "name": "deletePerformanceGoal", "params": [{ "name": "id", "type": "number" }], "return": "Promise<void>" },
//             { "name": "createPerformanceReview", "params": [{ "name": "review", "type": "PerformanceReviewRequest" }], "return": "Promise<PerformanceReview>" },
//             { "name": "updatePerformanceReview", "params": [{ "name": "id", "type": "number" }, { "name": "review", "type": "PerformanceReviewRequest" }], "return": "Promise<PerformanceReview>" },
//             { "name": "deletePerformanceReview", "params": [{ "name": "id", "type": "number" }], "return": "Promise<void>" }
//         ]
//     },
//     "TrainingService": {
//         "path": "./src/app/services/TrainingService.ts",
//         "models": ["TrainingProgram", "TrainingProgramRequest", "TrainingHistory", "TrainingScheduleRequest"],
//         "methods": [
//             { "name": "getTrainingPrograms", "params": [], "return": "Promise<TrainingProgram[]>" },
//             { "name": "createTrainingProgram", "params": [{ "name": "program", "type": "TrainingProgramRequest" }], "return": "Promise<TrainingProgram>" },
//             { "name": "updateTrainingProgram", "params": [{ "name": "id", "type": "number" }, { "name": "program", "type": "TrainingProgramRequest" }], "return": "Promise<TrainingProgram>" },
//             { "name": "deleteTrainingProgram", "params": [{ "name": "id", "type": "number" }], "return": "Promise<void>" },
//             { "name": "getTrainingHistoryByEmployeeId", "params": [{ "name": "employeeId", "type": "number" }], "return": "Promise<TrainingHistory[]>" },
//             { "name": "createTrainingSchedule", "params": [{ "name": "schedule", "type": "TrainingScheduleRequest" }], "return": "Promise<TrainingSchedule>" },
//             { "name": "updateTrainingSchedule", "params": [{ "name": "id", "type": "number" }, { "name": "schedule", "type": "TrainingScheduleRequest" }], "return": "Promise<TrainingSchedule>" },
//             { "name": "deleteTrainingSchedule", "params": [{ "name": "id", "type": "number" }], "return": "Promise<void>" }
//         ]
//     },
//     "ReportingService": {
//         "path": "./src/app/services/ReportingService.ts",
//         "models": ["EmployeeReportRequest", "AttendanceReportRequest", "SalaryReportRequest", "PerformanceReportRequest", "TrainingReportRequest", "Dashboard", "DashboardRequest"],
//         "methods": [
//             { "name": "getEmployeeReport", "params": [{ "name": "filter", "type": "EmployeeReportRequest" }], "return": "Promise<EmployeeReport[]>" },
//             { "name": "getAttendanceReport", "params": [{ "name": "filter", "type": "AttendanceReportRequest" }], "return": "Promise<AttendanceReport[]>" },
//             { "name": "getSalaryReport", "params": [{ "name": "filter", "type": "SalaryReportRequest" }], "return": "Promise<SalaryReport[]>" },
//             { "name": "getPerformanceReport", "params": [{ "name": "filter", "type": "PerformanceReportRequest" }], "return": "Promise<PerformanceReport[]>" },
//             { "name": "getTrainingReport", "params": [{ "name": "filter", "type": "TrainingReportRequest" }], "return": "Promise<TrainingReport[]>" },
//             { "name": "createDashboard", "params": [{ "name": "dashboard", "type": "DashboardRequest" }], "return": "Promise<Dashboard>" },
//             { "name": "updateDashboard", "params": [{ "name": "id", "type": "number" }, { "name": "dashboard", "type": "DashboardRequest" }], "return": "Promise<Dashboard>" },
//             { "name": "deleteDashboard", "params": [{ "name": "id", "type": "number" }], "return": "Promise<void>" }
//         ]
//     }
// };

// const a = new ModelControlClass(services, models).pickUp(Object.keys(services));
// console.log(a.modelDef);
// console.log(a.serviceDef);