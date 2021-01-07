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

module.exports = router;