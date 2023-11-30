import jsZip from "jszip";
import {Section} from "./DatasetInterface";
import {InsightError} from "./IInsightFacade";

export default class AddSections {

	// takes a zip file and return an array of sections
	public async readSectionsFromZip(content: string): Promise<Section[]> {
		let files: string[] = await this.readZipToFiles(content);
		return this.readFileToSections(files);
	}

	// parse the base-64 encoded content of a zip file to jason files
	// Reference: https://stuk.github.io/jszip/documentation/howto/read_zip.html
	// Reference: https://www.tabnine.com/code/javascript/functions/jszip/JSZip/loadAsync
	// Reference: https://stuk.github.io/jszip/documentation/api_jszip/for_each.html
	// Reference: https://stuk.github.io/jszip/documentation/api_zipobject.html
	public async readZipToFiles(content: string): Promise<any> {

		const zip = new jsZip();
		let readFiles: Array<Promise<string>> = [];

		// load the content of the zip file that is in folder "courses"
		try {
			await zip.loadAsync(content, {base64: true});
		} catch (error) {
			return Promise.reject(new InsightError("invalid zip file"));
		}

		// check if the folder name is "courses", if not, throw an InsightError
		let temp = Object.keys(zip.files);
		if (!temp.includes("courses/")) {
			return Promise.reject(new InsightError("invalid zip file"));
		}

		// read the content of the zip file
		zip.forEach(function (relativePath, file) {
			readFiles.push(file.async("text"));
		});

		// Resolve the promises contained in readFiles
		let files: string[] = await Promise.all(readFiles);

		return Promise.resolve(files);
	}

	// Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
	// reference: https://www.freecodecamp.org/news/how-to-convert-a-string-to-a-number-in-javascript/
	public readFileToSections(files: string[]): Section[] {

		let sections: Section[] = [];

		for (let file of files) {

			// if a file start with "{"result":[", then it is a valid course
			if (file.startsWith("{\"result\":[")) {

				let courseSections = JSON.parse(file).result; // returns arrays of sections

				for (let temp of courseSections) {

					let section: Section = {
						dept: temp.Subject,
						id: temp.Course,
						avg: temp.Avg,
						instructor: temp.Professor,
						title: temp.Title,
						pass: temp.Pass,
						fail: temp.Fail,
						audit: temp.Audit,
						uuid: temp.id.toString(),
						year: temp.Section === "overall" ? 1900 : parseInt(temp.Year, 10)
					};

					if (this.isSectionValid(section)) {
						sections.push(section);
					}
				}
			}
		}

		if (sections.length === 0) {
			throw new InsightError("no valid section");
		}

		return sections;
	}

	// check if the section has all the required fields
	private isSectionValid(section: Section): boolean {
		return !(section.dept === undefined || section.id === undefined || section.avg === undefined ||
			section.instructor === undefined || section.title === undefined ||
			section.pass === undefined || section.fail === undefined || section.audit === undefined ||
			section.uuid === undefined || section.year === undefined);
	}
}
