"use strict";
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
        sections = getContentFromArchives("pair.zip");
        sections1 = getContentFromArchives("wrongData.zip");
        sections2 = getContentFromArchives("noCourse.zip");
        sections3 = getContentFromArchives("invalidSection.zip");
        sections4 = getContentFromArchives("notInCourses1.zip");
        sections5 = getContentFromArchives("notInCourses.zip");
        sections6 = getContentFromArchives("notResult.zip");
        smallSections = getContentFromArchives("smallPair.zip");
        clearDisk();
    });
    describe("Add/Remove/List Dataset", function () {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
        });
        beforeEach(function () {
            console.info(`BeforeTest: ${this.currentTest?.title}`);
            facade = new InsightFacade();
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
        });
        afterEach(function () {
            console.info(`AfterTest: ${this.currentTest?.title}`);
            clearDisk();
        });
        it("should reject with  an empty dataset id", function () {
            const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with id having underscore", function () {
            const result = facade.addDataset("test_course", sections, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with id having only space", function () {
            const result = facade.addDataset("   ", sections, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject an invalid kind", function () {
            const result = facade.addDataset("courses", sections, InsightDatasetKind.Rooms);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should fulfill on a successful add", function () {
            return facade.addDataset("courses", sections, InsightDatasetKind.Sections).then((ids) => {
                expect(ids).to.deep.equal(["courses"]);
                return facade.listDatasets();
            }).then((dataSetList) => {
                return expect(dataSetList).to.deep.equal([{
                        id: "courses",
                        kind: InsightDatasetKind.Sections, numRows: 64612
                    }]);
            });
        });
        it("the dataset with same ID should be rejected and not saved", function () {
            return facade.addDataset("course", sections, InsightDatasetKind.Sections).then(() => {
                const result = facade.addDataset("course", sections, InsightDatasetKind.Sections);
                return expect(result).to.eventually.be.rejectedWith(InsightError);
            });
        });
        it("should reject with an invalid zip file", function () {
            const result = facade.addDataset("course", sections1, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with an invalid dataset", function () {
            const result = facade.addDataset("course", "hello", InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with an zip without course", function () {
            const result = facade.addDataset("course", sections2, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with an zip without valid SectionDataset.ts", function () {
            const result = facade.addDataset("course", sections3, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with an zip with valid sections but not in Courses folder", function () {
            const result = facade.addDataset("course", sections4, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with an zip with valid sections not in Courses folder", function () {
            const result = facade.addDataset("course", sections5, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with a SectionDataset.ts without result tag", function () {
            const result = facade.addDataset("course", sections6, InsightDatasetKind.Sections);
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should add two different dataset successfully", async function () {
            await facade.addDataset("course", smallSections, InsightDatasetKind.Sections);
            const result1 = await facade.addDataset("course1", smallSections, InsightDatasetKind.Sections);
            return expect(result1).to.deep.equal(["course", "course1"]);
        });
        it("should reject with removing a empty dataset id", function () {
            const result = facade.removeDataset("");
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with removing a dataset id which contains underscore", function () {
            const result = facade.removeDataset("_");
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with removing a whitespace dataset id", function () {
            const result = facade.removeDataset(" ");
            return expect(result).to.eventually.be.rejectedWith(InsightError);
        });
        it("should reject with removing a dataset id which hasn't been added yet", function () {
            return facade.addDataset("id1", smallSections, InsightDatasetKind.Sections).then((idList) => {
                const result = facade.removeDataset("id2");
                return expect(result).to.eventually.be.rejectedWith(NotFoundError);
            });
        });
        it("should resolve with adding and deleting the same dataset id", function () {
            return facade.addDataset("cs", smallSections, InsightDatasetKind.Sections).then((idList) => {
                const result = facade.removeDataset("cs");
                return expect(result).to.eventually.be.deep.equal("cs");
            });
        });
        it("should reject with adding and deleting the same dataset id twice", async function () {
            return facade.addDataset("cs", smallSections, InsightDatasetKind.Sections).then(async () => {
                await facade.removeDataset("cs");
                const result = facade.removeDataset("cs");
                return expect(result).to.eventually.be.rejectedWith(NotFoundError);
            });
        });
    });
    describe("PerformQuery", () => {
        before(function () {
            console.info(`Before: ${this.test?.parent?.title}`);
            facade = new InsightFacade();
            const loadDatasetPromises = [
                facade.addDataset("sections", sections, InsightDatasetKind.Sections),
                facade.addDataset("sect", sections, InsightDatasetKind.Sections),
            ];
            return Promise.all(loadDatasetPromises);
        });
        after(function () {
            console.info(`After: ${this.test?.parent?.title}`);
            clearDisk();
        });
        folderTest("Dynamic InsightFacade PerformQuery tests", (input) => facade.performQuery(input), "./test/resources/queries", {
            assertOnResult: (actual, expected) => {
                expect(expected).to.have.deep.members(actual);
            },
            errorValidator: (error) => error === "ResultTooLargeError" || error === "InsightError",
            assertOnError: (actual, expected) => {
                if (expected === "InsightError") {
                    expect(actual).to.be.an.instanceOf(InsightError);
                }
                else if (expected === "ResultTooLargeError") {
                    expect(actual).to.be.an.instanceOf(ResultTooLargeError);
                }
                else {
                    expect(actual).to.be.an.instanceOf(NotFoundError);
                }
            },
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map