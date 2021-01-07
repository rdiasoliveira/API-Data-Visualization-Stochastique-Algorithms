const fs = require('fs');
const router = require('express').Router();
const basePath = 'public/data/';

async function readDirectory(path) {
	try {
		return fs.promises.readdir(path, { "withFileTypes": true });
	} catch (err) {
		console.log(err);
	}
}

/**
 * @GET / READ
 * @Route("/getDirectories/")
 */
router.get('/getDirectories/', async function (request, response) {
	try {
		const files = await readDirectory(basePath);
		const directories = files.reduce((finalArray, file) => {
			if(file.isDirectory()) finalArray.push(file.name + "/");
			return finalArray;
		}, []);
		console.log(directories);
		response.status(200).json(directories);
	} catch (err) {
		response.status(500).json(err);
	}
});

async function readFile(path) {
	try {
		return fs.promises.readFile(path, "UTF-8");
	} catch (err) {
		console.log(err);
	}
}

/**
 * @GET / READ
 * @Route("/getData/:config")
 */
router.get('/getData/:config', async (request, response) => {
	try {
		const data = {};
		const config = JSON.parse(request.params.config);
		config.dataPath = basePath + config.dataPath;

		const dirents = await readDirectory(config.dataPath);
		const directories = dirents.filter(file => file.isDirectory());

		let filesPerDirectory = await Promise.all(directories.map((directory) => readDirectory(config.dataPath + directory.name)));

		filesPerDirectory = filesPerDirectory.reduce((arr, files) => {
			const f = files.filter(file => file.isFile() && file.name.match(new RegExp(config.filePattern, "g")));
			if (f.length > 0) arr.push(f);
			return arr;
		}, []);

		filesPerDirectory.forEach((filesInDirectory, i) => {
			var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
			filesPerDirectory[i] = filesInDirectory.sort((fileA, fileB) => fileA.name.localeCompare(fileB.name, undefined, {
				numeric: true,
				sensitivity: 'base'
			}));
		});

		const filesContentPerDirectory = await Promise.all(filesPerDirectory.map((directory, i) => {
			return Promise.all(directory.map((file) => readFile(config.dataPath + directories[i].name + "/" + file.name)));
		}));

		data["directories"] = [];
		filesPerDirectory.forEach((filesInDirectory, i) => {
			const obj = {};
			obj["directoryName"] = directories[i].name;
			obj["files"] = [];

			filesInDirectory.forEach((file, j) => {
				const fileObj = {};
				fileObj["filename"] = file.name;
				fileObj["filedata"] = [];

				const fileContentSplitted = filesContentPerDirectory[i][j].split(/\r?\n|\r/).map(line => line.split(config.delimiter));
				if (fileContentSplitted.length > 0 && fileContentSplitted[fileContentSplitted.length - 1][0] === '') fileContentSplitted.pop();

				fileContentSplitted.forEach((content, l) => {
					if (l == 0) {
						content.forEach((line, k) => {
							const fileContent = {};
							if (config.ignoreFirstLine) {
								fileContent["columnName"] = line;
								fileContent["data"] = [];
								fileObj["filedata"].push(fileContent);
							} else {
								fileContent["columnName"] = "Column-" + (k + 1);
								fileContent["data"] = [parseFloat(line)];
								fileObj["filedata"].push(fileContent);
							}
						});
					} else {
						content.forEach((line, k) => {
							fileObj["filedata"][k]["data"].push(parseFloat(line));
						});
					}
				});

				obj["files"].push(fileObj);
				//if (data["folders"][i].length === 0) delete fileObj["fileContent"][i];
			});
			data["directories"].push(obj);
			console.log(data);
		});
		response.status(200).json(data);
	} catch (err) {
		console.log(err);
		response.status(400).json("Unable to parse with the settings received.\nError : " + err);
	}
});

module.exports = router;