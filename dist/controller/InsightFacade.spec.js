"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../../../../../../../../../../../../../../../CPSC_310_Project/teamProject/src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../../../../../../../../../../../../../../../CPSC_310_Project/teamProject/src/controller/InsightFacade"));
const folder_test_1 = require("@ubccpsc310/folder-test");
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const TestUtil_1 = require("../TestUtil");
(0, chai_1.use)(chai_as_promised_1.default);
describe("InsightFacade", function () {
    let facade;
    let sections;
    let sections1;
    let sections2;
    let sections3;
    let sections4;
    let sections5;
    let sections6;
    let smallSections;
    before(function () {
        sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
        sections1 = (0, TestUtil_1.getContentFromArchives)("wrongData.zip");
        sections2 = (0, TestUtil_1.getContentFromArchives)("noCourse.zip");
        sections3 = (0, TestUtil_1.getContentFromArchives)("invalidSection.zip");
        sections4 = (0, TestUtil_1.getContentFromArchives)("notInCourses1.zip");
        sections5 = (0, TestUtil_1.getContentFromArchives)("notInCourses.zip");
        sections6 = (0, TestUtil_1.getContentFromArchives)("notResult.zip");
        smallSections = (0, TestUtil_1.getContentFromArchives)("smallPair.zip");
        (0, TestUtil_1.clearDisk)();
    });
    describe("Add/Remove/List Dataset", function () {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
        });
        beforeEach(function () {
            console.info(`BeforeTest: ${this.currentTest?.title}`);
            facade = new InsightFacade_1.default();
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
        });
        afterEach(function () {
            console.info(`AfterTest: ${this.currentTest?.title}`);
            (0, TestUtil_1.clearDisk)();
        });
        it("should reject with  an empty dataset id", function () {
            const result = facade.addDataset("", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with id having underscore", function () {
            const result = facade.addDataset("test_course", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with id having only space", function () {
            const result = facade.addDataset("   ", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject an invalid kind", function () {
            const result = facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should fulfill on a successful add", function () {
            return facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections).then((ids) => {
                (0, chai_1.expect)(ids).to.deep.equal(["courses"]);
                return facade.listDatasets();
            }).then((dataSetList) => {
                return (0, chai_1.expect)(dataSetList).to.deep.equal([{
                        id: "courses",
                        kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612
                    }]);
            });
        });
        it("the dataset with same ID should be rejected and not saved", function () {
            return facade.addDataset("course", sections, IInsightFacade_1.InsightDatasetKind.Sections).then(() => {
                const result = facade.addDataset("course", sections, IInsightFacade_1.InsightDatasetKind.Sections);
                return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
            });
        });
        it("should reject with an invalid zip file", function () {
            const result = facade.addDataset("course", sections1, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an invalid dataset", function () {
            const result = facade.addDataset("course", "hello", IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an zip without course", function () {
            const result = facade.addDataset("course", sections2, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an zip without valid SectionDataset.ts", function () {
            const result = facade.addDataset("course", sections3, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an zip with valid sections but not in Courses folder", function () {
            const result = facade.addDataset("course", sections4, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an zip with valid sections not in Courses folder", function () {
            const result = facade.addDataset("course", sections5, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with a SectionDataset.ts without result tag", function () {
            const result = facade.addDataset("course", sections6, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should add two different dataset successfully", async function () {
            await facade.addDataset("course", smallSections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result1 = await facade.addDataset("course1", smallSections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result1).to.deep.equal(["course", "course1"]);
        });
        it("should reject with removing a empty dataset id", function () {
            const result = facade.removeDataset("");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with removing a dataset id which contains underscore", function () {
            const result = facade.removeDataset("_");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with removing a whitespace dataset id", function () {
            const result = facade.removeDataset(" ");
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with removing a dataset id which hasn't been added yet", function () {
            return facade.addDataset("id1", smallSections, IInsightFacade_1.InsightDatasetKind.Sections).then((idList) => {
                const result = facade.removeDataset("id2");
                return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
            });
        });
        it("should resolve with adding and deleting the same dataset id", function () {
            return facade.addDataset("cs", smallSections, IInsightFacade_1.InsightDatasetKind.Sections).then((idList) => {
                const result = facade.removeDataset("cs");
                return (0, chai_1.expect)(result).to.eventually.be.deep.equal("cs");
            });
        });
        it("should reject with adding and deleting the same dataset id twice", async function () {
            return facade.addDataset("cs", smallSections, IInsightFacade_1.InsightDatasetKind.Sections).then(async () => {
                await facade.removeDataset("cs");
                const result = facade.removeDataset("cs");
                return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
            });
        });
    });
    describe("PerformQuery", () => {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
            facade = new InsightFacade_1.default();
            const loadDatasetPromises = [
                facade.addDataset("sections", sections, IInsightFacade_1.InsightDatasetKind.Sections),
                facade.addDataset("sect", sections, IInsightFacade_1.InsightDatasetKind.Sections),
            ];
            return Promise.all(loadDatasetPromises);
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
            (0, TestUtil_1.clearDisk)();
        });
        (0, folder_test_1.folderTest)("Dynamic InsightFacade PerformQuery tests", (input) => facade.performQuery(input), "./test/resources/queries", {
            assertOnResult: (actual, expected) => {
                (0, chai_1.expect)(expected).to.have.deep.members(actual);
            },
            errorValidator: (error) => error === "ResultTooLargeError" || error === "InsightError",
            assertOnError: (actual, expected) => {
                if (expected === "InsightError") {
                    (0, chai_1.expect)(actual).to.be.an.instanceOf(IInsightFacade_1.InsightError);
                }
                else if (expected === "ResultTooLargeError") {
                    (0, chai_1.expect)(actual).to.be.an.instanceOf(IInsightFacade_1.ResultTooLargeError);
                }
                else {
                    (0, chai_1.expect)(actual).to.be.an.instanceOf(IInsightFacade_1.NotFoundError);
                }
            },
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map