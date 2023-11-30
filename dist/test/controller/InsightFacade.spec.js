"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const TestUtil_1 = require("../TestUtil");
const folder_test_1 = require("@ubccpsc310/folder-test");
(0, chai_1.use)(chai_as_promised_1.default);
describe("InsightFacade", function () {
    let facade;
    let sections;
    let sectionMini;
    let sectionWithTwo;
    let oneCourseWithEmptySections;
    let oneCourseOneSection;
    let rooms;
    let multiEntryIndexFileWithOneBuilding16rooms;
    let multiEntryIndexFileWithOneValidBuilding1room;
    let indexHasNoTableBody;
    let indexFileMissesCriticalFieldsInTableHeader;
    let roomHasAMissingAttributeAnd15ValidRooms;
    let indexFileHasOneBuildingWithMissingAttributeButAnotherBuildingWithCompleteAttribute;
    let completeIndexFileButOnlyHasWOOD;
    before(function () {
        sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
        sectionMini = (0, TestUtil_1.getContentFromArchives)("pairMini.zip");
        sectionWithTwo = (0, TestUtil_1.getContentFromArchives)("twoCourses.zip");
        oneCourseWithEmptySections = (0, TestUtil_1.getContentFromArchives)("oneEmptyCourse.zip");
        oneCourseOneSection = (0, TestUtil_1.getContentFromArchives)("oneCourseOneSection.zip");
        rooms = (0, TestUtil_1.getContentFromArchives)("campus.zip");
        multiEntryIndexFileWithOneBuilding16rooms =
            (0, TestUtil_1.getContentFromArchives)("multiEntryIndexFile_with_oneValidBuilding_16rooms.zip");
        multiEntryIndexFileWithOneValidBuilding1room =
            (0, TestUtil_1.getContentFromArchives)("multiEntryIndexFile_with_oneValidBuilding_1room.zip");
        indexHasNoTableBody = (0, TestUtil_1.getContentFromArchives)("indexHasNoTableBody.zip");
        indexFileMissesCriticalFieldsInTableHeader =
            (0, TestUtil_1.getContentFromArchives)("indexFileMissesCriticalFieldsInTableHeader.zip");
        roomHasAMissingAttributeAnd15ValidRooms = (0, TestUtil_1.getContentFromArchives)("roomHasAMissingAttributeInTheTable.zip");
        indexFileHasOneBuildingWithMissingAttributeButAnotherBuildingWithCompleteAttribute =
            (0, TestUtil_1.getContentFromArchives)("oneBuildingHasMissingAttribute.zip");
        completeIndexFileButOnlyHasWOOD = (0, TestUtil_1.getContentFromArchives)("ezyzip.zip");
        (0, TestUtil_1.clearDisk)();
    });
    describe("Add Sections", function () {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
        });
        beforeEach(function () {
            console.info(`BeforeTest: ${this.currentTest?.title}`);
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
        });
        afterEach(function () {
            console.info(`AfterTest: ${this.currentTest?.title}`);
            (0, TestUtil_1.clearDisk)();
        });
        it("should reject with an empty dataset id", async function () {
            try {
                await facade.addDataset("", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("Should fulfill given a valid dataset", async function () {
            const expected = ["aDataset"];
            const result = await facade.addDataset("aDataset", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Two course: Should fulfill given a valid dataset", async function () {
            const expected = ["twoCourses"];
            const result = await facade.addDataset("twoCourses", sectionWithTwo, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("should reject given one empty course", async function () {
            try {
                await facade.addDataset("aCourse", oneCourseWithEmptySections, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("oneCourseOneSection: Should fulfill given a valid dataset", async function () {
            const expected = ["aCourse"];
            const result = await facade.addDataset("aCourse", oneCourseOneSection, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Should fulfill given 2 valid datasets with different id", async function () {
            const expected = ["aDataset1", "aDataset2"];
            await facade.addDataset("aDataset1", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade.addDataset("aDataset2", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("should reject where dataset id is one space", async function () {
            try {
                await facade.addDataset(" ", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should reject where dataset id is one tab", async function () {
            try {
                await facade.addDataset("   ", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should reject where dataset id contains underscore", async function () {
            try {
                await facade.addDataset("a_section", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should reject if the ID has existed + Compare Content", async function () {
            await facade.addDataset("aRandomID", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            try {
                await facade.addDataset("aRandomID", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
            let list = await facade.listDatasets();
            let expected = [{ id: "aRandomID", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 }];
            (0, chai_1.expect)(list).to.have.deep.members(expected);
        });
        it("should reject when misgiving the wrong InsightDatasetKind (Rooms for Sections)", async function () {
            try {
                await facade.addDataset("aRandomID", sectionMini, IInsightFacade_1.InsightDatasetKind.Rooms);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
    });
    describe("Add Rooms", function () {
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
        it("should fulfill when added campus.zip", async function () {
            const expected = [{ id: "aRandomID", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 364 }];
            await facade.addDataset("aRandomID", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            let result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("should reject when index file misses critical column in table header", async function () {
            try {
                await facade.addDataset("randomID", indexFileMissesCriticalFieldsInTableHeader, IInsightFacade_1.InsightDatasetKind.Rooms);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should reject when indexHasNoTableBody", async function () {
            try {
                await facade.addDataset("randomID", indexHasNoTableBody, IInsightFacade_1.InsightDatasetKind.Rooms);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should reject with an empty dataset id for Room", async function () {
            try {
                await facade.addDataset("", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("Should reject when a room (first) and a section (second) shares the same id", async function () {
            try {
                await facade.addDataset("aDataset", roomHasAMissingAttributeAnd15ValidRooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                await facade.addDataset("aDataset", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("Should fulfill when you add one room and a section data", async function () {
            await facade.addDataset("id1", roomHasAMissingAttributeAnd15ValidRooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            let result = await facade.addDataset("id2", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            (0, chai_1.expect)(result).to.deep.equal(["id1", "id2"]);
        });
        it("Should reject when a section (first) and a room (second) shares the same id", async function () {
            try {
                await facade.addDataset("aDataset", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
                await facade.addDataset("aDataset", roomHasAMissingAttributeAnd15ValidRooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should reject when type were given as Sections when it should be rooms", async function () {
            try {
                await facade.addDataset("", rooms, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
        it("should fulfill when added a dataset with only one building (WOOD)", async function () {
            const expected = [{ id: "aRandomID", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 16 }];
            await facade.addDataset("aRandomID", completeIndexFileButOnlyHasWOOD, IInsightFacade_1.InsightDatasetKind.Rooms);
            let result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Should fulfill even when some links don't work", async function () {
            const expected = [{ id: "aRandomID", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 16 }];
            await facade.addDataset("aRandomID", multiEntryIndexFileWithOneBuilding16rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            let result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Should fulfill when one building has missing fields but another complete", async function () {
            const expected = [{ id: "aRandomID", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 2 }];
            await facade.addDataset("aRandomID", indexFileHasOneBuildingWithMissingAttributeButAnotherBuildingWithCompleteAttribute, IInsightFacade_1.InsightDatasetKind.Rooms);
            let result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Should fulfill when one room in a valid building has a valid field missing", async function () {
            const expected = [{ id: "aRandomID", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 15 }];
            await facade.addDataset("aRandomID", roomHasAMissingAttributeAnd15ValidRooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            let result = await facade.listDatasets();
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
    });
    describe("Remove Dataset", function () {
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
        it("should reject with if no dataset has been added", async function () {
            try {
                await facade.removeDataset("notExist");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.NotFoundError);
            }
            const list = await facade.listDatasets();
            (0, chai_1.expect)(list).to.have.length(0);
        });
        it("should reject with id is not found", async function () {
            await facade.addDataset("aRandomID", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            try {
                await facade.removeDataset("notExist");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.NotFoundError);
            }
            const list = await facade.listDatasets();
            (0, chai_1.expect)(list).to.have.length(1);
        });
        it("should reject if the id is empty", async function () {
            await facade.addDataset("aRandomID", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            try {
                await facade.removeDataset("");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
            const list = await facade.listDatasets();
            (0, chai_1.expect)(list).to.have.length(1);
        });
        it("should reject the same id is removed twice with adding", async function () {
            await facade.addDataset("s", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.removeDataset("s");
            try {
                await facade.removeDataset("s");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.NotFoundError);
            }
            const list = await facade.listDatasets();
            (0, chai_1.expect)(list).to.have.length(0);
        });
        it("should fulfill if the same id is added, removed repeatedly", async function () {
            await facade.addDataset("s", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            try {
                await facade.removeDataset("s");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.NotFoundError);
            }
            await facade.addDataset("s", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            try {
                await facade.removeDataset("s");
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.NotFoundError);
            }
            const list = await facade.listDatasets();
            (0, chai_1.expect)(list).to.have.length(0);
        });
        it("should remove no dataset with those whose id is empty", async function () {
            await facade.addDataset("random", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            return facade.removeDataset("")
                .then(() => {
                chai_1.expect.fail("should not reach here");
            })
                .catch((result2) => {
                return facade.listDatasets()
                    .then((listed) => {
                    (0, chai_1.expect)(result2).to.be.an.instanceof(IInsightFacade_1.InsightError);
                    (0, chai_1.expect)(listed).to.be.an.instanceof(Array);
                    (0, chai_1.expect)(listed).to.have.length(1);
                    const insightDatasetPair = listed.find((dataset) => dataset.id === "random");
                    (0, chai_1.expect)(insightDatasetPair).to.exist;
                });
            });
        });
    });
    describe("List Dataset", function () {
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
        it("should pass if no dataset has been added", async function () {
            const insightDatasets = await facade.listDatasets();
            (0, chai_1.expect)(insightDatasets).to.have.length(0);
            (0, chai_1.expect)(insightDatasets).to.be.an("array");
        });
        it("should fulfill for the correct length and data type (single)", function () {
            return facade.addDataset("aRandomID", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections).then(() => {
                return facade.listDatasets();
            }).then((dataset) => {
                (0, chai_1.expect)(dataset).to.be.an("array");
                (0, chai_1.expect)(dataset).to.have.length(1);
            });
        });
        it("should fulfill for the correct length and data type (multi)", function () {
            return facade.addDataset("aRandomID1", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections)
                .then(() => {
                return facade.addDataset("aRandomID2", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            })
                .then(() => {
                return facade.listDatasets();
            })
                .then((dataset) => {
                (0, chai_1.expect)(dataset).to.be.an("array");
                (0, chai_1.expect)(dataset).to.have.length(2);
            });
        });
    });
    describe("Handling Crash", function () {
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
        it("Remove dataset should work with the new Facade instance", async function () {
            await facade.addDataset("aDataset1", sectionWithTwo, IInsightFacade_1.InsightDatasetKind.Sections);
            let facade2 = new InsightFacade_1.default();
            await facade2.removeDataset("aDataset1");
            await facade2.addDataset("aDataset2", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            let facade3 = new InsightFacade_1.default();
            let result = await facade3.listDatasets();
            const expected = [{ id: "aDataset2", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 }];
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Data should persist on a newly instantiated instance", async function () {
            await facade.addDataset("aDataset1", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const expected = [{ id: "aDataset1", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 }];
            let facade2 = new InsightFacade_1.default();
            const result = await facade2.listDatasets();
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Should fulfill if dataset is not added to the first InsightFacade instance", async function () {
            const expected = [{ id: "aDataset1", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 }];
            let facade2 = new InsightFacade_1.default();
            await facade2.addDataset("aDataset1", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = await facade2.listDatasets();
            return (0, chai_1.expect)(result).to.deep.equal(expected);
        });
        it("Should fail with an Insight Error when a dataset with an existing ID is added", async function () {
            try {
                await facade.addDataset("aDataset1", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
                let facade2 = new InsightFacade_1.default();
                await facade2.addDataset("aDataset1", sectionMini, IInsightFacade_1.InsightDatasetKind.Sections);
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        });
    });
    describe("PerformQuery", () => {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
            facade = new InsightFacade_1.default();
            const loadDatasetPromises = [
                facade.addDataset("sections", sections, IInsightFacade_1.InsightDatasetKind.Sections),
                facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms),
                facade.addDataset("courses", sections, IInsightFacade_1.InsightDatasetKind.Sections)
            ];
            return Promise.all(loadDatasetPromises);
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
            (0, TestUtil_1.clearDisk)();
        });
        function errorValidator(error) {
            return error === "InsightError" || error === "ResultTooLargeError";
        }
        function assertOnResult(actual, expected) {
            (0, chai_1.expect)(actual).to.deep.equal(expected);
        }
        function assertOnError(actual, expected) {
            if (expected === "ResultTooLargeError") {
                (0, chai_1.expect)(actual).to.be.instanceOf(IInsightFacade_1.ResultTooLargeError);
            }
            else if (expected === "InsightError") {
                (0, chai_1.expect)(actual).to.be.instanceOf(IInsightFacade_1.InsightError);
            }
        }
        (0, folder_test_1.folderTest)("Dynamic folder test ", (input) => facade.performQuery(input), "./test/resources/queries2.0", {
            errorValidator,
            assertOnError,
            assertOnResult
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map