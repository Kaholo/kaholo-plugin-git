var git = require ("simple-git");

function clone(action, settings) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let user = action.params.USER;
		let password = action.params.PASSWORD || settings.PASSWORD;
		let repo = action.params.REPO;
		let folder = action.params.FOLDER;
		let remote = `https://${user}:${password}@github.com/${user}/${repo}`;
		git()
			.outputHandler(function(command, stdout, stderr){
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.silent(true)
			.clone(remote, folder, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
			})
	})

}

function checkOutBranch(action) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let branch = action.params.BRANCH;
		let folder = action.params.FOLDER;
		git(folder)
			.outputHandler((command, stdout, stderr) => {
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.checkout(branch, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
		})
	})

}


function pull(action, settings) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let user = action.params.USER;
		let password = action.params.PASSWORD || settings.PASSWORD;
		let repo = action.params.REPO;
		let folder = action.params.FOLDER;
		let remote = `https://${user}:${password}@github.com/${user}/${repo}`;
		git(folder)
			.outputHandler((command, stdout, stderr) => {
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.pull(remote, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
		})
	})
}


function pushTag(action, settings) {
	return new Promise((resolve,reject) => {
		let stdErr = '';
		let stdOut = '';
		let user = action.params.USER;
		let password = action.params.PASSWORD || settings.PASSWORD;
		let repo = action.params.REPO;
		let folder = action.params.FOLDER;
		let remote = `https://${user}:${password}@github.com/${user}/${repo}`;
		git(folder)
			.outputHandler((command, stdout, stderr) => {
				stderr.on('data', function (data) {
					stdOut += data.toString();
				});

				stdout.on('data', function (data) {
					stdErr += data.toString();
				});
			})
			.pushTags(remote, function (err, res) {
				if (err)
					return reject(err || {output : stdErr});
				resolve(res || {output : stdOut});
			})
	})
}

module.exports = {
	clone: clone,
	checkOutBranch: checkOutBranch,
	pull: pull,
	pushTag: pushTag

}